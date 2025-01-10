import { getDb } from "./db";
import { Product, ProductWithCategory } from "@/types/product";

export async function createProduct(product: Omit<Product, 'id' | 'created_at' | 'uuid'>): Promise<Product> {
  const db = getDb();
  
  // Handle empty numeric values
  const size_value = product.size_value && !isNaN(product.size_value) ? product.size_value : null;
  const retail_price = product.retail_price && !isNaN(product.retail_price) ? product.retail_price : null;

  const result = await db.query(
    `INSERT INTO products (
      name, brand, category_id, description, image_url, barcode,
      size_value, size_unit, standard_size, retail_price, currency,
      created_at, uuid
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
      CURRENT_TIMESTAMP, gen_random_uuid()
    ) RETURNING *`,
    [
      product.name,
      product.brand,
      product.category_id,
      product.description,
      product.image_url,
      product.barcode,
      size_value,
      product.size_unit,
      product.standard_size,
      retail_price,
      product.currency
    ]
  );
  return result.rows[0];
}

export async function getProductById(id: number): Promise<ProductWithCategory | null> {
  const db = getDb();
  const result = await db.query(
    `SELECT p.*, pc.name as category_name
     FROM products p
     JOIN product_categories pc ON p.category_id = pc.id
     WHERE p.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function getProductByBarcode(barcode: string): Promise<ProductWithCategory | null> {
  const db = getDb();
  const result = await db.query(
    `SELECT p.*, pc.name as category_name
     FROM products p
     JOIN product_categories pc ON p.category_id = pc.id
     WHERE p.barcode = $1`,
    [barcode]
  );
  return result.rows[0] || null;
}

export async function searchProducts(query: string): Promise<ProductWithCategory[]> {
  const db = getDb();
  const result = await db.query(
    `SELECT p.*, pc.name as category_name
     FROM products p
     JOIN product_categories pc ON p.category_id = pc.id
     WHERE 
       p.name ILIKE $1 OR 
       p.brand ILIKE $1 OR 
       p.description ILIKE $1
     ORDER BY p.name ASC`,
    [`%${query}%`]
  );
  return result.rows;
}

export async function getProductsByCategory(categoryId: number): Promise<ProductWithCategory[]> {
  const db = getDb();
  const result = await db.query(
    `SELECT p.*, pc.name as category_name
     FROM products p
     JOIN product_categories pc ON p.category_id = pc.id
     WHERE p.category_id = $1
     ORDER BY p.name ASC`,
    [categoryId]
  );
  return result.rows;
}

export async function getProductByBrandAndName(brand: string, name: string): Promise<ProductWithCategory | null> {
  const db = getDb();
  
  // First try exact match (case-insensitive)
  const exactResult = await db.query(
    `SELECT p.*, pc.name as category_name
     FROM products p
     JOIN product_categories pc ON p.category_id = pc.id
     WHERE LOWER(p.brand) = LOWER($1) AND LOWER(p.name) = LOWER($2)
     LIMIT 1`,
    [brand, name]
  );

  if (exactResult.rows[0]) {
    return exactResult.rows[0];
  }

  // If no exact match, try fuzzy match with similarity threshold
  const fuzzyResult = await db.query(
    `SELECT p.*, pc.name as category_name,
            GREATEST(
              SIMILARITY(LOWER(p.brand), LOWER($1)),
              SIMILARITY(LOWER(p.name), LOWER($2))
            ) as match_score
     FROM products p
     JOIN product_categories pc ON p.category_id = pc.id
     WHERE 
       (SIMILARITY(LOWER(p.brand), LOWER($1)) > 0.3 AND
        SIMILARITY(LOWER(p.name), LOWER($2)) > 0.3)
     ORDER BY match_score DESC
     LIMIT 1`,
    [brand, name]
  );

  return fuzzyResult.rows[0] || null;
} 