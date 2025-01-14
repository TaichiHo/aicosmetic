import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { getDb } from '@/models/db';
import { getRoutineById } from '@/models/routine';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; stepId: string } }
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

    // Verify the step exists and belongs to this routine
    const step = routine.steps.find(s => s.id === parseInt(params.stepId));
    if (!step) {
      return NextResponse.json(
        { error: 'Step not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { step_name } = body;

    if (!step_name) {
      return NextResponse.json(
        { error: 'Step name is required' },
        { status: 400 }
      );
    }

    const db = getDb();
    const result = await db.query(
      `UPDATE routine_steps 
       SET step_name = $1
       WHERE id = $2 AND routine_id = $3
       RETURNING *`,
      [step_name, params.stepId, params.id]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating step name:', error);
    return NextResponse.json(
      { error: 'Failed to update step name' },
      { status: 500 }
    );
  }
} 