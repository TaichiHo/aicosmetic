import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { addProductToRoutine, getRoutineById, updateRoutineProduct, deleteRoutineProduct } from '@/models/routine';

export async function POST(
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
    const { user_product_id, step_order, notes } = body;

    if (!user_product_id || step_order === undefined) {
      return NextResponse.json(
        { error: 'Product ID and step order are required' },
        { status: 400 }
      );
    }

    const routineProduct = await addProductToRoutine(
      routine.id,
      user_product_id,
      step_order,
      notes
    );

    return NextResponse.json(routineProduct);
  } catch (error) {
    console.error('Error adding product to routine:', error);
    return NextResponse.json(
      { error: 'Failed to add product to routine' },
      { status: 500 }
    );
  }
}

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
    const { routine_product_id, step_order, notes } = body;

    if (!routine_product_id || step_order === undefined) {
      return NextResponse.json(
        { error: 'Routine product ID and step order are required' },
        { status: 400 }
      );
    }

    const routineProduct = await updateRoutineProduct(
      routine_product_id,
      step_order,
      notes
    );

    if (!routineProduct) {
      return NextResponse.json(
        { error: 'Routine product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(routineProduct);
  } catch (error) {
    console.error('Error updating routine product:', error);
    return NextResponse.json(
      { error: 'Failed to update routine product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const { searchParams } = new URL(request.url);
    const routineProductId = searchParams.get('routineProductId');

    if (!routineProductId) {
      return NextResponse.json(
        { error: 'Routine product ID is required' },
        { status: 400 }
      );
    }

    await deleteRoutineProduct(parseInt(routineProductId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting routine product:', error);
    return NextResponse.json(
      { error: 'Failed to delete routine product' },
      { status: 500 }
    );
  }
} 