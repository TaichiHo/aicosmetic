import { getDb } from "./db";
import { Category, CategoryWithProductCount } from "@/types/category";

export async function getAllCategories(): Promise<Category[]> {
  const db = getDb();
  const result = await db.query(
    `SELECT * FROM product_categories ORDER BY name ASC`
  );
  return result.rows;
}

export async function getCategoriesWithProductCount(userId?: string): Promise<CategoryWithProductCount[]> {
  const db = getDb();
  const query = userId 
    ? `SELECT pc.*, COUNT(DISTINCT up.product_id) as product_count
       FROM product_categories pc
       LEFT JOIN products p ON pc.id = p.category_id
       LEFT JOIN user_products up ON p.id = up.product_id AND up.user_id = $1
       GROUP BY pc.id
       ORDER BY pc.name ASC`
    : `SELECT pc.*, COUNT(DISTINCT p.id) as product_count
       FROM product_categories pc
       LEFT JOIN products p ON pc.id = p.category_id
       GROUP BY pc.id
       ORDER BY pc.name ASC`;

  const result = await db.query(query, userId ? [userId] : []);
  return result.rows.map(row => ({
    ...row,
    product_count: parseInt(row.product_count)
  }));
}

export async function getCategoryById(id: number): Promise<Category | null> {
  const db = getDb();
  const result = await db.query(
    `SELECT * FROM product_categories WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function createCategory(name: string, description?: string): Promise<Category> {
  const db = getDb();
  const result = await db.query(
    `INSERT INTO product_categories (name, description, created_at)
     VALUES ($1, $2, CURRENT_TIMESTAMP)
     RETURNING *`,
    [name, description]
  );
  return result.rows[0];
}

export async function updateCategory(
  id: number,
  updates: Partial<Omit<Category, 'id' | 'created_at'>>
): Promise<Category | null> {
  const db = getDb();
  
  const setClause = Object.entries(updates)
    .map(([key, _], index) => `${key} = $${index + 2}`)
    .join(', ');
  
  const values = Object.values(updates);
  
  const result = await db.query(
    `UPDATE product_categories 
     SET ${setClause}
     WHERE id = $1
     RETURNING *`,
    [id, ...values]
  );
  
  return result.rows[0] || null;
} 