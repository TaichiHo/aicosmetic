import { getDb } from "./db";
import { ProductWithCategory } from "@/types/product";
import { UserProduct, UserProductWithDetails } from "@/types/userProduct";

export async function createUserProduct(
  userProduct: Omit<UserProduct, 'id' | 'created_at' | 'uuid'>
): Promise<UserProduct> {
  const db = getDb();

  // Handle empty numeric values
  const purchase_price = userProduct.purchase_price && !isNaN(userProduct.purchase_price) ? userProduct.purchase_price : null;
  const usage_percentage = userProduct.usage_percentage && !isNaN(userProduct.usage_percentage) ? userProduct.usage_percentage : 0;

  const result = await db.query(
    `INSERT INTO user_products (
      clerk_id, product_id, purchase_date, expiry_date, opened_date,
      purchase_price, purchase_currency, purchase_location,
      usage_status, usage_percentage, notes, user_image_url,
      created_at, uuid
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
      CURRENT_TIMESTAMP, gen_random_uuid()
    ) RETURNING *`,
    [
      userProduct.clerk_id,
      userProduct.product_id,
      userProduct.purchase_date,
      userProduct.expiry_date,
      userProduct.opened_date,
      purchase_price,
      userProduct.purchase_currency,
      userProduct.purchase_location,
      userProduct.usage_status,
      usage_percentage,
      userProduct.notes,
      userProduct.user_image_url
    ]
  );
  return result.rows[0];
}

export async function getUserProducts(clerkId: string): Promise<UserProductWithDetails[]> {
  const db = getDb();
  const result = await db.query(
    `SELECT up.id as user_product_id, 
            up.clerk_id, up.product_id, up.purchase_date, up.expiry_date,
            up.opened_date, up.purchase_price, up.purchase_currency,
            up.purchase_location, up.usage_status, up.usage_percentage,
            up.notes, up.created_at, up.uuid, up.user_image_url,
            p.id as product_id,
            p.name, p.brand, p.category_id, p.description, p.image_url,
            p.barcode, p.size_value, p.size_unit, p.standard_size,
            p.retail_price, p.currency, p.created_at as product_created_at,
            p.uuid as product_uuid,
            pc.name as category_name
     FROM user_products up
     JOIN products p ON up.product_id = p.id
     JOIN product_categories pc ON p.category_id = pc.id
     WHERE up.clerk_id = $1
     ORDER BY up.created_at DESC`,
    [clerkId]
  );
  
  return result.rows.map(row => {
    const userProduct: UserProduct = {
      id: row.user_product_id,
      clerk_id: row.clerk_id,
      product_id: row.product_id,
      purchase_date: row.purchase_date,
      expiry_date: row.expiry_date,
      opened_date: row.opened_date,
      purchase_price: row.purchase_price,
      purchase_currency: row.purchase_currency,
      purchase_location: row.purchase_location,
      usage_status: row.usage_status,
      usage_percentage: row.usage_percentage,
      notes: row.notes,
      created_at: row.created_at,
      uuid: row.uuid,
      user_image_url: row.user_image_url,
    };

    const product: ProductWithCategory = {
      id: row.product_id,
      name: row.name,
      brand: row.brand,
      category_id: row.category_id,
      category_name: row.category_name,
      description: row.description,
      image_url: row.image_url,
      barcode: row.barcode,
      size_value: row.size_value,
      size_unit: row.size_unit,
      standard_size: row.standard_size,
      retail_price: row.retail_price,
      currency: row.currency,
      created_at: row.product_created_at,
      uuid: row.product_uuid
    };

    return {
      ...userProduct,
      product
    };
  });
}

export async function updateUserProduct(
  id: number,
  updates: Partial<Omit<UserProduct, 'id' | 'user_id' | 'product_id' | 'created_at' | 'uuid'>>
): Promise<UserProduct | null> {
  const db = getDb();
  
  // Build the SET clause dynamically based on provided updates
  const setClause = Object.entries(updates)
    .map(([key, _], index) => `${key} = $${index + 2}`)
    .join(', ');
  
  const values = Object.values(updates);
  
  const result = await db.query(
    `UPDATE user_products 
     SET ${setClause}
     WHERE id = $1
     RETURNING *`,
    [id, ...values]
  );
  
  return result.rows[0] || null;
}

export async function getUserProductsByCategory(
  clerkId: string,
  categoryId: number
): Promise<UserProductWithDetails[]> {
  const db = getDb();
  const result = await db.query(
    `SELECT up.*, 
            p.*,
            pc.name as category_name
     FROM user_products up
     JOIN products p ON up.product_id = p.id
     JOIN product_categories pc ON p.category_id = pc.id
     WHERE up.clerk_id = $1 AND p.category_id = $2
     ORDER BY up.created_at DESC`,
    [clerkId, categoryId]
  );
  
  return result.rows.map(row => ({
    id: row.id,
    clerk_id: row.clerk_id,
    product_id: row.product_id,
    purchase_date: row.purchase_date,
    expiry_date: row.expiry_date,
    opened_date: row.opened_date,
    purchase_price: row.purchase_price,
    purchase_currency: row.purchase_currency,
    purchase_location: row.purchase_location,
    usage_status: row.usage_status,
    usage_percentage: row.usage_percentage,
    notes: row.notes,
    created_at: row.created_at,
    uuid: row.uuid,
    product: {
      id: row.product_id,
      name: row.name,
      brand: row.brand,
      category_id: row.category_id,
      category_name: row.category_name,
      description: row.description,
      image_url: row.image_url,
      barcode: row.barcode,
      size_value: row.size_value,
      size_unit: row.size_unit,
      standard_size: row.standard_size,
      retail_price: row.retail_price,
      currency: row.currency,
      created_at: row.created_at,
      uuid: row.uuid
    }
  }));
}

export async function getUserProductsByProductId(
  clerkId: string,
  productId: number
): Promise<UserProductWithDetails[]> {
  const db = getDb();
  const result = await db.query(
    `SELECT up.id as user_product_id, 
            up.clerk_id, up.product_id, up.purchase_date, up.expiry_date,
            up.opened_date, up.purchase_price, up.purchase_currency,
            up.purchase_location, up.usage_status, up.usage_percentage,
            up.notes, up.created_at, up.uuid, up.user_image_url,
            p.id as product_id,
            p.name, p.brand, p.category_id, p.description, p.image_url,
            p.barcode, p.size_value, p.size_unit, p.standard_size,
            p.retail_price, p.currency, p.created_at as product_created_at,
            p.uuid as product_uuid,
            pc.name as category_name
     FROM user_products up
     JOIN products p ON up.product_id = p.id
     JOIN product_categories pc ON p.category_id = pc.id
     WHERE up.clerk_id = $1
     AND up.product_id = $2
     ORDER BY up.created_at DESC`,
    [clerkId, productId]
  );
  
  return result.rows.map(row => {
    const userProduct: UserProduct = {
      id: row.user_product_id,
      clerk_id: row.clerk_id,
      product_id: row.product_id,
      purchase_date: row.purchase_date,
      expiry_date: row.expiry_date,
      opened_date: row.opened_date,
      purchase_price: row.purchase_price,
      purchase_currency: row.purchase_currency,
      purchase_location: row.purchase_location,
      usage_status: row.usage_status,
      usage_percentage: row.usage_percentage,
      notes: row.notes,
      created_at: row.created_at,
      uuid: row.uuid,
      user_image_url: row.user_image_url,
    };

    const product: ProductWithCategory = {
      id: row.product_id,
      name: row.name,
      brand: row.brand,
      category_id: row.category_id,
      category_name: row.category_name,
      description: row.description,
      image_url: row.image_url,
      barcode: row.barcode,
      size_value: row.size_value,
      size_unit: row.size_unit,
      standard_size: row.standard_size,
      retail_price: row.retail_price,
      currency: row.currency,
      created_at: row.product_created_at,
      uuid: row.product_uuid
    };

    return {
      ...userProduct,
      product
    };
  });
}

export async function getUserProductById(id: number): Promise<UserProduct | null> {
  const db = getDb();
  const result = await db.query(
    `SELECT * FROM user_products WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function deleteUserProduct(id: number): Promise<void> {
  const db = getDb();
  await db.query(
    `DELETE FROM user_products WHERE id = $1`,
    [id]
  );
}

export async function getUserProductByClerkIdAndProductId(
  clerkId: string,
  productId: number
): Promise<UserProduct | null> {
  const db = getDb();
  const result = await db.query(
    `SELECT * FROM user_products 
     WHERE clerk_id = $1 AND product_id = $2
     LIMIT 1`,
    [clerkId, productId]
  );
  return result.rows[0] || null;
} 