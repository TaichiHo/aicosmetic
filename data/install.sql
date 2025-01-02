-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    nickname VARCHAR(255),
    avatar_url VARCHAR(255),
    created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
    uuid UUID UNIQUE NOT NULL
);

-- Product Categories table
CREATE TABLE product_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

-- Products table (for storing recognized cosmetic products)
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    category_id INT REFERENCES product_categories(id),
    description TEXT,
    image_url TEXT,
    barcode VARCHAR(100),
    size_value DECIMAL(10,2), -- numerical value of the size
    size_unit VARCHAR(20), -- ml, g, oz, etc.
    standard_size VARCHAR(50), -- e.g., 'Full Size', 'Travel Size', 'Mini'
    retail_price DECIMAL(10,2), -- Suggested retail price
    currency VARCHAR(3), -- Currency code (USD, EUR, etc.)
    created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
    uuid UUID UNIQUE NOT NULL
);

-- User Products table (for tracking user's collection)
CREATE TABLE user_products (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    product_id INT REFERENCES products(id),
    purchase_date DATE,
    expiry_date DATE,
    opened_date DATE,
    purchase_price DECIMAL(10,2), -- Actual price paid by user
    purchase_currency VARCHAR(3), -- Currency of purchase
    purchase_location VARCHAR(255), -- Where the product was bought
    usage_status VARCHAR(50), -- e.g., 'new', 'in-use', 'finished'
    usage_percentage INT, -- Estimated usage percentage 0-100
    notes TEXT,
    created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
    uuid UUID UNIQUE NOT NULL
);

-- Product Images table (for storing multiple images per product)
CREATE TABLE product_images (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id),
    user_id INT REFERENCES users(id),
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

-- Orders table (for billing)
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_no VARCHAR(255) UNIQUE NOT NULL,
    user_id INT REFERENCES users(id),
    amount INT NOT NULL,
    plan VARCHAR(50),
    credits INT NOT NULL,
    currency VARCHAR(50),
    order_status SMALLINT NOT NULL, -- e.g., 0: pending, 1: paid, 2: cancelled
    created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
    expired_at timestamptz,
    paid_at timestamptz,
    stripe_session_id VARCHAR(255)
);

-- Initial product categories
INSERT INTO product_categories (name, description) VALUES
    ('Skincare', 'Facial and body skincare products'),
    ('Makeup', 'Color cosmetics and makeup products'),
    ('Haircare', 'Hair treatment and styling products'),
    ('Fragrance', 'Perfumes and fragrances'),
    ('Body Care', 'Body lotions, scrubs, and other body care items'),
    ('Tools', 'Beauty tools and accessories');

-- Indexes for better query performance
CREATE INDEX idx_user_products_user_id ON user_products(user_id);
CREATE INDEX idx_user_products_product_id ON user_products(product_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);