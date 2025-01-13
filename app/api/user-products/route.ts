import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { getUserProducts } from '@/models/userProduct';

export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const products = await getUserProducts(userId);
    return NextResponse.json({
      data: products
    });
  } catch (error) {
    console.error('Error getting user products:', error);
    return NextResponse.json(
      { error: 'Failed to get user products' },
      { status: 500 }
    );
  }
} 