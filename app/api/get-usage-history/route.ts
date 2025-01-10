import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { getUsageHistory } from "@/models/usageHistory";
import { getUserProductById } from "@/models/userProduct";

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
    const userProductId = searchParams.get('userProductId');

    if (!userProductId) {
      return NextResponse.json(
        { success: false, message: "User product ID is required" },
        { status: 400 }
      );
    }

    // Verify the user product exists and belongs to the current user
    const userProduct = await getUserProductById(parseInt(userProductId));
    if (!userProduct || userProduct.clerk_id !== userId) {
      return NextResponse.json(
        { success: false, message: "Product not found or unauthorized" },
        { status: 404 }
      );
    }

    const usageHistory = await getUsageHistory(parseInt(userProductId));

    return NextResponse.json({
      success: true,
      usageHistory
    });
  } catch (error) {
    console.error("Get usage history failed:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get usage history" },
      { status: 500 }
    );
  }
} 