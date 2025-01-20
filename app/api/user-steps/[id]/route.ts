import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { getUserStepById, deleteUserStep } from '@/models/userStep';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const step = await getUserStepById(parseInt(params.id));
    if (!step) {
      return NextResponse.json({ error: 'Step not found' }, { status: 404 });
    }

    if (step.clerk_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await deleteUserStep(parseInt(params.id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user step:', error);
    return NextResponse.json(
      { error: 'Failed to delete user step' },
      { status: 500 }
    );
  }
} 