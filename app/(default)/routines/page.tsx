import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { getUserRoutines } from '@/models/routine';
import RoutinesView from './RoutinesView';

export default async function RoutinesPage() {
  const { userId } = auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const routines = await getUserRoutines(userId);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Beauty Routines</h1>
      <RoutinesView initialRoutines={routines} />
    </div>
  );
} 