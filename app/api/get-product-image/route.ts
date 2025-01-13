import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CX = process.env.GOOGLE_CUSTOM_SEARCH_CX;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

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

export async function getProductImage(brand: string | null, name: string | null) {
  if (!brand || !name) {
    return NextResponse.json(
      { success: false, message: "Brand and name are required" },
      { status: 400 }
    );
  }

  // Try Sephora first
  const productQuery = `${brand} ${name}`;
  console.log('Searching Sephora for:', productQuery);
  let imageResult = await searchGoogleImages(productQuery, "sephora.com").catch((error) => {
    console.error('Sephora search failed:', error);
    return null;
  });

  // If no Sephora result, try Ulta
  if (!imageResult) {
    console.log('Searching Ulta for:', productQuery);
    imageResult = await searchGoogleImages(productQuery, "ulta.com").catch((error) => {
      console.error('Ulta search failed:', error);
      return null;
    });
  }

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

export async function GET(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const brand = searchParams.get("brand");
    const name = searchParams.get("name");

    const imageResult = await getProductImage(brand, name);

    if (!imageResult) {
      return NextResponse.json(
        { success: false, message: "No image found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        imageUrl: imageResult.link,
        thumbnailUrl: imageResult.image.thumbnailLink,
        sourceUrl: imageResult.image.contextLink,
        title: imageResult.title,
        source: imageResult.image.contextLink.includes("sephora.com") ? "sephora" :
               imageResult.image.contextLink.includes("ulta.com") ? "ulta" : "other"
      }
    });

  } catch (error) {
    console.error("Failed to fetch product image:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch product image" },
      { status: 500 }
    );
  }
} 