import { getDb } from "./db";
import { Order } from "@/types/order";

export async function createOrder(order: Omit<Order, 'id' | 'created_at'>): Promise<Order> {
  const db = getDb();
  const result = await db.query(
    `INSERT INTO orders (
      order_no, clerk_id, amount, plan, credits, currency,
      order_status, created_at, expired_at, paid_at, stripe_session_id
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, $8, $9, $10
    ) RETURNING *`,
    [
      order.order_no,
      order.clerk_id,
      order.amount,
      order.plan,
      order.credits,
      order.currency,
      order.order_status,
      order.expired_at,
      order.paid_at,
      order.stripe_session_id
    ]
  );
  return result.rows[0];
}

export async function getOrderByNo(orderNo: string): Promise<Order | null> {
  const db = getDb();
  const result = await db.query(
    `SELECT * FROM orders WHERE order_no = $1`,
    [orderNo]
  );
  return result.rows[0] || null;
}

export async function getUserOrders(clerkId: string): Promise<Order[]> {
  const db = getDb();
  const result = await db.query(
    `SELECT * FROM orders 
     WHERE clerk_id = $1 
     ORDER BY created_at DESC`,
    [clerkId]
  );
  return result.rows;
}

export async function updateOrderStatus(
  orderNo: string,
  status: number,
  paidAt?: Date,
  stripeSessionId?: string
): Promise<Order | null> {
  const db = getDb();
  const result = await db.query(
    `UPDATE orders 
     SET order_status = $2,
         paid_at = $3,
         stripe_session_id = $4
     WHERE order_no = $1
     RETURNING *`,
    [orderNo, status, paidAt, stripeSessionId]
  );
  return result.rows[0] || null;
}

export async function getUserCredits(clerkId: string): Promise<number> {
  const db = getDb();
  const result = await db.query(
    `SELECT COALESCE(SUM(credits), 0) as total_credits
     FROM orders
     WHERE clerk_id = $1 AND order_status = 1`,
    [clerkId]
  );
  return parseInt(result.rows[0].total_credits);
}
