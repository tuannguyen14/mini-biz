-- XÓA cột current_stock từ bảng products
ALTER TABLE products DROP COLUMN IF EXISTS current_stock;

-- XÓA bảng product_packaging (không cần nữa)
DROP TABLE IF EXISTS product_packaging CASCADE;

-- XÓA các trigger và function cũ liên quan đến product stock
DROP TRIGGER IF EXISTS trigger_update_stock_on_packaging ON product_packaging;
DROP FUNCTION IF EXISTS update_stock_on_packaging();

-- SỬA LẠI trigger bán hàng - chỉ trừ material
DROP TRIGGER IF EXISTS trigger_update_stock_on_order_item ON order_items;
DROP FUNCTION IF EXISTS update_stock_on_order_item();

CREATE OR REPLACE FUNCTION update_stock_on_order_item()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.item_type = 'product' THEN
        -- Trừ vật tư theo công thức sản phẩm (không trừ stock sản phẩm)
        UPDATE materials m
        SET current_stock = current_stock - (pm.quantity_required * NEW.quantity),
            updated_at = NOW()
        FROM product_materials pm
        WHERE pm.product_id = NEW.product_id
        AND pm.material_id = m.id;
        
    ELSIF NEW.item_type = 'material' THEN
        -- Trừ tồn kho vật tư trực tiếp
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

-- CÂP NHẬT View system_overview (loại bỏ total_stock)
DROP VIEW IF EXISTS system_overview;
CREATE VIEW system_overview AS
SELECT 
    (SELECT COUNT(*) FROM customers) as total_customers,
    (SELECT COUNT(*) FROM orders WHERE status = 'completed') as total_orders,
    (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'completed') as total_revenue,
    (SELECT COALESCE(SUM(profit), 0) FROM orders WHERE status = 'completed') as total_profit,
    (SELECT COALESCE(SUM(outstanding_debt), 0) FROM customers) as total_debt,
    (SELECT COUNT(*) FROM products) as total_products,
    (SELECT COUNT(*) FROM materials) as total_materials,
    (SELECT COALESCE(SUM(current_stock), 0) FROM materials) as total_material_stock;

-- THÊM View để theo dõi materials có thể sản xuất được bao nhiêu sản phẩm
CREATE OR REPLACE VIEW product_possible_quantity AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.unit as product_unit,
    CASE 
        WHEN COUNT(pm.material_id) = 0 THEN 0
        ELSE COALESCE(MIN(FLOOR(m.current_stock / pm.quantity_required)), 0)
    END as max_possible_quantity
FROM products p
LEFT JOIN product_materials pm ON p.id = pm.product_id
LEFT JOIN materials m ON pm.material_id = m.id
GROUP BY p.id, p.name, p.unit;

-- CẬP NHẬT dữ liệu mẫu (loại bỏ current_stock từ products)
-- INSERT INTO products (name, unit) VALUES
-- ('Thùng nước 24 chai', 'thùng'),
-- ('Chai nước lẻ', 'chai');