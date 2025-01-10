import { getDb } from "./db";

export async function recordUsage(userProductId: number, usagePercentage: number): Promise<void> {
  const db = getDb();
  await db.query(
    `INSERT INTO usage_history (user_product_id, usage_percentage)
     VALUES ($1, $2)`,
    [userProductId, usagePercentage]
  );
}

export async function getUsageHistory(userProductId: number): Promise<{ usage_date: Date, usage_percentage: number }[]> {
  const db = getDb();
  const result = await db.query(
    `SELECT usage_date, usage_percentage
     FROM usage_history
     WHERE user_product_id = $1
     ORDER BY usage_date DESC`,
    [userProductId]
  );
  return result.rows;
} 