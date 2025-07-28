-- Create items table for inventory management
CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL DEFAULT 0,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create block_inventory table for tracking blocked quantities
CREATE TABLE IF NOT EXISTS block_inventory (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES items(id),
    quantity INTEGER NOT NULL DEFAULT 0,
    is_permanent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Create composite index on category and quantity for efficient top items queries
CREATE INDEX IF NOT EXISTS idx_items_category_quantity ON items(category, quantity DESC);

-- Create index on item_id for block_inventory lookups
CREATE INDEX IF NOT EXISTS idx_block_inventory_item_id ON block_inventory(item_id);

-- Insert sample data
INSERT INTO items (name, description, quantity, price, category) VALUES
('Laptop', 'Dell XPS 13 laptop', 10, 999.99, 'Electronics'),
('Mouse', 'Wireless optical mouse', 25, 29.99, 'Electronics'),
('Desk Chair', 'Ergonomic office chair', 5, 199.99, 'Furniture'),
('Notebook', 'Spiral bound notebook', 100, 5.99, 'Office Supplies')
ON CONFLICT DO NOTHING;