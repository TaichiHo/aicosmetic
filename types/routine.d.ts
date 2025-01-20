import { UserProductWithDetails } from './userProduct';

export interface Routine {
  id: number;
  clerk_id: string;
  name: string;
  description?: string;
  created_at: Date;
  uuid: string;
}

export interface UserStep {
  id: number;
  clerk_id: string;
  name: string;
  created_at: Date;
  uuid: string;
}

export interface RoutineStepProduct {
  id: number;
  routine_step_id: number;
  user_product_id: number;
  notes?: string;
  created_at: Date;
  uuid: string;
  user_product?: UserProductWithDetails;
}

export interface RoutineStep {
  id: number;
  routine_id: number;
  step_order: number;
  user_step_id: number;
  user_step: UserStep;
  created_at: Date;
  uuid: string;
  products: RoutineStepProduct[];
}

export interface RoutineWithSteps extends Routine {
  steps: RoutineStep[];
} 