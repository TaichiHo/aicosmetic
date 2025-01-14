import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { 
  getRoutineById, 
  createRoutineStep,
  addProductToStep,
  updateRoutineStep,
  deleteRoutineStep,
  deleteRoutineStepProduct
} from '@/models/routine';

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
    const { user_product_id, step_order, step_name, step_id, notes } = body;

    if (!user_product_id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    let routineStepId: number;

    if (step_id) {
      // Verify the step exists and belongs to this routine
      const step = routine.steps.find(s => s.id === step_id);
      if (!step) {
        return NextResponse.json(
          { error: 'Step not found' },
          { status: 404 }
        );
      }
      routineStepId = step_id;
    } else {
      // Create new step
      if (!step_name || step_order === undefined) {
        return NextResponse.json(
          { error: 'Step name and order are required for new steps' },
          { status: 400 }
        );
      }
      const step = await createRoutineStep(routine.id, step_order, step_name);
      routineStepId = step.id;
    }

    // Add the product to the step
    const routineProduct = await addProductToStep(
      routineStepId,
      user_product_id,
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
    const { step_id, step_order, step_name } = body;

    if (!step_id || step_order === undefined || !step_name) {
      return NextResponse.json(
        { error: 'Step ID, order, and name are required' },
        { status: 400 }
      );
    }

    const step = await updateRoutineStep(
      step_id,
      step_order,
      step_name
    );

    if (!step) {
      return NextResponse.json(
        { error: 'Step not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(step);
  } catch (error) {
    console.error('Error updating routine step:', error);
    return NextResponse.json(
      { error: 'Failed to update routine step' },
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
    const stepId = searchParams.get('stepId');
    const productId = searchParams.get('productId');

    if (!stepId && !productId) {
      return NextResponse.json(
        { error: 'Step ID or product ID is required' },
        { status: 400 }
      );
    }

    if (stepId) {
      await deleteRoutineStep(parseInt(stepId));
    } else if (productId) {
      await deleteRoutineStepProduct(parseInt(productId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting routine step or product:', error);
    return NextResponse.json(
      { error: 'Failed to delete routine step or product' },
      { status: 500 }
    );
  }
} 