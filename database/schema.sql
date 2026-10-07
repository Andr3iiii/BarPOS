-- ==============================================================================
-- BAR POINT-OF-SALE SYSTEM DATABASE SCHEMA
-- PostgreSQL 14+
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES CLEANUP (IF RE-RUNNING FRESH)
-- DROP TABLE IF EXISTS payments CASCADE;
-- DROP TABLE IF EXISTS order_items CASCADE;
-- DROP TABLE IF EXISTS orders CASCADE;
-- DROP TABLE IF EXISTS products CASCADE;
-- DROP TABLE IF EXISTS categories CASCADE;
-- DROP TABLE IF EXISTS tables CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- 3. USERS & ROLES
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'cashier')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(50) DEFAULT 'wine',
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. PRODUCTS
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    category_id INT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name VARCHAR(150) UNIQUE NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    image_url TEXT,
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available);

-- 6. TABLES (IDENTIFIERS FOR QR CODES ONLY)
-- Scope rule: Tables are ONLY identifiers for customer orders. No table occupancy tracking.
CREATE TABLE IF NOT EXISTS tables (
    id SERIAL PRIMARY KEY,
    table_number VARCHAR(20) UNIQUE NOT NULL,
    label VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. ORDERS
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    reference_no VARCHAR(30) UNIQUE NOT NULL,
    table_id INT NOT NULL REFERENCES tables(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'CANCELLED')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PAID')),
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    tax NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    customer_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_reference ON orders(reference_no);

-- 8. ORDER ITEMS (Saves snapshot of product name & unit price to protect historical records)
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name VARCHAR(150) NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    subtotal NUMERIC(10, 2) NOT NULL,
    item_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- 9. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('CASH', 'GCASH', 'CARD')),
    total_amount NUMERIC(10, 2) NOT NULL,
    amount_received NUMERIC(10, 2) NOT NULL,
    change_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_reference VARCHAR(100),
    cashier_id INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- 10. DAILY SEQUENCE TRACKER FOR CONCISE REFERENCE NUMBERS (e.g. T1-1001)
CREATE TABLE IF NOT EXISTS order_sequences (
    order_date DATE PRIMARY KEY,
    current_seq INT NOT NULL DEFAULT 1000
);

-- ==============================================================================
-- INITIAL SEED DATA
-- ==============================================================================

-- 1. Initial Tables (Table 1 through Table 10 + Bar Counter)
INSERT INTO tables (table_number, label, is_active)
VALUES
    ('1', 'Table 1', true),
    ('2', 'Table 2', true),
    ('3', 'Table 3', true),
    ('4', 'Table 4', true),
    ('5', 'Table 5', true),
    ('6', 'Table 6', true),
    ('7', 'Table 7', true),
    ('8', 'Table 8', true),
    ('9', 'Table 9', true),
    ('10', 'Table 10', true),
    ('BAR-1', 'Bar Counter 1', true),
    ('BAR-2', 'Bar Counter 2', true)
ON CONFLICT (table_number) DO NOTHING;

-- 2. Initial Categories
INSERT INTO categories (id, name, icon, display_order, is_active)
VALUES
    (1, 'Draft & Bottled Beers', 'beer', 1, true),
    (2, 'Cocktails & Mixers', 'wine', 2, true),
    (3, 'Spirits & Shots', 'glass', 3, true),
    (4, 'Bar Bites & Starters', 'utensils', 4, true),
    (5, 'Main Comfort Food', 'pizza', 5, true),
    (6, 'Non-Alcoholic Drinks', 'coffee', 6, true)
ON CONFLICT (name) DO NOTHING;

-- 3. Initial Products
INSERT INTO products (category_id, name, description, price, image_url, is_available)
VALUES
    -- Beers
    (1, 'San Miguel Pale Pilsen', 'Classic Filipino crisp lager, 330ml bottle', 95.00, 'https://images.unsplash.com/photo-1608270199180-29177e7f6e4d?auto=format&fit=crop&w=600&q=80', true),
    (1, 'San Miguel Light', 'Crisp, light beer with low calories, 330ml bottle', 95.00, 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=600&q=80', true),
    (1, 'Red Horse Beer', 'Extra-strong full-bodied lager, 500ml', 120.00, 'https://images.unsplash.com/photo-1618886614638-80e3c15cd819?auto=format&fit=crop&w=600&q=80', true),
    (1, 'Heineken Draft', 'Cold draught premium European lager pint', 180.00, 'https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?auto=format&fit=crop&w=600&q=80', true),
    (1, 'Corona Extra with Lime', 'Mexican pale lager served with fresh lime wedge', 190.00, 'https://images.unsplash.com/photo-1584225064785-c62a8b43d148?auto=format&fit=crop&w=600&q=80', true),
    (1, 'Craft IPA (Local Brew)', 'Hoppy citrus notes with rich floral finish, 330ml', 220.00, 'https://images.unsplash.com/photo-1566633806327-68e152aaf26d?auto=format&fit=crop&w=600&q=80', true),

    -- Cocktails
    (2, 'Smoked Old Fashioned', 'Bourbon, aromatic bitters, sugar cube, smoked orange peel', 320.00, 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=80', true),
    (2, 'Classic Margarita', 'Tequila blanco, triple sec, fresh lime juice with salted rim', 280.00, 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80', true),
    (2, 'Espresso Martini', 'Vodka, kahlua, freshly pulled espresso, coffee beans', 310.00, 'https://images.unsplash.com/photo-1545438102-799c3991ffb2?auto=format&fit=crop&w=600&q=80', true),
    (2, 'Neon Tide Mojito', 'White rum, fresh mint leaves, lime juice, club soda', 270.00, 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=600&q=80', true),
    (2, 'Whiskey Sour', 'Bourbon whiskey, lemon juice, egg white foam, angostura bitters', 290.00, 'https://images.unsplash.com/photo-1560512823-829485b8bf24?auto=format&fit=crop&w=600&q=80', true),
    (2, 'Gin & Tonic Highball', 'Artisanal gin, fever-tree tonic, cucumber ribbon, juniper', 260.00, 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=600&q=80', true),

    -- Spirits & Shots
    (3, 'Tequila Ocho Shot', '100% blue agave premium tequila shot with lime & salt', 150.00, 'https://images.unsplash.com/photo-1567696911980-2eed69a46042?auto=format&fit=crop&w=600&q=80', true),
    (3, 'Jägermeister Shot', 'Ice-cold herbal liqueur shot', 160.00, 'https://images.unsplash.com/photo-1516997121675-4c2d1684aa3e?auto=format&fit=crop&w=600&q=80', true),
    (3, 'Jameson Irish Whiskey Neat', 'Smooth triple-distilled Irish whiskey double shot', 240.00, 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=600&q=80', true),
    (3, 'Johnny Walker Black Label', 'Rich 12-year blended scotch on the rocks', 250.00, 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?auto=format&fit=crop&w=600&q=80', true),

    -- Bar Bites
    (4, 'Truffle Parmesan Fries', 'Hand-cut crispy potatoes, truffle oil, grated parmesan, garlic aioli', 180.00, 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80', true),
    (4, 'Spicy Buffalo Wings (6pcs)', 'Crispy chicken wings in tangy hot cayenne sauce with blue cheese dip', 280.00, 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=600&q=80', true),
    (4, 'Crispy Pork Sisig', 'Sizzling seasoned pork mask, chili, onion, calamansi, topped with egg', 290.00, 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', true),
    (4, 'Loaded Nachos Grande', 'Tortilla chips, melted cheddar, spiced beef, jalapeños, sour cream & salsa', 320.00, 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=600&q=80', true),
    (4, 'Gambas al Ajillo', 'Tiger prawns sautéed in extra virgin olive oil, garlic, and chili flakes', 340.00, 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=600&q=80', true),

    -- Main Plates
    (5, 'Double Cheeseburger & Fries', 'Two smashed beef patties, cheddar, pickles, secret sauce on brioche bun', 320.00, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80', true),
    (5, 'Wood-Fired Pepperoni Pizza', 'San marzano tomato sauce, mozzarella, sliced pepperoni, hot honey drizzle', 420.00, 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=600&q=80', true),
    (5, 'Smoked BBQ Ribs Half-Rack', 'Tender fall-off-the-bone ribs with house coleslaw and fries', 480.00, 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', true),

    -- Non-Alcoholic
    (6, 'Calamansi Iced Tea Pitcher', 'House-brewed black tea infused with Philippine lime', 120.00, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80', true),
    (6, 'Red Bull Energy Drink', 'Original 250ml can', 140.00, 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?auto=format&fit=crop&w=600&q=80', true),
    (6, 'San Pellegrino Sparkling Water', 'Chilled sparkling mineral water 500ml', 150.00, 'https://images.unsplash.com/photo-1560508180-03f285f67dd9?auto=format&fit=crop&w=600&q=80', true),
    (6, 'Craft Virgin Mojito', 'Fresh mint, lime, cane syrup, sparkling water', 180.00, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80', true)
ON CONFLICT (name) DO NOTHING;

-- 4. Initial Users: admin and cashier
-- Passwords will be seeded/updated by backend initialization with bcrypt hashes.
