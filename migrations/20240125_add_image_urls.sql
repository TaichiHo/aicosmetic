-- Add official_urls to products table
ALTER TABLE products ADD COLUMN official_urls jsonb;

-- Add user_image_url to user_products table
ALTER TABLE user_products ADD COLUMN user_image_url text; 