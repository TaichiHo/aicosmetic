import { getDb } from './db';
import { Routine, RoutineStep, RoutineStepProduct, RoutineWithSteps, TimeOfDay } from '@/types/routine';

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

export async function createRoutineStep(
  routine_id: number,
  step_order: number,
  step_name: string
): Promise<RoutineStep> {
  const db = getDb();
  const result = await db.query(
    `INSERT INTO routine_steps (routine_id, step_order, step_name)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [routine_id, step_order, step_name]
  );
  return { ...result.rows[0], products: [] };
}

export async function addProductToStep(
  routine_step_id: number,
  user_product_id: number,
  notes?: string
): Promise<RoutineStepProduct> {
  const db = getDb();
  const result = await db.query(
    `INSERT INTO routine_step_products (routine_step_id, user_product_id, notes)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [routine_step_id, user_product_id, notes]
  );
  return result.rows[0];
}

export async function getUserRoutines(clerk_id: string): Promise<RoutineWithSteps[]> {
  const db = getDb();
  const result = await db.query(
    `SELECT 
       r.*,
       json_agg(
         json_build_object(
           'id', rs.id,
           'routine_id', rs.routine_id,
           'step_order', rs.step_order,
           'step_name', rs.step_name,
           'created_at', rs.created_at,
           'uuid', rs.uuid,
           'products', (
             SELECT json_agg(
               json_build_object(
                 'id', rsp.id,
                 'routine_step_id', rsp.routine_step_id,
                 'user_product_id', rsp.user_product_id,
                 'notes', rsp.notes,
                 'created_at', rsp.created_at,
                 'uuid', rsp.uuid,
                 'user_product', up
               )
             )
             FROM routine_step_products rsp
             LEFT JOIN user_products up ON rsp.user_product_id = up.id
             WHERE rsp.routine_step_id = rs.id
           )
         ) ORDER BY rs.step_order
       ) FILTER (WHERE rs.id IS NOT NULL) as steps
     FROM routines r
     LEFT JOIN routine_steps rs ON r.id = rs.routine_id
     WHERE r.clerk_id = $1
     GROUP BY r.id
     ORDER BY r.created_at DESC`,
    [clerk_id]
  );
  return result.rows.map(row => ({
    ...row,
    steps: row.steps || []
  }));
}

export async function getRoutineById(id: number): Promise<RoutineWithSteps | null> {
  const db = getDb();
  const result = await db.query(
    `SELECT 
       r.*,
       json_agg(
         json_build_object(
           'id', rs.id,
           'routine_id', rs.routine_id,
           'step_order', rs.step_order,
           'step_name', rs.step_name,
           'created_at', rs.created_at,
           'uuid', rs.uuid,
           'products', (
             SELECT json_agg(
               json_build_object(
                 'id', rsp.id,
                 'routine_step_id', rsp.routine_step_id,
                 'user_product_id', rsp.user_product_id,
                 'notes', rsp.notes,
                 'created_at', rsp.created_at,
                 'uuid', rsp.uuid,
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
               )
             )
             FROM routine_step_products rsp
             LEFT JOIN user_products up ON rsp.user_product_id = up.id
             LEFT JOIN products p ON up.product_id = p.id
             LEFT JOIN product_categories pc ON p.category_id = pc.id
             WHERE rsp.routine_step_id = rs.id
           )
         ) ORDER BY rs.step_order
       ) FILTER (WHERE rs.id IS NOT NULL) as steps
     FROM routines r
     LEFT JOIN routine_steps rs ON r.id = rs.routine_id
     WHERE r.id = $1
     GROUP BY r.id`,
    [id]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return {
    ...result.rows[0],
    steps: result.rows[0].steps || []
  };
}

export async function updateRoutineStep(
  id: number,
  step_order: number,
  step_name: string
): Promise<RoutineStep | null> {
  const db = getDb();
  const result = await db.query(
    `UPDATE routine_steps
     SET step_order = $2, step_name = $3
     WHERE id = $1
     RETURNING *`,
    [id, step_order, step_name]
  );
  return result.rows[0] || null;
}

export async function deleteRoutineStep(id: number): Promise<void> {
  const db = getDb();
  await db.query('DELETE FROM routine_steps WHERE id = $1', [id]);
}

export async function deleteRoutineStepProduct(id: number): Promise<void> {
  const db = getDb();
  await db.query('DELETE FROM routine_step_products WHERE id = $1', [id]);
}

export async function deleteRoutine(id: number): Promise<void> {
  const db = getDb();
  await db.query('DELETE FROM routines WHERE id = $1', [id]);
}

export async function updateRoutine(
  id: number,
  name: string,
  description?: string
): Promise<Routine> {
  const db = getDb();
  const result = await db.query(
    `UPDATE routines 
     SET name = $2, description = $3
     WHERE id = $1
     RETURNING *`,
    [id, name, description]
  );
  return result.rows[0];
} 