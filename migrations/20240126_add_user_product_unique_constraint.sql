-- Add unique constraint to prevent duplicate user products
ALTER TABLE user_products 
  ADD CONSTRAINT user_products_clerk_id_product_id_unique 
  UNIQUE (clerk_id, product_id);

-- Add an index to improve lookup performance
CREATE INDEX idx_user_products_clerk_product 
  ON user_products(clerk_id, product_id); 