import { getDb } from './db';
import { UserStep } from '@/types/routine';

export async function getUserSteps(clerk_id: string): Promise<UserStep[]> {
  const db = getDb();
  const result = await db.query(
    `SELECT * FROM user_steps 
     WHERE clerk_id = $1 
     ORDER BY name ASC`,
    [clerk_id]
  );
  return result.rows;
}

export async function createUserStep(
  clerk_id: string,
  name: string
): Promise<UserStep> {
  const db = getDb();
  const result = await db.query(
    `INSERT INTO user_steps (clerk_id, name)
     VALUES ($1, $2)
     RETURNING *`,
    [clerk_id, name]
  );
  return result.rows[0];
}

export async function getUserStepById(id: number): Promise<UserStep | null> {
  const db = getDb();
  const result = await db.query(
    'SELECT * FROM user_steps WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

export async function deleteUserStep(id: number): Promise<void> {
  const db = getDb();
  await db.query('DELETE FROM user_steps WHERE id = $1', [id]);
}

export async function updateUserStep(
  id: number,
  name: string
): Promise<UserStep | null> {
  const db = getDb();
  const result = await db.query(
    `UPDATE user_steps 
     SET name = $2
     WHERE id = $1
     RETURNING *`,
    [id, name]
  );
  return result.rows[0] || null;
}

export async function createDefaultSteps(clerk_id: string): Promise<UserStep[]> {
  const db = getDb();
  const result = await db.query(
    `INSERT INTO user_steps (clerk_id, name)
     VALUES 
       ($1, 'Cleansing'),
       ($1, 'Toning'),
       ($1, 'Moisturizing')
     RETURNING *`,
    [clerk_id]
  );
  return result.rows;
} 