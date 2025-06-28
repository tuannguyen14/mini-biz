-- Bảng vật tư
CREATE TABLE materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL, -- đơn vị tính (chai, thùng, tem, kg...)
    current_stock DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng nhập vật tư
CREATE TABLE material_imports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    import_date TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng sản phẩm
CREATE TABLE products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    current_stock DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng công thức sản phẩm (BOM - Bill of Materials)
CREATE TABLE product_materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    quantity_required DECIMAL(10,2) NOT NULL, -- số lượng vật tư cần cho 1 đơn vị sản phẩm
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, material_id)
);

-- Bảng đóng gói sản phẩm
CREATE TABLE product_packaging (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity DECIMAL(10,2) NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL, -- giá thành/đơn vị
    total_cost DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
    packaging_date TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng khách hàng
CREATE TABLE customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    total_profit DECIMAL(10,2) DEFAULT 0,
    outstanding_debt DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng đơn hàng
CREATE TABLE orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    order_date TIMESTAMPTZ DEFAULT NOW(),
    total_amount DECIMAL(10,2) DEFAULT 0,
    total_cost DECIMAL(10,2) DEFAULT 0,
    profit DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - total_cost) STORED,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    debt_amount DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed, cancelled
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng chi tiết đơn hàng
CREATE TABLE order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('product', 'material')),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    total_cost DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
    profit DECIMAL(10,2) GENERATED ALWAYS AS ((quantity * unit_price) - (quantity * unit_cost)) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_item_reference CHECK (
        (item_type = 'product' AND product_id IS NOT NULL AND material_id IS NULL) OR
        (item_type = 'material' AND material_id IS NOT NULL AND product_id IS NULL)
    )
);

-- Bảng thanh toán
CREATE TABLE payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    payment_method VARCHAR(50), -- cash, transfer, etc.
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger cập nhật tồn kho vật tư khi nhập
CREATE OR REPLACE FUNCTION update_material_stock_on_import()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE materials 
    SET current_stock = current_stock + NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.material_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_material_stock_on_import
AFTER INSERT ON material_imports
FOR EACH ROW
EXECUTE FUNCTION update_material_stock_on_import();

-- Trigger cập nhật tồn kho khi đóng gói sản phẩm
CREATE OR REPLACE FUNCTION update_stock_on_packaging()
RETURNS TRIGGER AS $$
BEGIN
    -- Cập nhật tồn kho sản phẩm
    UPDATE products 
    SET current_stock = current_stock + NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.product_id;
    
    -- Trừ vật tư theo công thức
    UPDATE materials m
    SET current_stock = current_stock - (pm.quantity_required * NEW.quantity),
        updated_at = NOW()
    FROM product_materials pm
    WHERE pm.product_id = NEW.product_id
    AND pm.material_id = m.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stock_on_packaging
AFTER INSERT ON product_packaging
FOR EACH ROW
EXECUTE FUNCTION update_stock_on_packaging();

-- Trigger cập nhật tồn kho khi bán hàng
CREATE OR REPLACE FUNCTION update_stock_on_order_item()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.item_type = 'product' THEN
        UPDATE products 
        SET current_stock = current_stock - NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.product_id;
    ELSIF NEW.item_type = 'material' THEN
        UPDATE materials 
        SET current_stock = current_stock - NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.material_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stock_on_order_item
AFTER INSERT ON order_items
FOR EACH ROW
EXECUTE FUNCTION update_stock_on_order_item();

-- Trigger cập nhật tổng tiền đơn hàng
CREATE OR REPLACE FUNCTION update_order_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE orders
    SET total_amount = (
            SELECT COALESCE(SUM(total_price), 0)
            FROM order_items
            WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
        ),
        total_cost = (
            SELECT COALESCE(SUM(total_cost), 0)
            FROM order_items
            WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.order_id, OLD.order_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_order_totals
AFTER INSERT OR UPDATE OR DELETE ON order_items
FOR EACH ROW
EXECUTE FUNCTION update_order_totals();

-- Trigger cập nhật công nợ khách hàng khi tạo/cập nhật đơn hàng
CREATE OR REPLACE FUNCTION update_customer_debt()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE customers
    SET outstanding_debt = (
            SELECT COALESCE(SUM(debt_amount), 0)
            FROM orders
            WHERE customer_id = NEW.customer_id
            AND status != 'cancelled'
        ),
        total_revenue = (
            SELECT COALESCE(SUM(total_amount), 0)
            FROM orders
            WHERE customer_id = NEW.customer_id
            AND status = 'completed'
        ),
        total_profit = (
            SELECT COALESCE(SUM(profit), 0)
            FROM orders
            WHERE customer_id = NEW.customer_id
            AND status = 'completed'
        ),
        updated_at = NOW()
    WHERE id = NEW.customer_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customer_debt
AFTER INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_customer_debt();

-- Trigger cập nhật thanh toán vào đơn hàng
CREATE OR REPLACE FUNCTION update_order_payment()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE orders
    SET paid_amount = (
            SELECT COALESCE(SUM(amount), 0)
            FROM payments
            WHERE order_id = NEW.order_id
        ),
        updated_at = NOW()
    WHERE id = NEW.order_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_order_payment
AFTER INSERT ON payments
FOR EACH ROW
EXECUTE FUNCTION update_order_payment();

-- View thống kê tổng quan
CREATE VIEW system_overview AS
SELECT 
    (SELECT COUNT(*) FROM customers) as total_customers,
    (SELECT COUNT(*) FROM orders WHERE status = 'completed') as total_orders,
    (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'completed') as total_revenue,
    (SELECT COALESCE(SUM(profit), 0) FROM orders WHERE status = 'completed') as total_profit,
    (SELECT COALESCE(SUM(outstanding_debt), 0) FROM customers) as total_debt;

-- View chi tiết công nợ khách hàng
CREATE VIEW customer_debt_details AS
SELECT 
    c.id,
    c.name,
    c.phone,
    c.outstanding_debt,
    c.total_revenue,
    c.total_profit,
    COUNT(DISTINCT o.id) as total_orders,
    COUNT(DISTINCT CASE WHEN o.debt_amount > 0 THEN o.id END) as unpaid_orders
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id AND o.status != 'cancelled'
GROUP BY c.id, c.name, c.phone, c.outstanding_debt, c.total_revenue, c.total_profit;

-- Index để tối ưu hiệu suất
CREATE INDEX idx_material_imports_material_id ON material_imports(material_id);
CREATE INDEX idx_material_imports_date ON material_imports(import_date);
CREATE INDEX idx_product_materials_product ON product_materials(product_id);
CREATE INDEX idx_product_materials_material ON product_materials(material_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_payments_order ON payments(order_id);

-- Function tính giá thành sản phẩm
CREATE OR REPLACE FUNCTION calculate_product_cost(p_product_id UUID)
RETURNS DECIMAL(15,2) AS $$
DECLARE
    v_total_cost DECIMAL(15,2) := 0;
    material_record RECORD;
    material_avg_cost DECIMAL(15,2);
BEGIN
    -- Duyệt qua từng vật tư trong công thức sản phẩm
    FOR material_record IN 
        SELECT pm.material_id, pm.quantity_required
        FROM product_materials pm
        WHERE pm.product_id = p_product_id
    LOOP
        -- Tính giá trung bình có trọng số cho từng vật tư
        SELECT 
            CASE 
                WHEN SUM(quantity) > 0 THEN 
                    SUM(quantity * unit_price) / SUM(quantity)
                ELSE 0 
            END
        INTO material_avg_cost
        FROM material_imports 
        WHERE material_id = material_record.material_id;
        
        -- Nếu không có dữ liệu nhập, đặt giá = 0
        material_avg_cost := COALESCE(material_avg_cost, 0);
        
        -- Cộng vào tổng chi phí
        v_total_cost := v_total_cost + (material_record.quantity_required * material_avg_cost);
    END LOOP;
    
    RETURN v_total_cost;
END;
$$ LANGUAGE plpgsql;

-- Dữ liệu mẫu cho testing
-- INSERT INTO customers (name, phone, address) VALUES
-- ('Công ty ABC', '0901234567', '123 Đường ABC, TP.HCM'),
-- ('Cửa hàng XYZ', '0987654321', '456 Đường XYZ, Hà Nội'),
-- ('Khách lẻ Nguyễn Văn A', '0912345678', '789 Đường DEF, Đà Nẵng');

-- INSERT INTO materials (name, unit, current_stock) VALUES
-- ('Chai thủy tinh 500ml', 'chai', 0),
-- ('Tem nhãn', 'cái', 0),
-- ('Thùng carton', 'thùng', 0),
-- ('Nắp chai', 'cái', 0);

-- INSERT INTO products (name, unit, current_stock) VALUES
-- ('Thùng nước 24 chai', 'thùng', 0),
-- ('Chai nước lẻ', 'chai', 0);