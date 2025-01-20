import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { getUserSteps } from '@/models/userStep';

export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const steps = await getUserSteps(userId);
    return NextResponse.json(steps);
  } catch (error) {
    console.error('Error fetching user steps:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user steps' },
      { status: 500 }
    );
  }
} 