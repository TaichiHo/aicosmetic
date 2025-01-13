import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { getRoutineById } from '@/models/routine';
import RoutineDetailView from './RoutineDetailView';

interface RoutineDetailPageProps {
  params: {
    id: string;
  };
}

export default async function RoutineDetailPage({ params }: RoutineDetailPageProps) {
  const { userId } = auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const routine = await getRoutineById(parseInt(params.id));
  console.log("routine", routine);
  if (!routine) {
    redirect('/routines');
  }

  if (routine.clerk_id !== userId) {
    redirect('/routines');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <RoutineDetailView routine={routine} />
    </div>
  );
} 