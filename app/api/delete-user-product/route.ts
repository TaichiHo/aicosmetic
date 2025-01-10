import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { deleteUserProduct, getUserProductById } from "@/models/userProduct";

export async function DELETE(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userProductId } = body;

    if (!userProductId) {
      return NextResponse.json(
        { success: false, message: "User product ID is required" },
        { status: 400 }
      );
    }

    // Verify the user owns this product
    const userProduct = await getUserProductById(userProductId);
    console.log("User product ID:", userProductId);
    console.log("User product:", userProduct);
    console.log("User ID:", userId);
    console.log("User product clerk_id:", userProduct?.clerk_id);
    if (!userProduct || userProduct.clerk_id !== userId) {
      return NextResponse.json(
        { success: false, message: "Product not found or unauthorized" },
        { status: 404 }
      );
    }

    console.log("Deleting user product:", userProductId);

    // Delete the user product
    await deleteUserProduct(userProductId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete user product failed:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete product" },
      { status: 500 }
    );
  }
} 