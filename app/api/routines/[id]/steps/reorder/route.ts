import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { getDb } from '@/models/db';
import { getRoutineById } from '@/models/routine';

export async function PUT(
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
    const { steps } = body;

    if (!Array.isArray(steps)) {
      return NextResponse.json(
        { error: 'Steps must be an array' },
        { status: 400 }
      );
    }

    const db = getDb();
    await db.query('BEGIN');
    try {
      // First, temporarily set step_order to negative values to avoid conflicts
      await db.query(
        `UPDATE routine_steps 
         SET step_order = -step_order 
         WHERE routine_id = $1`,
        [routine.id]
      );

      // Then update to the new order
      await db.query(
        `UPDATE routine_steps 
         SET step_order = data_table.step_order
         FROM (SELECT unnest($1::int[]) as id, unnest($2::int[]) as step_order) as data_table
         WHERE routine_steps.id = data_table.id`,
        [
          steps.map(s => s.id),
          steps.map(s => s.step_order)
        ]
      );

      await db.query('COMMIT');
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering steps:', error);
    return NextResponse.json(
      { error: 'Failed to reorder steps' },
      { status: 500 }
    );
  }
} 