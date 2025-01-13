import { getDb } from './db';
import { Routine, RoutineProduct, RoutineWithProducts, TimeOfDay } from '@/types/routine';

export async function createRoutine(
  clerk_id: string,
  name: string,
  time_of_day: TimeOfDay,
  description?: string
): Promise<Routine> {
  const db = getDb();
  const result = await db.query(
    `INSERT INTO routines (clerk_id, name, time_of_day, description)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [clerk_id, name, time_of_day, description]
  );
  return result.rows[0];
}

export async function addProductToRoutine(
  routine_id: number,
  user_product_id: number,
  step_order: number,
  notes?: string
): Promise<RoutineProduct> {
  const db = getDb();
  const result = await db.query(
    `INSERT INTO routine_products (routine_id, user_product_id, step_order, notes)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [routine_id, user_product_id, step_order, notes]
  );
  return result.rows[0];
}

export async function getUserRoutines(clerk_id: string): Promise<RoutineWithProducts[]> {
  const db = getDb();
  const result = await db.query(
    `SELECT 
       r.*,
       json_agg(
         json_build_object(
           'id', rp.id,
           'routine_id', rp.routine_id,
           'user_product_id', rp.user_product_id,
           'step_order', rp.step_order,
           'notes', rp.notes,
           'created_at', rp.created_at,
           'uuid', rp.uuid,
           'user_product', up
         ) ORDER BY rp.step_order
       ) FILTER (WHERE rp.id IS NOT NULL) as products
     FROM routines r
     LEFT JOIN routine_products rp ON r.id = rp.routine_id
     LEFT JOIN user_products up ON rp.user_product_id = up.id
     WHERE r.clerk_id = $1
     GROUP BY r.id
     ORDER BY r.created_at DESC`,
    [clerk_id]
  );
  return result.rows.map(row => ({
    ...row,
    products: row.products || []
  }));
}

export async function getRoutineById(id: number): Promise<RoutineWithProducts | null> {
  const db = getDb();
  const result = await db.query(
    `SELECT 
       r.*,
       json_agg(
         json_build_object(
           'id', rp.id,
           'routine_id', rp.routine_id,
           'user_product_id', rp.user_product_id,
           'step_order', rp.step_order,
           'notes', rp.notes,
           'created_at', rp.created_at,
           'uuid', rp.uuid,
           'user_product', json_build_object(
             'id', up.id,
             'clerk_id', up.clerk_id,
             'product_id', up.product_id,
             'purchase_date', up.purchase_date,
             'expiry_date', up.expiry_date,
             'opened_date', up.opened_date,
             'purchase_price', up.purchase_price,
             'purchase_currency', up.purchase_currency,
             'purchase_location', up.purchase_location,
             'usage_status', up.usage_status,
             'usage_percentage', up.usage_percentage,
             'notes', up.notes,
             'created_at', up.created_at,
             'uuid', up.uuid,
             'user_image_url', up.user_image_url,
             'product', json_build_object(
               'id', p.id,
               'name', p.name,
               'brand', p.brand,
               'category_id', p.category_id,
               'description', p.description,
               'image_url', p.image_url,
               'barcode', p.barcode,
               'size_value', p.size_value,
               'size_unit', p.size_unit,
               'standard_size', p.standard_size,
               'retail_price', p.retail_price,
               'currency', p.currency,
               'created_at', p.created_at,
               'uuid', p.uuid,
               'category_name', pc.name
             )
           )
         ) ORDER BY rp.step_order
       ) FILTER (WHERE rp.id IS NOT NULL) as products
     FROM routines r
     LEFT JOIN routine_products rp ON r.id = rp.routine_id
     LEFT JOIN user_products up ON rp.user_product_id = up.id
     LEFT JOIN products p ON up.product_id = p.id
     LEFT JOIN product_categories pc ON p.category_id = pc.id
     WHERE r.id = $1
     GROUP BY r.id`,
    [id]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return {
    ...result.rows[0],
    products: result.rows[0].products || []
  };
}

export async function updateRoutineProduct(
  id: number,
  step_order: number,
  notes?: string
): Promise<RoutineProduct | null> {
  const db = getDb();
  const result = await db.query(
    `UPDATE routine_products
     SET step_order = $2, notes = $3
     WHERE id = $1
     RETURNING *`,
    [id, step_order, notes]
  );
  return result.rows[0] || null;
}

export async function deleteRoutineProduct(id: number): Promise<void> {
  const db = getDb();
  await db.query('DELETE FROM routine_products WHERE id = $1', [id]);
}

export async function deleteRoutine(id: number): Promise<void> {
  const db = getDb();
  await db.query('DELETE FROM routines WHERE id = $1', [id]);
} 