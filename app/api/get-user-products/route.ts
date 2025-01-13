import { NextResponse } from "next/server";
import { getUserProducts } from "@/models/userProduct";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: Request) {
  try {
    const { userId } = auth();
    console.log("userId", userId);
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const products = await getUserProducts(userId);
    
    return NextResponse.json({
      data: products,
    });
  } catch (error) {
    console.error("Error fetching user products:", error);
    return NextResponse.json(
      { error: "Failed to fetch user products" },
      { status: 500 }
    );
  }
} 