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

-- Create index on name for faster searches
CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);

-- Create index on category for filtering
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);

-- Insert sample data
INSERT INTO items (name, description, quantity, price, category) VALUES
('Laptop', 'Dell XPS 13 laptop', 10, 999.99, 'Electronics'),
('Mouse', 'Wireless optical mouse', 25, 29.99, 'Electronics'),
('Desk Chair', 'Ergonomic office chair', 5, 199.99, 'Furniture'),
('Notebook', 'Spiral bound notebook', 100, 5.99, 'Office Supplies')
ON CONFLICT DO NOTHING;