import { getDb } from './db';
import { ProductImage } from '@/types/productImage';

export async function createProductImage(
  product_id: number,
  image_url: string,
  image_type: 'main' | 'thumbnail',
  source_url?: string,
  source?: 'sephora' | 'ulta' | 'user' | 'other'
): Promise<ProductImage> {
  const db = getDb();
  const result = await db.query(
    `INSERT INTO product_images (
      product_id,
      image_url,
      image_type,
      source_url,
      source,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
    RETURNING *`,
    [product_id, image_url, image_type, source_url, source]
  );
  return result.rows[0];
}

export async function getProductImages(product_id: number): Promise<ProductImage[]> {
  const db = getDb();
  const result = await db.query(
    'SELECT * FROM product_images WHERE product_id = $1 ORDER BY created_at DESC',
    [product_id]
  );
  return result.rows;
}

export async function getProductMainImage(product_id: number): Promise<ProductImage | null> {
  const db = getDb();
  const result = await db.query(
    'SELECT * FROM product_images WHERE product_id = $1 AND image_type = $2 ORDER BY created_at DESC LIMIT 1',
    [product_id, 'main']
  );
  return result.rows[0] || null;
}

export async function getProductThumbnail(product_id: number): Promise<ProductImage | null> {
  const db = getDb();
  const result = await db.query(
    'SELECT * FROM product_images WHERE product_id = $1 AND image_type = $2 ORDER BY created_at DESC LIMIT 1',
    [product_id, 'thumbnail']
  );
  return result.rows[0] || null;
} 