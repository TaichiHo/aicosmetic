import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createRoutine, getUserRoutines } from '@/models/routine';
import { createUserStep, getUserSteps } from '@/models/userStep';
import { createRoutineStep, addProductToStep } from '@/models/routine';

interface SelectedProduct {
  user_product_id: number;
  notes: string;
  step_name: string;
  order: number;
}

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, selectedProducts } = body as {
      name: string;
      description: string;
      selectedProducts: SelectedProduct[];
    };

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Create the routine first
    const routine = await createRoutine(userId, name, description);

    // If there are selected products, create steps and add products to them
    if (selectedProducts && selectedProducts.length > 0) {
      // Get existing user steps
      const userSteps = await getUserSteps(userId);
      
      // Group products by step name
      const productsByStep = selectedProducts.reduce((acc: Record<string, SelectedProduct[]>, product: SelectedProduct) => {
        if (!acc[product.step_name]) {
          acc[product.step_name] = [];
        }
        acc[product.step_name].push(product);
        return acc;
      }, {});

      // Process each step and its products
      for (const [stepName, products] of Object.entries(productsByStep)) {
        let userStepId;
        
        // Check if step name already exists
        const existingStep = userSteps.find(step => step.name === stepName);
        if (existingStep) {
          userStepId = existingStep.id;
        } else {
          // Create new user step if it doesn't exist
          const newStep = await createUserStep(userId, stepName);
          userStepId = newStep.id;
        }

        // Create routine step
        const routineStep = await createRoutineStep(routine.id, products[0].order, userStepId) ;

        // Add all products to the step
        await Promise.all(products.map(product => 
          addProductToStep(routineStep.id, product.user_product_id, product.notes)
        ));
      }
    }

    // Fetch the complete routine with steps and products
    const completeRoutine = await getUserRoutines(userId);
    const createdRoutine = completeRoutine.find(r => r.id === routine.id);
    return NextResponse.json(createdRoutine);
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
    console.error('Error fetching routines:', error);
    return NextResponse.json(
      { error: 'Failed to fetch routines' },
      { status: 500 }
    );
  }
} 