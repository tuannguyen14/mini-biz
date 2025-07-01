-- PHIÊN BẢN ĐỠN GIẢN CHO SUPABASE
-- Chạy từng câu lệnh một

-- 1. Xóa cũ
DROP TRIGGER IF EXISTS trigger_update_order_payment ON payments;
DROP FUNCTION IF EXISTS update_order_payment();

-- 2. Tạo function đơn giản
CREATE FUNCTION update_order_payment()
RETURNS TRIGGER AS $trigger$
BEGIN
    UPDATE orders 
    SET 
        paid_amount = (
            SELECT COALESCE(SUM(amount), 0) 
            FROM payments 
            WHERE order_id = NEW.order_id
        ),
        status = CASE 
            WHEN (
                SELECT COALESCE(SUM(amount), 0) 
                FROM payments 
                WHERE order_id = NEW.order_id
            ) >= total_amount THEN 'completed'
            WHEN (
                SELECT COALESCE(SUM(amount), 0) 
                FROM payments 
                WHERE order_id = NEW.order_id
            ) > 0 THEN 'partial_paid'
            ELSE 'pending'
        END,
        updated_at = NOW()
    WHERE id = NEW.order_id;
    
    RETURN NEW;
END;
$trigger$ LANGUAGE plpgsql;

-- 3. Tạo trigger
CREATE TRIGGER trigger_update_order_payment
    AFTER INSERT ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_order_payment();