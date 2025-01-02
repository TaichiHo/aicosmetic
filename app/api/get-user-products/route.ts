import { NextResponse } from "next/server";
import { getUserProducts } from "@/models/userProduct";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    console.log("userId", userId);
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const products = await getUserProducts(userId);
    console.log("products", userId, products);
    
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