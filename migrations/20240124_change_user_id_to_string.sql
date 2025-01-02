-- First drop the foreign key constraints
ALTER TABLE user_products 
  DROP CONSTRAINT IF EXISTS user_products_user_id_fkey;

ALTER TABLE orders 
  DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

ALTER TABLE product_images
  DROP CONSTRAINT IF EXISTS product_images_user_id_fkey;

-- Change user_id columns from integer to text
ALTER TABLE users 
  ALTER COLUMN id TYPE text USING id::text;

ALTER TABLE user_products 
  ALTER COLUMN user_id TYPE text USING user_id::text;

ALTER TABLE orders 
  ALTER COLUMN user_id TYPE text USING user_id::text;

ALTER TABLE product_images
  ALTER COLUMN user_id TYPE text USING user_id::text;

-- Re-add the foreign key constraints
ALTER TABLE user_products
  ADD CONSTRAINT user_products_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id);

ALTER TABLE orders
  ADD CONSTRAINT orders_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id);

ALTER TABLE product_images
  ADD CONSTRAINT product_images_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id); 