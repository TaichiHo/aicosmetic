import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createRoutine, getUserRoutines } from '@/models/routine';
import { TimeOfDay } from '@/types/routine';

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, time_of_day, description } = body;

    if (!name || !time_of_day) {
      return NextResponse.json(
        { error: 'Name and time of day are required' },
        { status: 400 }
      );
    }

    if (!['morning', 'evening', 'both'].includes(time_of_day)) {
      return NextResponse.json(
        { error: 'Invalid time of day' },
        { status: 400 }
      );
    }

    const routine = await createRoutine(
      userId,
      name,
      time_of_day as TimeOfDay,
      description
    );

    return NextResponse.json(routine);
  } catch (error) {
    console.error('Error creating routine:', error);
    return NextResponse.json(
      { error: 'Failed to create routine' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const routines = await getUserRoutines(userId);
    return NextResponse.json(routines);
  } catch (error) {
    console.error('Error getting routines:', error);
    return NextResponse.json(
      { error: 'Failed to get routines' },
      { status: 500 }
    );
  }
} 