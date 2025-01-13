import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createProduct, getProductByBrandAndName } from "@/models/product";
import { createUserProduct, getUserProductByClerkIdAndProductId } from "@/models/userProduct";
import { createProductImage } from "@/models/productImage";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from 'uuid';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CX = process.env.GOOGLE_CUSTOM_SEARCH_CX;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-west-1',
  credentials: {
    accessKeyId: process.env.AWS_AK || '',
    secretAccessKey: process.env.AWS_SK || ''
  }
});

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function searchGoogleImages(query: string, site?: string): Promise<any> {
  const siteRestriction = site ? `site:${site}` : "";
  const searchQuery = encodeURIComponent(`${query} ${siteRestriction}`);
  
  let lastError = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${searchQuery}&searchType=image&num=1&imgType=photo`
      );

      if (!response.ok) {
        throw new Error(`Google API responded with status: ${response.status}`);
      }

      const data = await response.json();
      return data.items?.[0];
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt} failed:`, error);
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY * attempt); // Exponential backoff
        continue;
      }
    }
  }
  
  throw lastError;
}

async function getProductImage(brand: string, name: string) {
  const productQuery = `${brand} ${name}`;

  let imageResult
  // If still no result, try general search
  if (!imageResult) {
    console.log('Trying general search for:', productQuery);
    imageResult = await searchGoogleImages(`${productQuery} cosmetic product`).catch((error) => {
      console.error('General search failed:', error);
      return null;
    });
  }
  return imageResult;
}

async function uploadToS3(file: Blob, fileName: string): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const key = `user-uploads/${fileName}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    })
  );

  return `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check content type
    const contentType = req.headers.get('content-type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: "Content type must be multipart/form-data" },
        { status: 400 }
      );
    }

    let formData;
    try {
      formData = await req.formData();
    } catch (error) {
      console.error('Error parsing form data:', error);
      return NextResponse.json(
        { error: "Failed to parse form data" },
        { status: 400 }
      );
    }

    const image = formData.get("image");
    if (!image || !(image instanceof Blob)) {
      return NextResponse.json(
        { error: "Image file is required" },
        { status: 400 }
      );
    }

    // Convert image to base64 for Gemini
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Analyze this cosmetic product image and identify all visible cosmetic products. For each product, extract the following information in a JSON array format:
    [
      {
        "name": "Full product name",
        "brand": "Brand name",
        "category": "Category (one of: Skincare, Makeup, Haircare, Fragrance, Body Care, Tools)",
        "description": "Brief product description",
        "size_value": "Numerical size value (if visible)",
        "size_unit": "Unit of measurement (ml, g, oz, etc.)",
        "standard_size": "Size category (Full Size, Travel Size, Mini)",
        "barcode": "Barcode number if visible (or null)",
        "confidence": "Your confidence level in the identification (high, medium, low)",
        "location": "Brief description of where this product appears in the image (e.g., 'left side', 'center', 'top right')"
      }
    ]

    Important:
    - Only include products where you can identify at least the brand and product name with high or medium confidence
    - Skip any products that are too blurry, partially hidden, or cannot be identified with reasonable certainty
    - For included products, be as accurate as possible with the information you can see
    - If certain fields cannot be determined for an included product, use null for those values
    - List products from most visible/clear to least visible in the image`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: image.type || "image/jpeg",
          data: base64Image
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    console.log("Gemini response:", text);

    let products;
    try {
      // Extract JSON array from markdown code block if present
      const jsonMatch = text.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : text;
      products = JSON.parse(jsonString);

      if (!Array.isArray(products)) {
        throw new Error('Response is not an array');
      }
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      console.error('Raw response:', text);
      return NextResponse.json(
        { error: "Failed to parse product information" },
        { status: 500 }
      );
    }

    const createdProducts = [];
    let s3ImageUrl: string | undefined;

    for (const productInfo of products) {
      // Get category ID based on name
      const categoryMap: { [key: string]: number } = {
        'Skincare': 1,
        'Makeup': 2,
        'Haircare': 3,
        'Fragrance': 4,
        'Body Care': 5,
        'Tools': 6
      };
      const categoryId = categoryMap[productInfo.category];
      if (!categoryId) {
        console.error(`Category not found: ${productInfo.category}`);
        continue;
      }

      // Check if product already exists
      let product = await getProductByBrandAndName(productInfo.brand, productInfo.name);
      let isNewProduct = false;

      if (!product) {
        isNewProduct = true;
        // Search for product image only if it's a new product
        const imageResult = await getProductImage(productInfo.brand, productInfo.name);
        const imageUrl = imageResult?.link;
        const thumbnailUrl = imageResult?.image?.thumbnailLink;
        const sourceUrl = imageResult?.image?.contextLink;
        const source = sourceUrl?.includes("sephora.com") ? "sephora" :
                      sourceUrl?.includes("ulta.com") ? "ulta" : "other";

        try {
          // Create product
          product = await createProduct({
            name: productInfo.name,
            brand: productInfo.brand,
            category_id: categoryId,
            description: productInfo.description,
            size_value: productInfo.size_value ? parseFloat(productInfo.size_value) : undefined,
            size_unit: productInfo.size_unit,
            standard_size: productInfo.standard_size,
            barcode: productInfo.barcode,
            image_url: imageUrl || undefined
          });

          // Store thumbnail if available
          if (product && thumbnailUrl) {
            await createProductImage(
              product.id,
              thumbnailUrl,
              'thumbnail',
              sourceUrl,
              source
            );
          }
        } catch (error) {
          console.error('Failed to create product:', error);
          continue;
        }
      }

      // If we still don't have a product, skip this iteration
      if (!product) {
        console.error('Failed to create or find product:', productInfo);
        continue;
      }

      try {
        // Check if user already has this product
        let userProduct = await getUserProductByClerkIdAndProductId(userId, product.id);
        let isNewUserProduct = false;

        if (!userProduct) {
          isNewUserProduct = true;

          // Upload image to S3 only if this is a new user product and we haven't uploaded it yet
          if (!s3ImageUrl) {
            const fileName = `${uuidv4()}-${image.name || 'image.jpg'}`;
            s3ImageUrl = await uploadToS3(image, fileName);
          }

          // Create user product only if it doesn't exist
          userProduct = await createUserProduct({
            clerk_id: userId,
            product_id: product.id,
            usage_status: 'new',
            usage_percentage: 0,
            user_image_url: s3ImageUrl
          });
        }

        if (!userProduct) {
          console.error('Failed to create user product for product:', product.id);
          continue;
        }

        createdProducts.push({
          ...product,
          user_product: userProduct,
          confidence: productInfo.confidence,
          location: productInfo.location,
          isNewProduct,
          isNewUserProduct
        });
      } catch (error) {
        console.error('Failed to process user product:', error);
        continue;
      }
    }

    return NextResponse.json({
      data: createdProducts
    });

  } catch (error) {
    console.error("Error in identify-product:", error);
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }
} 