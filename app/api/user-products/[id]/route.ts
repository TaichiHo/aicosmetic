import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { getDb } from '@/models/db';
import { getUserProductById } from '@/models/userProduct';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userProduct = await getUserProductById(parseInt(params.id));
    if (!userProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (userProduct.clerk_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      brand,
      name,
      category_id,
      description,
      size_value,
      size_unit,
      usage_status,
      usage_percentage,
      notes
    } = body;

    const db = getDb();
    await db.query('BEGIN');

    try {
      // Update product details
      const productResult = await db.query(
        `UPDATE products 
         SET brand = $1,
             name = $2,
             category_id = $3,
             description = $4,
             size_value = $5,
             size_unit = $6
         WHERE id = $7
         RETURNING *`,
        [brand, name, category_id, description, size_value, size_unit, userProduct.product_id]
      );

      // Update user product details
      const userProductResult = await db.query(
        `UPDATE user_products 
         SET usage_status = $1,
             usage_percentage = $2,
             notes = $3
         WHERE id = $4
         RETURNING *`,
        [usage_status, usage_percentage, notes, params.id]
      );

      await db.query('COMMIT');

      // Combine the results
      const updatedProduct = {
        ...userProductResult.rows[0],
        product: productResult.rows[0]
      };

      return NextResponse.json(updatedProduct);
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
} 