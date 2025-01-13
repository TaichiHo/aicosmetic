-- Add category_name column to products table
ALTER TABLE products ADD COLUMN category_name text NOT NULL;

-- Update existing records with category names from categories table
UPDATE products p 
SET category_name = c.name 
FROM categories c 
WHERE p.category_id = c.id; 