-- Thêm cột discount vào bảng order_items
ALTER TABLE order_items ADD COLUMN discount DECIMAL(20,2) DEFAULT 0;

-- Cập nhật lại các cột generated để tính discount
ALTER TABLE order_items DROP COLUMN total_price;
ALTER TABLE order_items DROP COLUMN profit;

ALTER TABLE order_items ADD COLUMN total_price DECIMAL(20,2) GENERATED ALWAYS AS ((quantity * unit_price) - discount) STORED;
ALTER TABLE order_items ADD COLUMN profit DECIMAL(20,2) GENERATED ALWAYS AS (((quantity * unit_price) - discount) - (quantity * unit_cost)) STORED;

-- Cập nhật logic status của orders
-- Thay đổi default status và thêm logic tự động
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'pending';

-- Cập nhật trigger để tự động set status dựa trên debt_amount
CREATE OR REPLACE FUNCTION update_order_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Tự động cập nhật status dựa trên debt_amount
    IF NEW.debt_amount <= 0 THEN
        NEW.status = 'completed';
    ELSIF NEW.paid_amount > 0 THEN
        NEW.status = 'partial_paid';
    ELSE
        NEW.status = 'pending';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_order_status
    BEFORE INSERT OR UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_order_status();

-- Cập nhật trigger thanh toán để tự động thay đổi status
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
    
    -- Sau khi cập nhật paid_amount, trigger update_order_status sẽ tự động chạy
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Cập nhật view system_overview để phân loại theo status
CREATE OR REPLACE VIEW system_overview AS
SELECT 
    (SELECT COUNT(*) FROM customers) as total_customers,
    (SELECT COUNT(*) FROM products) as total_products,
    (SELECT COUNT(*) FROM orders WHERE status = 'completed') as completed_orders,
    (SELECT COUNT(*) FROM orders WHERE status = 'partial_paid') as partial_paid_orders,
    (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders,
    (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status IN ('completed', 'partial_paid')) as total_revenue,
    (SELECT COALESCE(SUM(profit), 0) FROM orders WHERE status IN ('completed', 'partial_paid')) as total_profit,
    (SELECT COALESCE(SUM(outstanding_debt), 0) FROM customers) as total_debt,
    (SELECT COALESCE(SUM(current_stock), 0) FROM materials) as total_material_stock;