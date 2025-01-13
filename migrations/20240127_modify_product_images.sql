-- First drop the existing foreign key constraint and clerk_id column
ALTER TABLE product_images DROP CONSTRAINT IF EXISTS product_images_clerk_id_fkey;
ALTER TABLE product_images DROP COLUMN IF EXISTS clerk_id;

-- Add image_type column
ALTER TABLE product_images ADD COLUMN image_type text NOT NULL CHECK (image_type IN ('main', 'thumbnail'));

-- Add source_url column to store the original URL where the image was found
ALTER TABLE product_images ADD COLUMN source_url text;

-- Add source column to store where the image came from (e.g., 'sephora', 'ulta', 'user', 'other')
ALTER TABLE product_images ADD COLUMN source text;

-- Create an index on product_id and image_type for faster lookups
CREATE INDEX idx_product_images_product_type ON product_images(product_id, image_type); 