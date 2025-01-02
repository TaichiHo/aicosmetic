-- Add clerk_id column to users table
ALTER TABLE users
  ADD COLUMN clerk_id text;

-- Make clerk_id unique and not null (after we populate it)
CREATE UNIQUE INDEX users_clerk_id_idx ON users(clerk_id);

-- First drop the existing foreign key constraints
ALTER TABLE user_products 
  DROP CONSTRAINT IF EXISTS user_products_user_id_fkey;

ALTER TABLE orders 
  DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

ALTER TABLE product_images
  DROP CONSTRAINT IF EXISTS product_images_user_id_fkey;

-- Rename user_id columns to clerk_id
ALTER TABLE user_products 
  RENAME COLUMN user_id TO clerk_id;

ALTER TABLE orders 
  RENAME COLUMN user_id TO clerk_id;

ALTER TABLE product_images
  RENAME COLUMN user_id TO clerk_id;

-- Add new foreign key constraints referencing clerk_id
ALTER TABLE user_products
  ADD CONSTRAINT user_products_clerk_id_fkey 
  FOREIGN KEY (clerk_id) 
  REFERENCES users(clerk_id);

ALTER TABLE orders
  ADD CONSTRAINT orders_clerk_id_fkey 
  FOREIGN KEY (clerk_id) 
  REFERENCES users(clerk_id);

ALTER TABLE product_images
  ADD CONSTRAINT product_images_clerk_id_fkey 
  FOREIGN KEY (clerk_id) 
  REFERENCES users(clerk_id); 