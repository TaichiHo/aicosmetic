import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createProduct, getProductByBarcode } from "@/models/product";
import { createUserProduct } from "@/models/userProduct";

const promptTemplate = `
Analyze this cosmetic product image and identify all visible cosmetic products. For each product, extract the following information in a JSON array format:
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

Be as accurate as possible with the information you can see in the image.
If you can't determine certain fields for a product, use null for those values.
If you can only partially identify a product, still include it with available information.
List products from most visible/clear to least visible in the image.
`;

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, message: "No image URL provided" },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const imageResponse = await fetch(imageUrl);
    console.log("imageUrl", imageUrl);

    const imageData = await imageResponse.arrayBuffer();
    const mimeType = imageResponse.headers.get("content-type") || "image/jpeg";

    const result = await model.generateContent([
      promptTemplate,
      {
        inlineData: {
          data: Buffer.from(imageData).toString("base64"),
          mimeType,
        },
      },
    ]);

    const response = await result.response;
    const responseText = response.text();
    
    // Extract JSON array content using regex
    const jsonMatch = (await responseText).match(/\[[\s\S]*\]/);
    const jsonString = jsonMatch ? jsonMatch[0] : '[]';
    const productsInfo = JSON.parse(jsonString);

    // Process each identified product
    const createdProducts = [];
    for (const productInfo of productsInfo) {
      // If barcode is available, check if product already exists
      let product = null;
      if (productInfo.barcode) {
        product = await getProductByBarcode(productInfo.barcode);
      }

      // If product doesn't exist, create it
      if (!product) {
        const categoryMap: { [key: string]: number } = {
          Skincare: 1,
          Makeup: 2,
          Haircare: 3,
          Fragrance: 4,
          "Body Care": 5,
          Tools: 6,
        };

        product = await createProduct({
          name: productInfo.name,
          brand: productInfo.brand,
          category_id: categoryMap[productInfo.category] || 1,
          description: productInfo.description,
          image_url: imageUrl,
          barcode: productInfo.barcode,
          size_value: productInfo.size_value ? parseFloat(productInfo.size_value) : undefined,
          size_unit: productInfo.size_unit,
          standard_size: productInfo.standard_size,
        });
      }

      // Create user product entry
      const userProduct = await createUserProduct({
        clerk_id: userId,
        product_id: product.id,
        usage_status: "new",
        usage_percentage: 0,
      });

      createdProducts.push({
        productId: product.id,
        userProductId: userProduct.id,
        ...productInfo,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        products: createdProducts,
        count: createdProducts.length,
      },
    });
  } catch (error) {
    console.error("Product identification failed:", error);
    return NextResponse.json(
      { success: false, message: "Failed to identify products" },
      { status: 500 }
    );
  }
} 