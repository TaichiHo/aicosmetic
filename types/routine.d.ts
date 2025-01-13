import { UserProductWithDetails } from './userProduct';

export type TimeOfDay = 'morning' | 'evening' | 'both';

export interface Routine {
  id: number;
  clerk_id: string;
  name: string;
  description?: string;
  time_of_day: TimeOfDay;
  created_at: Date;
  uuid: string;
}

export interface RoutineProduct {
  id: number;
  routine_id: number;
  user_product_id: number;
  step_order: number;
  notes?: string;
  created_at: Date;
  uuid: string;
  user_product?: UserProductWithDetails;
}

export interface RoutineWithProducts extends Routine {
  products: RoutineProduct[];
} 