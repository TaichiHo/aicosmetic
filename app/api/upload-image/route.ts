import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@clerk/nextjs";

// Since we're using Next.js 13+ App Router, we need to disable the default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to read the stream into a buffer
async function streamToBuffer(stream: ReadableStream): Promise<Buffer> {
  const chunks = [];
  const reader = stream.getReader();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  
  return Buffer.concat(chunks);
}

export async function POST(request: Request) {
  try {
    // Check authentication
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the form data
    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No image provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, message: "Invalid file type" },
        { status: 400 }
      );
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: "File too large" },
        { status: 400 }
      );
    }

    // Initialize S3 client
    const s3Client = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_AK!,
        secretAccessKey: process.env.AWS_SK!,
      },
    });

    // Generate unique file name
    const fileExtension = file.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}.${fileExtension}`;
    const key = `products/${fileName}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET!,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    // Generate the image URL
    const imageUrl = `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return NextResponse.json({
      success: true,
      imageUrl,
    });
  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json(
      { success: false, message: "Failed to upload image" },
      { status: 500 }
    );
  }
} 