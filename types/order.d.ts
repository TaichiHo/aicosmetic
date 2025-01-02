export interface Order {
  id: number;
  order_no: string;
  clerk_id: string;
  amount: number;
  plan: string;
  credits: number;
  currency: string;
  order_status: number; // 0: pending, 1: paid, 2: cancelled
  created_at: Date;
  expired_at?: Date;
  paid_at?: Date;
  stripe_session_id?: string;
}
