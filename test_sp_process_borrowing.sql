-- =====================================================
-- TEST SCRIPT: sp_process_borrowing
-- =====================================================

-- Cách 1: Gọi procedure với SET cho OUT params (MySQL 8.0+)
-- --------------------------------------------------------

-- Bước 1: Khai báo biến
SET @v_reader_id = 1;           -- ID độc giả (thay đổi theo data của bạn)
SET @v_borrowed_by = 1;         -- ID nhân viên tạo phiếu
SET @v_payment_method_id = 1;   -- 1: Cash, 2: Banking (xem bảng payment_methods)
SET @v_notes = 'Mượn sách đọc tại nhà';  -- Ghi chú
SET @v_borrow_days = 14;        -- Số ngày mượn (mặc định 14)

-- Bước 2: Gọi procedure
CALL sp_process_borrowing(
    @v_reader_id,
    @v_borrowed_by,
    @v_payment_method_id,
    @v_notes,
    @v_borrow_days,
    @out_transaction_id,
    @out_success,
    @out_message
);

-- Bước 3: Xem kết quả
SELECT 
    @out_transaction_id AS new_transaction_id,
    @out_success AS is_success,
    @out_message AS message;

-- =====================================================
-- Cách 2: Gọi trực tiếp với giá trị literal (dễ test)
-- --------------------------------------------------------

-- Test với reader_id = 1, borrowed_by = 1
CALL sp_process_borrowing(1, 1, 1, 'Test phiếu mượn', 7, @tid, @success, @msg);
SELECT @tid, @success, @msg;

-- =====================================================
-- Kiểm tra dữ liệu vừa tạo
-- --------------------------------------------------------

-- Xem phiếu mượn mới nhất
SELECT * FROM borrow_transactions 
WHERE transaction_id = @out_transaction_id 
   OR transaction_id = @tid;

-- Hoặc xem tất cả phiếu mượn của độc giả
SELECT 
    bt.transaction_id,
    bt.transaction_code,
    bt.reader_id,
    r.full_name AS reader_name,
    bt.status,
    bt.total_books,
    bt.borrow_fee,
    bt.expected_return_date,
    bt.notes
FROM borrow_transactions bt
JOIN readers r ON bt.reader_id = r.reader_id
WHERE bt.reader_id = 1
ORDER BY bt.borrow_date DESC
LIMIT 5;

-- =====================================================
-- DỮ LIỆU THAM KHẢO (Điền vào input phù hợp)
-- --------------------------------------------------------

-- Lấy danh sách độc giả có sẵn
SELECT reader_id, card_number, full_name, current_borrows, tier_id 
FROM readers 
WHERE deleted_at IS NULL AND is_active = TRUE 
LIMIT 10;

-- Lấy danh sách nhân viên
SELECT user_id, full_name, email FROM users WHERE is_active = TRUE LIMIT 10;

-- Lấy phương thức thanh toán
SELECT payment_method_id, method_name FROM payment_methods WHERE is_active = TRUE;

-- Lấy giới hạn mượn theo tier của độc giả
SELECT 
    r.reader_id, 
    r.full_name,
    mt.tier_name,
    mt.max_books,
    mt.max_borrow_days,
    r.current_borrows,
    (mt.max_books - r.current_borrows) AS can_borrow_more
FROM readers r
JOIN membership_tiers mt ON r.tier_id = mt.tier_id
WHERE r.reader_id = 1;
