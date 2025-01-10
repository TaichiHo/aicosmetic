import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { recordUsage } from "@/models/usageHistory";

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
    const { userProductId, usagePercentage } = body;

    if (!userProductId || usagePercentage === undefined) {
      return NextResponse.json(
        { success: false, message: "User product ID and usage percentage are required" },
        { status: 400 }
      );
    }

    await recordUsage(userProductId, usagePercentage);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Record usage failed:", error);
    return NextResponse.json(
      { success: false, message: "Failed to record usage" },
      { status: 500 }
    );
  }
} 