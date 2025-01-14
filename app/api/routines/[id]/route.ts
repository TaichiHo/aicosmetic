import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { getRoutineById, updateRoutine } from '@/models/routine';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const routine = await getRoutineById(parseInt(params.id));
    if (!routine) {
      return NextResponse.json({ error: 'Routine not found' }, { status: 404 });
    }

    if (routine.clerk_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const updatedRoutine = await updateRoutine(
      parseInt(params.id),
      name,
      description
    );

    return NextResponse.json(updatedRoutine);
  } catch (error) {
    console.error('Error updating routine:', error);
    return NextResponse.json(
      { error: 'Failed to update routine' },
      { status: 500 }
    );
  }
} 