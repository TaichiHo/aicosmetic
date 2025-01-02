import { getDb } from "./db";
import { User, UserWithCredits } from "@/types/user";

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = getDb();
  const result = await db.query(
    "SELECT * FROM users WHERE email = $1 LIMIT 1",
    [email]
  );
  return result.rows[0] || null;
}

export async function createUser(
  email: string,
  clerk_id: string,
  nickname?: string,
  avatar_url?: string
): Promise<User> {
  const db = getDb();
  const result = await db.query(
    `INSERT INTO users (email, clerk_id, nickname, avatar_url, created_at, uuid) 
     VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, gen_random_uuid()) 
     RETURNING *`,
    [email, clerk_id, nickname, avatar_url]
  );
  return result.rows[0];
}

export async function getUserWithCredits(email: string): Promise<UserWithCredits | null> {
  const db = getDb();
  const result = await db.query(
    `SELECT u.*, 
            COALESCE(SUM(o.credits), 0) as left_credits
     FROM users u
     LEFT JOIN orders o ON u.id = o.user_id AND o.order_status = 1
     WHERE u.email = $1
     GROUP BY u.id
     LIMIT 1`,
    [email]
  );

  if (!result.rows[0]) return null;

  const user = result.rows[0];
  return {
    ...user,
    credits: {
      left_credits: parseInt(user.left_credits) || 0,
    },
  };
}
