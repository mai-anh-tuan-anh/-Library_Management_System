-- =====================================================
-- NATIONAL LIBRARY DATABASE SCHEMA
-- =====================================================
-- Version: 1.0
-- Description: Complete Library Management System
-- Features: Transaction & Rollback, Triggers, Views, Events
-- =====================================================

-- Drop database if exists and create new
DROP DATABASE IF EXISTS national_library;
CREATE DATABASE national_library CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE national_library;

-- =====================================================
-- 1. USER MANAGEMENT SYSTEM (3 tables)
-- =====================================================

CREATE TABLE roles (
    role_id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME DEFAULT NULL,
    INDEX idx_deleted_at (deleted_at)
) ENGINE=InnoDB;

CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME DEFAULT NULL,
    INDEX idx_email (email),
    INDEX idx_deleted_at (deleted_at)
) ENGINE=InnoDB;

CREATE TABLE user_roles (
    user_role_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(user_id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_role (user_id, role_id)
) ENGINE=InnoDB;

-- =====================================================
-- 2. MEMBERSHIP & READER SYSTEM (4 tables)
-- =====================================================

CREATE TABLE membership_tiers (
    tier_id INT PRIMARY KEY AUTO_INCREMENT,
    tier_name VARCHAR(50) NOT NULL UNIQUE,
    tier_code VARCHAR(20) NOT NULL UNIQUE,
    badge_icon VARCHAR(255),
    badge_color VARCHAR(20) DEFAULT '#CD7F32',
    max_books INT NOT NULL DEFAULT 5,
    max_borrow_days INT NOT NULL DEFAULT 14,
    late_threshold INT NOT NULL DEFAULT 5,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE readers (
    reader_id INT PRIMARY KEY AUTO_INCREMENT,
    card_number VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other') DEFAULT 'other',
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    id_card VARCHAR(50),
    tier_id INT NOT NULL DEFAULT 1,
    late_count INT DEFAULT 0,
    total_borrows INT DEFAULT 0,
    current_borrows INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_blacklisted BOOLEAN DEFAULT FALSE,
    blacklist_reason VARCHAR(255),
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME DEFAULT NULL,
    FOREIGN KEY (tier_id) REFERENCES membership_tiers(tier_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_card_number (card_number),
    INDEX idx_phone (phone),
    INDEX idx_email (email),
    INDEX idx_tier (tier_id),
    INDEX idx_deleted_at (deleted_at)
) ENGINE=InnoDB;

CREATE TABLE membership_history (
    history_id INT PRIMARY KEY AUTO_INCREMENT,
    reader_id INT NOT NULL,
    old_tier_id INT,
    new_tier_id INT NOT NULL,
    change_reason VARCHAR(255),
    late_count_at_change INT DEFAULT 0,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changed_by INT,
    FOREIGN KEY (reader_id) REFERENCES readers(reader_id) ON DELETE CASCADE,
    FOREIGN KEY (old_tier_id) REFERENCES membership_tiers(tier_id) ON DELETE SET NULL,
    FOREIGN KEY (new_tier_id) REFERENCES membership_tiers(tier_id),
    FOREIGN KEY (changed_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_reader (reader_id)
) ENGINE=InnoDB;

CREATE TABLE blacklist_history (
    blacklist_id INT PRIMARY KEY AUTO_INCREMENT,
    reader_id INT NOT NULL,
    action ENUM('add', 'remove') NOT NULL,
    reason VARCHAR(255),
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    performed_by INT,
    FOREIGN KEY (reader_id) REFERENCES readers(reader_id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_reader (reader_id)
) ENGINE=InnoDB;

-- =====================================================
-- 3. BOOK CATALOG SYSTEM (6 tables)
-- =====================================================

CREATE TABLE categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    category_code VARCHAR(20) NOT NULL UNIQUE,
    category_name VARCHAR(255) NOT NULL,
    parent_category_id INT DEFAULT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME DEFAULT NULL,
    FOREIGN KEY (parent_category_id) REFERENCES categories(category_id) ON DELETE SET NULL,
    INDEX idx_code (category_code),
    INDEX idx_parent (parent_category_id),
    INDEX idx_deleted_at (deleted_at)
) ENGINE=InnoDB;

CREATE TABLE authors (
    author_id INT PRIMARY KEY AUTO_INCREMENT,
    author_code VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    biography TEXT,
    birth_date DATE,
    death_date DATE,
    nationality VARCHAR(100),
    photo_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME DEFAULT NULL,
    INDEX idx_code (author_code),
    INDEX idx_deleted_at (deleted_at)
) ENGINE=InnoDB;

CREATE TABLE publishers (
    publisher_id INT PRIMARY KEY AUTO_INCREMENT,
    publisher_code VARCHAR(20) NOT NULL UNIQUE,
    publisher_name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME DEFAULT NULL,
    INDEX idx_code (publisher_code),
    INDEX idx_deleted_at (deleted_at)
) ENGINE=InnoDB;

CREATE TABLE books (
    book_id INT PRIMARY KEY AUTO_INCREMENT,
    isbn VARCHAR(20) UNIQUE,
    book_code VARCHAR(20) NOT NULL UNIQUE,
    title VARCHAR(500) NOT NULL,
    author VARCHAR(255),
    subtitle VARCHAR(500),
    edition VARCHAR(50),
    publisher_id INT,
    category_id INT,
    publish_year INT,
    language VARCHAR(50) DEFAULT 'Vietnamese',
    page_count INT,
    summary TEXT,
    cover_image VARCHAR(500),
    price DECIMAL(10, 2) NOT NULL,
    borrow_price_per_day DECIMAL(8, 2) DEFAULT 0.00,
    total_copies INT DEFAULT 0,
    available_copies INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME DEFAULT NULL,
    FOREIGN KEY (publisher_id) REFERENCES publishers(publisher_id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL,
    INDEX idx_isbn (isbn),
    INDEX idx_code (book_code),
    INDEX idx_category (category_id),
    INDEX idx_title (title),
    INDEX idx_deleted_at (deleted_at)
) ENGINE=InnoDB;

CREATE TABLE book_authors (
    book_author_id INT PRIMARY KEY AUTO_INCREMENT,
    book_id INT NOT NULL,
    author_id INT NOT NULL,
    author_order INT DEFAULT 1,
    FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES authors(author_id) ON DELETE CASCADE,
    UNIQUE KEY unique_book_author (book_id, author_id)
) ENGINE=InnoDB;

CREATE TABLE book_copies (
    copy_id INT PRIMARY KEY AUTO_INCREMENT,
    book_id INT NOT NULL,
    barcode VARCHAR(50) NOT NULL UNIQUE,
    shelf_location_id INT,
    location_code VARCHAR(50),
    acquisition_date DATE,
    condition_status ENUM('new', 'good', 'fair', 'poor', 'damaged') DEFAULT 'new',
    status ENUM('available', 'borrowed', 'maintenance', 'lost') DEFAULT 'available',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME DEFAULT NULL,
    FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE,
    INDEX idx_barcode (barcode),
    INDEX idx_book (book_id),
    INDEX idx_status (status),
    INDEX idx_deleted_at (deleted_at)
) ENGINE=InnoDB;

CREATE TABLE shelf_locations (
    location_id INT PRIMARY KEY AUTO_INCREMENT,
    location_code VARCHAR(20) NOT NULL UNIQUE,
    floor VARCHAR(10),
    section VARCHAR(50),
    shelf_number VARCHAR(20),
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (location_code)
) ENGINE=InnoDB;

-- Add FK to book_copies after shelf_locations created
ALTER TABLE book_copies 
    ADD FOREIGN KEY (shelf_location_id) REFERENCES shelf_locations(location_id) ON DELETE SET NULL;

-- =====================================================
-- 4. BORROWING & TRANSACTION SYSTEM (5 tables)
-- =====================================================

CREATE TABLE borrow_transactions (
    transaction_id INT PRIMARY KEY AUTO_INCREMENT,
    transaction_code VARCHAR(50) NOT NULL UNIQUE,
    reader_id INT NOT NULL,
    borrowed_by INT NOT NULL,
    total_books INT NOT NULL DEFAULT 0,
    borrow_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    expected_return_date DATE NOT NULL,
    borrow_fee DECIMAL(10, 2) DEFAULT 0.00,
    payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
    payment_method_id INT,
    payment_date DATETIME,
    status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (reader_id) REFERENCES readers(reader_id),
    FOREIGN KEY (borrowed_by) REFERENCES users(user_id),
    INDEX idx_reader (reader_id),
    INDEX idx_status (status),
    INDEX idx_expected_return (expected_return_date)
) ENGINE=InnoDB;

CREATE TABLE borrow_details (
    detail_id INT PRIMARY KEY AUTO_INCREMENT,
    transaction_id INT NOT NULL,
    copy_id INT NOT NULL,
    book_id INT NOT NULL,
    borrow_days INT NOT NULL,
    daily_fee DECIMAL(8, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'borrowed',
    actual_return_date DATE NULL,
    FOREIGN KEY (transaction_id) REFERENCES borrow_transactions(transaction_id) ON DELETE CASCADE,
    FOREIGN KEY (copy_id) REFERENCES book_copies(copy_id),
    FOREIGN KEY (book_id) REFERENCES books(book_id),
    UNIQUE KEY unique_transaction_copy (transaction_id, copy_id),
    INDEX idx_transaction (transaction_id),
    INDEX idx_copy (copy_id)
) ENGINE=InnoDB;

-- Create reference tables first (needed by return_records)
CREATE TABLE damage_types (
    damage_type_id INT PRIMARY KEY AUTO_INCREMENT,
    damage_code VARCHAR(20) NOT NULL UNIQUE,
    damage_name VARCHAR(255) NOT NULL,
    description TEXT,
    fine_percentage DECIMAL(5, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (damage_code)
) ENGINE=InnoDB;

CREATE TABLE payment_methods (
    method_id INT PRIMARY KEY AUTO_INCREMENT,
    method_code VARCHAR(20) NOT NULL UNIQUE,
    method_name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Add FK to borrow_transactions after payment_methods created
ALTER TABLE borrow_transactions 
    ADD FOREIGN KEY (payment_method_id) REFERENCES payment_methods(method_id) ON DELETE SET NULL;

CREATE TABLE return_records (
    return_id INT PRIMARY KEY AUTO_INCREMENT,
    transaction_id INT NOT NULL,
    detail_id INT NOT NULL,
    returned_by INT NOT NULL,
    return_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    expected_return_date DATE NOT NULL,
    days_late INT DEFAULT 0,
    late_fee DECIMAL(10, 2) DEFAULT 0.00,  -- Phí trễ: % x giá sách x số ngày (lấy từ settings)
    is_damaged BOOLEAN DEFAULT FALSE,
    damage_type_id INT,
    damage_description TEXT,
    damage_fee DECIMAL(10, 2) DEFAULT 0.00,  -- Phí hư hỏng: % x book.price
    fine_amount DECIMAL(10, 2) DEFAULT 0.00,  -- Tổng phí = late_fee + damage_fee
    fine_paid BOOLEAN DEFAULT FALSE,
    fine_payment_method_id INT,
    fine_payment_date DATETIME,
    condition_on_return ENUM('new', 'good', 'fair', 'poor', 'damaged') DEFAULT 'good',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES borrow_transactions(transaction_id),
    FOREIGN KEY (detail_id) REFERENCES borrow_details(detail_id),
    FOREIGN KEY (returned_by) REFERENCES users(user_id),
    FOREIGN KEY (damage_type_id) REFERENCES damage_types(damage_type_id),
    FOREIGN KEY (fine_payment_method_id) REFERENCES payment_methods(method_id) ON DELETE SET NULL,
    INDEX idx_transaction (transaction_id),
    INDEX idx_detail (detail_id),
    INDEX idx_return_date (return_date)
) ENGINE=InnoDB;

-- =====================================================
-- 5. RESERVATION & NOTIFICATION SYSTEM (4 tables)
-- =====================================================

CREATE TABLE reservations (
    reservation_id INT PRIMARY KEY AUTO_INCREMENT,
    reader_id INT NOT NULL,
    book_id INT NOT NULL,
    preferred_copy_id INT,
    reservation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiry_date DATE NOT NULL,
    status ENUM('pending', 'fulfilled', 'cancelled', 'expired') DEFAULT 'pending',
    fulfilled_at DATETIME,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (reader_id) REFERENCES readers(reader_id),
    FOREIGN KEY (book_id) REFERENCES books(book_id),
    FOREIGN KEY (preferred_copy_id) REFERENCES book_copies(copy_id),
    INDEX idx_reader (reader_id),
    INDEX idx_book (book_id),
    INDEX idx_status (status)
) ENGINE=InnoDB;

CREATE TABLE notification_templates (
    template_id INT PRIMARY KEY AUTO_INCREMENT,
    template_code VARCHAR(50) NOT NULL UNIQUE,
    template_name VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    content TEXT NOT NULL,
    variables TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE notifications (
    notification_id INT PRIMARY KEY AUTO_INCREMENT,
    reader_id INT,
    template_id INT,
    notification_type ENUM('due_reminder', 'overdue', 'reservation', 'system', 'promotion') DEFAULT 'system',
    title VARCHAR(500),
    message TEXT,
    sent_via ENUM('sms', 'email', 'app') DEFAULT 'sms',
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME,
    related_transaction_id INT,
    FOREIGN KEY (reader_id) REFERENCES readers(reader_id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES notification_templates(template_id),
    FOREIGN KEY (related_transaction_id) REFERENCES borrow_transactions(transaction_id) ON DELETE SET NULL,
    INDEX idx_reader (reader_id),
    INDEX idx_type (notification_type),
    INDEX idx_sent_at (sent_at)
) ENGINE=InnoDB;

CREATE TABLE due_reminders (
    reminder_id INT PRIMARY KEY AUTO_INCREMENT,
    transaction_id INT NOT NULL,
    reader_id INT NOT NULL,
    days_remaining INT NOT NULL,
    reminder_date DATE NOT NULL,
    is_sent BOOLEAN DEFAULT FALSE,
    sent_at DATETIME,
    sent_by INT,
    notes TEXT,
    FOREIGN KEY (transaction_id) REFERENCES borrow_transactions(transaction_id),
    FOREIGN KEY (reader_id) REFERENCES readers(reader_id),
    FOREIGN KEY (sent_by) REFERENCES users(user_id),
    INDEX idx_transaction (transaction_id),
    INDEX idx_reminder_date (reminder_date),
    INDEX idx_sent (is_sent)
) ENGINE=InnoDB;

-- =====================================================
-- 6. SYSTEM & AUDIT LOGS (3 tables)
-- =====================================================

CREATE TABLE system_settings (
    setting_id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_group VARCHAR(50) DEFAULT 'general',
    description VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE activity_logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_performed_at (performed_at)
) ENGINE=InnoDB;

CREATE TABLE borrow_rules (
    rule_id INT PRIMARY KEY AUTO_INCREMENT,
    tier_id INT NOT NULL,
    max_books INT NOT NULL DEFAULT 5,
    max_borrow_days INT NOT NULL DEFAULT 14,
    daily_fee_multiplier DECIMAL(4, 2) DEFAULT 1.00,
    late_fee_rate DECIMAL(5, 2) DEFAULT 50.00,
    is_active BOOLEAN DEFAULT TRUE,
    effective_from DATE NOT NULL,
    effective_to DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tier_id) REFERENCES membership_tiers(tier_id),
    INDEX idx_tier (tier_id),
    INDEX idx_effective (effective_from, effective_to)
) ENGINE=InnoDB;

-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert default roles
INSERT INTO roles (role_name, description) VALUES
('admin', 'System administrator with full access'),
('librarian', 'Library staff who can manage books and borrowing'),
('staff', 'General staff with limited access'),
('accountant', 'Staff who can view financial reports');

-- Insert membership tiers
INSERT INTO membership_tiers (tier_name, tier_code, badge_icon, badge_color, max_books, max_borrow_days, late_threshold, description) VALUES
('Đồng', 'BRONZE', 'badge-bronze.png', '#CD7F32', 5, 14, 5, 'Thành viên mới, tối đa 5 sách'),
('Bạc', 'SILVER', 'badge-silver.png', '#C0C0C0', 8, 14, 5, 'Thành viên bạc, tối đa 8 sách'),
('Vàng', 'GOLD', 'badge-gold.png', '#FFD700', 12, 21, 5, 'Thành viên vàng, tối đa 12 sách'),
('Kim Cương', 'DIAMOND', 'badge-diamond.png', '#B9F2FF', 20, 30, 5, 'Thành viên kim cương, tối đa 20 sách'),
('Huyền Thoại', 'LEGEND', 'badge-legend.png', '#FF6B35', 30, 45, 5, 'Thành viên huyền thoại, tối đa 30 sách');

-- Insert payment methods
INSERT INTO payment_methods (method_code, method_name, description) VALUES
('CASH', 'Tiền mặt', 'Thanh toán bằng tiền mặt tại quầy'),
('BANKING', 'Chuyển khoản', 'Thanh toán qua chuyển khoản ngân hàng'),
('MOMO', 'Ví MoMo', 'Thanh toán qua ví điện tử MoMo'),
('ZALOPAY', 'ZaloPay', 'Thanh toán qua ví ZaloPay');

-- Insert damage types (preset based on book price percentage)
INSERT INTO damage_types (damage_code, damage_name, description, fine_percentage) VALUES
('GOOD', 'Tốt', 'Không có hư hỏng', 0.00),
('FAIR', 'Khá', 'Trầy xước nhẹ, góc bị móp', 10.00),
('POOR', 'Trung bình', 'Nhiều vết trầy, bìa cũ', 25.00),
('DAMAGED', 'Hư hỏng', 'Trang rách, bìa hỏng nặng', 50.00),
('LOST', 'Mất sách', 'Mất hoàn toàn không tìm thấy', 100.00);

-- Insert notification templates
INSERT INTO notification_templates (template_code, template_name, subject, content, variables) VALUES
('DUE_REMINDER_3DAYS', 'Nhắc nhở sắp đến hạn (3 ngày)', 'Nhắc nhở: Sách sắp đến hạn trả', 
 'Kính gửi {reader_name},\nBạn có {book_count} cuốn sách sắp đến hạn trả sau 3 ngày ({due_date}). Vui lòng đến thư viện để trả hoặc gia hạn.\nMã phiếu: {transaction_code}',
 'reader_name,book_count,due_date,transaction_code'),

('DUE_REMINDER_1DAY', 'Nhắc nhở sắp đến hạn (1 ngày)', 'Cảnh báo: Sách sắp đến hạn trả ngày mai', 
 'Kính gửi {reader_name},\nBạn có {book_count} cuốn sách phải trả vào ngày mai ({due_date}). Vui lòng đến thư viện ngay để tránh phí phạt.\nMã phiếu: {transaction_code}',
 'reader_name,book_count,due_date,transaction_code'),

('OVERDUE_NOTICE', 'Thông báo quá hạn', 'Cảnh báo: Sách đã quá hạn', 
 'Kính gửi {reader_name},\nBạn có {book_count} cuốn sách đã quá hạn {days_overdue} ngày. Phí phạt hiện tại: {fine_amount} VNĐ. Vui lòng đến thư viện để trả sách và thanh toán phí phạt.\nMã phiếu: {transaction_code}',
 'reader_name,book_count,days_overdue,fine_amount,transaction_code'),

('RESERVATION_AVAILABLE', 'Sách đặt trước có sẵn', 'Sách bạn đặt trước đã có sẵn', 
 'Kính gửi {reader_name},\nSách "{book_title}" bạn đặt trước đã có sẵn. Vui lòng đến thư viện trong vòng 24 giờ để nhận sách.\nMã đặt trước: {reservation_code}',
 'reader_name,book_title,reservation_code'),

('TIER_DOWNGRADE', 'Thông báo hạ cấp thành viên', 'Thông báo hạ cấp thành viên', 
 'Kính gửi {reader_name},\nDo bạn đã trả muộn sách 5 lần, cấp độ thành viên của bạn đã được điều chỉnh từ {old_tier} xuống {new_tier}. Số sách tối đa có thể mượn: {max_books} cuốn.',
 'reader_name,old_tier,new_tier,max_books');

-- Insert system settings
INSERT INTO system_settings (setting_key, setting_value, setting_group, description) VALUES
('library_name', 'Thư viện Quốc gia', 'general', 'Tên thư viện'),
('max_borrow_days', '14', 'borrowing', 'Số ngày mượn tối đa mặc định'),
('late_fee_rate', '50', 'borrowing', 'Phần trăm phí phạt trả muộn (so với giá sách)'),
('late_threshold_downgrade', '5', 'membership', 'Số lần trả muộn để bị hạ cấp'),
('currency', 'VND', 'general', 'Đơn vị tiền tệ'),
('due_reminder_days', '3,1', 'notifications', 'Số ngày trước hạn để gửi nhắc nhở (phân cách bằng dấu phẩy)'),
('barcode_prefix', 'LIB', 'inventory', 'Tiền tố cho mã barcode'),
('enable_auto_notifications', 'true', 'notifications', 'Bật/tắt gửi thông báo tự động');

-- Insert default admin user (password: admin123)
-- bcrypt hash for 'admin123' generated with bcryptjs
INSERT INTO users (email, password_hash, full_name, phone, is_active) VALUES
('admin@library.vn', '$2a$10$cQvhs0/c2YD/v3wQklEx5O3UGD5SSH5CJRG3NFVtvgPCMOtqtl.Yy', 'System Administrator', '0900000000', TRUE)
ON DUPLICATE KEY UPDATE password_hash = password_hash; -- Don't overwrite existing password

-- Assign admin role
INSERT INTO user_roles (user_id, role_id) VALUES (1, 1);

-- =====================================================
-- FUNCTIONS
-- =====================================================

DELIMITER //

-- Function: Calculate late fee (with rate from settings)
CREATE FUNCTION calculate_late_fee(
    p_book_price DECIMAL(10, 2),
    p_days_late INT
) RETURNS DECIMAL(10, 2)
NOT DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_late_fee DECIMAL(10, 2);
    DECLARE v_late_rate DECIMAL(5, 2);
    
    -- Get late penalty percentage from settings (default 50%)
    SELECT COALESCE(CAST(setting_value AS DECIMAL(5,2)), 50.00)
    INTO v_late_rate
    FROM system_settings
    WHERE setting_key = 'late_penalty_percent';
    
    IF v_late_rate IS NULL THEN
        SET v_late_rate = 50.00;
    END IF;
    
    IF p_days_late <= 0 THEN
        RETURN 0.00;
    END IF;
    
    SET v_late_fee = p_book_price * (v_late_rate / 100) * p_days_late;
    
    RETURN ROUND(v_late_fee, 2);
END //

-- Function: Calculate damage fee
CREATE FUNCTION calculate_damage_fee(
    p_book_price DECIMAL(10, 2),
    p_damage_percentage DECIMAL(5, 2)
) RETURNS DECIMAL(10, 2)
DETERMINISTIC
BEGIN
    DECLARE v_damage_fee DECIMAL(10, 2);
    
    SET v_damage_fee = p_book_price * (p_damage_percentage / 100);
    
    RETURN ROUND(v_damage_fee, 2);
END //

-- Function: Calculate total borrow fee
CREATE FUNCTION calculate_borrow_fee(
    p_daily_fee DECIMAL(8, 2),
    p_borrow_days INT
) RETURNS DECIMAL(10, 2)
DETERMINISTIC
BEGIN
    RETURN ROUND(p_daily_fee * p_borrow_days, 2);
END //

-- Function: Generate barcode
CREATE FUNCTION generate_book_barcode(
    p_book_id INT,
    p_copy_number INT
) RETURNS VARCHAR(50)
DETERMINISTIC
BEGIN
    RETURN CONCAT('LIB-', LPAD(p_book_id, 6, '0'), '-', LPAD(p_copy_number, 3, '0'));
END //

-- Function: Generate transaction code
CREATE FUNCTION generate_transaction_code(
    p_reader_id INT
) RETURNS VARCHAR(50)
DETERMINISTIC
BEGIN
    RETURN CONCAT('TRX-', DATE_FORMAT(CURDATE(), '%Y%m%d'), '-', LPAD(p_reader_id, 6, '0'), '-', LPAD(FLOOR(RAND() * 1000), 4, '0'));
END //

-- Function: Generate reader card number
CREATE FUNCTION generate_card_number()
 RETURNS VARCHAR(50)
DETERMINISTIC
BEGIN
    RETURN CONCAT('RD', DATE_FORMAT(CURDATE(), '%Y'), LPAD(FLOOR(RAND() * 100000), 6, '0'));
END //

-- Function: Check if reader can borrow
CREATE FUNCTION can_reader_borrow(
    p_reader_id INT,
    p_requested_books INT
) RETURNS BOOLEAN
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_max_books INT;
    DECLARE v_current_books INT;
    DECLARE v_is_active BOOLEAN;
    DECLARE v_is_blacklisted BOOLEAN;
    
    SELECT 
        mt.max_books,
        r.current_borrows,
        r.is_active,
        r.is_blacklisted
    INTO 
        v_max_books,
        v_current_books,
        v_is_active,
        v_is_blacklisted
    FROM readers r
    JOIN membership_tiers mt ON r.tier_id = mt.tier_id
    WHERE r.reader_id = p_reader_id;
    
    IF v_is_active = FALSE OR v_is_blacklisted = TRUE THEN
        RETURN FALSE;
    END IF;
    
    IF (v_current_books + p_requested_books) > v_max_books THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END //

DELIMITER ;

-- =====================================================
-- TRIGGERS
-- =====================================================

DELIMITER //

-- Trigger: Update book available copies when copy status changes
CREATE TRIGGER trg_update_book_available_copies
AFTER UPDATE ON book_copies
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        IF NEW.status = 'available' AND OLD.status != 'available' THEN
            UPDATE books SET available_copies = available_copies + 1 WHERE book_id = NEW.book_id;
        ELSEIF NEW.status != 'available' AND OLD.status = 'available' THEN
            UPDATE books SET available_copies = available_copies - 1 WHERE book_id = NEW.book_id;
        END IF;
    END IF;
END //

-- Trigger: Update book totals when copy is added
CREATE TRIGGER trg_update_book_totals_on_insert
AFTER INSERT ON book_copies
FOR EACH ROW
BEGIN
    UPDATE books 
    SET total_copies = total_copies + 1,
        available_copies = CASE WHEN NEW.status = 'available' THEN available_copies + 1 ELSE available_copies END
    WHERE book_id = NEW.book_id;
END //

-- Trigger: Update book totals when copy is soft deleted
CREATE TRIGGER trg_update_book_totals_on_delete
AFTER UPDATE ON book_copies
FOR EACH ROW
BEGIN
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
        UPDATE books 
        SET total_copies = total_copies - 1,
            available_copies = CASE WHEN NEW.status = 'available' THEN available_copies - 1 ELSE available_copies END
        WHERE book_id = NEW.book_id;
    END IF;
END //

-- Trigger: Update reader borrow counts on borrow
CREATE TRIGGER trg_update_reader_on_borrow
AFTER INSERT ON borrow_transactions
FOR EACH ROW
BEGIN
    UPDATE readers 
    SET current_borrows = current_borrows + NEW.total_books,
        total_borrows = total_borrows + 1
    WHERE reader_id = NEW.reader_id;
END //

-- Trigger: Update reader borrow counts on return
CREATE TRIGGER trg_update_reader_on_return
AFTER INSERT ON return_records
FOR EACH ROW
BEGIN
    UPDATE readers 
    SET current_borrows = current_borrows - 1
    WHERE reader_id = (SELECT reader_id FROM borrow_transactions WHERE transaction_id = NEW.transaction_id);
END //

-- Trigger: Log activity on reader insert
CREATE TRIGGER trg_log_reader_insert
AFTER INSERT ON readers
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, new_values)
    VALUES (NEW.created_by, 'CREATE', 'reader', NEW.reader_id, 
            JSON_OBJECT('card_number', NEW.card_number, 'full_name', NEW.full_name, 'tier_id', NEW.tier_id));
END //

-- Trigger: Log activity on reader update
CREATE TRIGGER trg_log_reader_update
AFTER UPDATE ON readers
FOR EACH ROW
BEGIN
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
        INSERT INTO activity_logs (user_id, action, entity_type, entity_id, old_values, new_values)
        VALUES (NEW.created_by, 'DELETE', 'reader', NEW.reader_id, 
                JSON_OBJECT('card_number', OLD.card_number, 'full_name', OLD.full_name),
                JSON_OBJECT('deleted_at', NEW.deleted_at));
    ELSE
        INSERT INTO activity_logs (user_id, action, entity_type, entity_id, old_values, new_values)
        VALUES (NEW.created_by, 'UPDATE', 'reader', NEW.reader_id, 
                JSON_OBJECT('full_name', OLD.full_name, 'tier_id', OLD.tier_id, 'is_active', OLD.is_active),
                JSON_OBJECT('full_name', NEW.full_name, 'tier_id', NEW.tier_id, 'is_active', NEW.is_active));
    END IF;
END //

-- Trigger: Auto create due reminders when borrowing
CREATE TRIGGER trg_create_due_reminders
AFTER INSERT ON borrow_transactions
FOR EACH ROW
BEGIN
    -- Create reminder for 3 days before due
    INSERT INTO due_reminders (transaction_id, reader_id, days_remaining, reminder_date)
    VALUES (NEW.transaction_id, NEW.reader_id, 3, DATE_SUB(NEW.expected_return_date, INTERVAL 3 DAY));
    
    -- Create reminder for 1 day before due
    INSERT INTO due_reminders (transaction_id, reader_id, days_remaining, reminder_date)
    VALUES (NEW.transaction_id, NEW.reader_id, 1, DATE_SUB(NEW.expected_return_date, INTERVAL 1 DAY));
END //

-- Trigger: Handle late return - update late count
CREATE TRIGGER trg_handle_late_return
AFTER INSERT ON return_records
FOR EACH ROW
BEGIN
    IF NEW.days_late > 0 THEN
        UPDATE readers SET late_count = late_count + 1 WHERE reader_id = (SELECT reader_id FROM borrow_transactions WHERE transaction_id = NEW.transaction_id);
    END IF;
END //

DELIMITER ;

-- =====================================================
-- STORED PROCEDURES
-- =====================================================

DELIMITER //

-- Procedure: Process borrowing with transaction support
CREATE PROCEDURE sp_process_borrowing(
    IN p_reader_id INT,
    IN p_borrowed_by INT,
    IN p_payment_method_id INT,
    IN p_notes TEXT,
    IN p_borrow_days INT,
    OUT p_transaction_id INT,
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(255)
)
BEGIN
    DECLARE v_reader_active BOOLEAN;
    DECLARE v_reader_blacklisted BOOLEAN;
    DECLARE v_max_books INT;
    DECLARE v_current_books INT;
    DECLARE v_transaction_code VARCHAR(50);
    DECLARE v_expected_return_date DATE;
    
    -- Calculate expected return date
    SET v_expected_return_date = DATE_ADD(CURDATE(), INTERVAL COALESCE(p_borrow_days, 14) DAY);
    
    -- Start transaction
    START TRANSACTION;
    
    -- Check reader status
    SELECT 
        r.is_active, 
        r.is_blacklisted,
        mt.max_books,
        r.current_borrows
    INTO 
        v_reader_active, 
        v_reader_blacklisted,
        v_max_books,
        v_current_books
    FROM readers r
    JOIN membership_tiers mt ON r.tier_id = mt.tier_id
    WHERE r.reader_id = p_reader_id;
    
    -- Validate reader
    IF v_reader_active IS NULL THEN
        SET p_success = FALSE;
        SET p_message = 'Reader not found';
        ROLLBACK;
    ELSEIF v_reader_active = FALSE THEN
        SET p_success = FALSE;
        SET p_message = 'Reader account is inactive';
        ROLLBACK;
    ELSEIF v_reader_blacklisted = TRUE THEN
        SET p_success = FALSE;
        SET p_message = 'Reader is blacklisted';
        ROLLBACK;
    ELSE
        -- Generate unique transaction code with sequence number
        SET v_transaction_code = CONCAT('BRW-', DATE_FORMAT(CURDATE(), '%Y%m%d'), '-', p_reader_id, '-', LPAD(
            (SELECT COUNT(*) + 1 
             FROM borrow_transactions 
             WHERE DATE(borrow_date) = CURDATE() 
             AND reader_id = p_reader_id), 3, '0'));
        
        -- Create transaction header with expected_return_date
        INSERT INTO borrow_transactions (
            transaction_code, reader_id, borrowed_by, 
            total_books, borrow_fee, payment_status, 
            payment_method_id, payment_date, notes, expected_return_date
        ) VALUES (
            v_transaction_code, p_reader_id, p_borrowed_by,
            0, 0.00, 'pending',
            p_payment_method_id, NULL, p_notes, v_expected_return_date
        );
        
        SET p_transaction_id = LAST_INSERT_ID();
        SET p_success = TRUE;
        SET p_message = 'Transaction created successfully';
        
        COMMIT;
    END IF;
    
    -- Return OUT params as result set
    SELECT p_transaction_id, p_success, p_message;
END //

-- Procedure: Add book to borrowing transaction
CREATE PROCEDURE sp_add_book_to_transaction(
    IN p_transaction_id INT,
    IN p_copy_id INT,
    IN p_borrow_days INT,
    IN p_daily_fee DECIMAL(8, 2),
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(255)
)
BEGIN
    DECLARE v_book_id INT;
    DECLARE v_book_price DECIMAL(10, 2);
    DECLARE v_copy_status VARCHAR(20);
    DECLARE v_subtotal DECIMAL(10, 2);
    DECLARE v_reader_id INT;
    DECLARE v_max_days INT;
    
    -- Start transaction
    START TRANSACTION;
    
    -- Get book info and copy status
    SELECT 
        bc.book_id, 
        bc.status,
        b.price,
        bt.reader_id,
        mt.max_borrow_days
    INTO 
        v_book_id, 
        v_copy_status,
        v_book_price,
        v_reader_id,
        v_max_days
    FROM book_copies bc
    JOIN books b ON bc.book_id = b.book_id
    JOIN borrow_transactions bt ON bt.transaction_id = p_transaction_id
    JOIN readers r ON bt.reader_id = r.reader_id
    JOIN membership_tiers mt ON r.tier_id = mt.tier_id
    WHERE bc.copy_id = p_copy_id;
    
    -- Validate borrow days
    IF p_borrow_days > v_max_days THEN
        SET p_success = FALSE;
        SET p_message = CONCAT('Maximum borrow days for this tier is ', v_max_days);
        ROLLBACK;
    ELSEIF v_copy_status != 'available' THEN
        SET p_success = FALSE;
        SET p_message = 'Book copy is not available';
        ROLLBACK;
    ELSE
        -- Calculate subtotal
        SET v_subtotal = calculate_borrow_fee(p_daily_fee, p_borrow_days);
        
        -- Add to borrow details
        INSERT INTO borrow_details (
            transaction_id, copy_id, book_id, 
            borrow_days, daily_fee, subtotal
        ) VALUES (
            p_transaction_id, p_copy_id, v_book_id,
            p_borrow_days, p_daily_fee, v_subtotal
        );
        
        -- Update copy status
        UPDATE book_copies SET status = 'borrowed' WHERE copy_id = p_copy_id;
        
        SET p_success = TRUE;
        SET p_message = 'Book added to transaction';
        
        COMMIT;
    END IF;
    
    -- Return OUT params as result set
    SELECT p_success, p_message;
END //

-- Procedure: Finalize borrowing transaction
CREATE PROCEDURE sp_finalize_borrowing(
    IN p_transaction_id INT,
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(255)
)
BEGIN
    DECLARE v_total_books INT;
    DECLARE v_total_fee DECIMAL(10, 2);
    DECLARE v_reader_id INT;
    DECLARE v_due_date DATE;
    
    -- Start transaction
    START TRANSACTION;
    
    -- Calculate totals
    SELECT 
        COUNT(*), 
        SUM(subtotal),
        bt.reader_id
    INTO 
        v_total_books, 
        v_total_fee,
        v_reader_id
    FROM borrow_details bd
    JOIN borrow_transactions bt ON bd.transaction_id = bt.transaction_id
    WHERE bd.transaction_id = p_transaction_id
    GROUP BY bt.reader_id;
    
    -- Calculate due_date = MAX(borrow_date + borrow_days) of all books
    SELECT MAX(DATE_ADD(NOW(), INTERVAL bd.borrow_days DAY))
    INTO v_due_date
    FROM borrow_details bd
    WHERE bd.transaction_id = p_transaction_id;
    
    IF v_total_books IS NULL OR v_total_books = 0 THEN
        SET p_success = FALSE;
        SET p_message = 'No books in transaction';
        ROLLBACK;
    ELSE
        -- Update transaction with calculated due_date
        UPDATE borrow_transactions 
        SET total_books = v_total_books,
            borrow_fee = v_total_fee,
            expected_return_date = v_due_date,
            payment_status = 'paid',
            payment_date = NOW()
        WHERE transaction_id = p_transaction_id;
        
        SET p_success = TRUE;
        SET p_message = 'Transaction finalized successfully';
        
        COMMIT;
    END IF;
    
    -- Return OUT params as result set
    SELECT p_success, p_message;
END //

-- Procedure: Update transaction status based on individual book due dates
CREATE PROCEDURE sp_update_transaction_overdue_status(
    IN p_transaction_id INT
)
BEGIN
    DECLARE v_has_unreturned BOOLEAN DEFAULT FALSE;
    DECLARE v_has_overdue BOOLEAN DEFAULT FALSE;
    DECLARE v_all_returned BOOLEAN DEFAULT TRUE;
    DECLARE v_total_books INT DEFAULT 0;
    DECLARE v_returned_books INT DEFAULT 0;
    
    -- Count total and returned books in transaction
    SELECT 
        COUNT(*), 
        COUNT(CASE WHEN bc.status = 'available' THEN 1 END)
    INTO v_total_books, v_returned_books
    FROM borrow_details bd
    JOIN book_copies bc ON bd.copy_id = bc.copy_id
    WHERE bd.transaction_id = p_transaction_id;
    
    -- Check if there are any unreturned books
    SET v_has_unreturned = (v_total_books > v_returned_books);
    SET v_all_returned = (v_total_books = v_returned_books);
    
    -- Check if any unreturned book is overdue
    SELECT COUNT(*) > 0 INTO v_has_overdue
    FROM borrow_details bd
    JOIN borrow_transactions bt ON bd.transaction_id = bt.transaction_id
    JOIN book_copies bc ON bd.copy_id = bc.copy_id
    WHERE bd.transaction_id = p_transaction_id
    AND bc.status = 'borrowed'
    AND DATE_ADD(bt.borrow_date, INTERVAL bd.borrow_days DAY) < CURDATE();
    
    -- Update transaction status
    IF v_all_returned THEN
        -- All books returned - mark as completed
        UPDATE borrow_transactions 
        SET status = 'completed'
        WHERE transaction_id = p_transaction_id;
    ELSEIF v_has_overdue THEN
        -- Has overdue books
        UPDATE borrow_transactions 
        SET status = 'overdue'
        WHERE transaction_id = p_transaction_id 
        AND status != 'completed';
    ELSEIF v_has_unreturned THEN
        -- Has unreturned books but not overdue yet
        UPDATE borrow_transactions 
        SET status = 'active'
        WHERE transaction_id = p_transaction_id
        AND status NOT IN ('completed', 'overdue');
    END IF;
END //

-- Procedure: Process return with fine calculation (by barcode)
CREATE PROCEDURE sp_process_return_by_barcode(
    IN p_barcode VARCHAR(50),
    IN p_returned_by INT,
    IN p_condition_on_return VARCHAR(20),
    IN p_damage_type_id INT,
    IN p_damage_description TEXT,
    IN p_fine_payment_method_id INT,
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(255),
    OUT p_total_fine DECIMAL(10, 2),
    OUT p_book_title VARCHAR(255),
    OUT p_days_late INT,
    OUT p_late_fee DECIMAL(10, 2),
    OUT p_damage_fee DECIMAL(10, 2)
)
BEGIN
    DECLARE v_transaction_id INT;
    DECLARE v_detail_id INT;
    DECLARE v_copy_id INT;
    DECLARE v_book_id INT;
    DECLARE v_book_price DECIMAL(10, 2);
    DECLARE v_borrow_price DECIMAL(10, 2);
    DECLARE v_book_title VARCHAR(255);
    DECLARE v_expected_return_date DATE;
    DECLARE v_days_late INT;
    DECLARE v_late_fee DECIMAL(10, 2);
    DECLARE v_damage_fee DECIMAL(10, 2);
    DECLARE v_damage_percentage DECIMAL(5, 2);
    DECLARE v_fine_paid BOOLEAN;
    DECLARE v_setting_value VARCHAR(50);
    DECLARE v_late_penalty_percent DECIMAL(5, 2) DEFAULT 50.00;
    
    -- Start transaction
    START TRANSACTION;
    
    -- Get late penalty percentage from settings (default 50%)
    SELECT setting_value INTO v_setting_value
    FROM system_settings WHERE setting_key = 'late_penalty_percent';
    IF v_setting_value IS NOT NULL THEN
        SET v_late_penalty_percent = CAST(v_setting_value AS DECIMAL(5, 2));
    END IF;
    
    -- Find active borrow detail by barcode
    SELECT 
        bd.detail_id,
        bd.transaction_id,
        bd.copy_id,
        bd.book_id,
        b.title,
        b.price,
        b.borrow_price_per_day,
        bt.expected_return_date
    INTO 
        v_detail_id,
        v_transaction_id,
        v_copy_id,
        v_book_id,
        v_book_title,
        v_book_price,
        v_borrow_price,
        v_expected_return_date
    FROM borrow_details bd
    JOIN book_copies bc ON bd.copy_id = bc.copy_id
    JOIN books b ON bd.book_id = b.book_id
    JOIN borrow_transactions bt ON bd.transaction_id = bt.transaction_id
    WHERE bc.barcode = p_barcode
    AND bd.status = 'active'
    AND bt.payment_status = 'paid'
    AND NOT EXISTS (
        SELECT 1 FROM return_records rr 
        WHERE rr.detail_id = bd.detail_id
    )
    LIMIT 1;
    
    IF v_detail_id IS NULL THEN
        SET p_success = FALSE;
        SET p_message = 'Không tìm thấy sách đang mượn với mã barcode này';
        SET p_total_fine = 0;
        SET p_book_title = NULL;
        SET p_days_late = 0;
        SET p_late_fee = 0;
        SET p_damage_fee = 0;
        ROLLBACK;
    ELSE
        -- Calculate days late
        SET v_days_late = GREATEST(0, DATEDIFF(CURDATE(), v_expected_return_date));
        
        -- Calculate late fee (50% of borrow_price_per_day per day late)
        IF v_days_late > 0 THEN
            SET v_late_fee = (v_late_penalty_percent / 100) * v_borrow_price * v_days_late;
        ELSE
            SET v_late_fee = 0.00;
        END IF;
        
        -- Get damage percentage
        IF p_damage_type_id IS NOT NULL THEN
            SELECT fine_percentage INTO v_damage_percentage
            FROM damage_types WHERE damage_type_id = p_damage_type_id;
        ELSE
            SET v_damage_percentage = 0;
        END IF;
        
        -- Calculate damage fee (% of book price)
        SET v_damage_fee = (v_damage_percentage / 100) * v_book_price;
        
        -- Total fine
        SET p_total_fine = v_late_fee + v_damage_fee;
        
        -- If there's fine and payment method provided, mark as paid
        IF p_total_fine > 0 AND p_fine_payment_method_id IS NOT NULL THEN
            SET v_fine_paid = TRUE;
        ELSEIF p_total_fine > 0 THEN
            SET v_fine_paid = FALSE;
        ELSE
            SET v_fine_paid = TRUE;
        END IF;
        
        -- Create return record
        INSERT INTO return_records (
            transaction_id, detail_id, copy_id, returned_by,
            expected_return_date, days_late, late_fee,
            is_damaged, damage_type_id, damage_description, damage_fee,
            fine_amount, fine_paid, fine_payment_method_id, fine_payment_date,
            condition_on_return
        ) VALUES (
            v_transaction_id, v_detail_id, v_copy_id, p_returned_by,
            v_expected_return_date, v_days_late, v_late_fee,
            (p_damage_type_id IS NOT NULL), p_damage_type_id, p_damage_description, v_damage_fee,
            p_total_fine, v_fine_paid, p_fine_payment_method_id, 
            CASE WHEN v_fine_paid THEN NOW() ELSE NULL END,
            p_condition_on_return
        );
        
        -- Update borrow_details status
        UPDATE borrow_details 
        SET status = 'returned', 
            actual_return_date = NOW()
        WHERE detail_id = v_detail_id;
        
        -- Update copy status
        UPDATE book_copies 
        SET status = 'available',
            condition_status = p_condition_on_return
        WHERE copy_id = v_copy_id;
        
        -- Check if all books in transaction are returned
        IF NOT EXISTS (
            SELECT 1 FROM borrow_details bd
            WHERE bd.transaction_id = v_transaction_id
            AND bd.status = 'active'
        ) THEN
            -- All books returned, mark transaction as completed
            UPDATE borrow_transactions 
            SET status = 'completed',
                actual_return_date = NOW()
            WHERE transaction_id = v_transaction_id;
        END IF;
        
        SET p_success = TRUE;
        SET p_message = 'Trả sách thành công';
        SET p_book_title = v_book_title;
        SET p_days_late = v_days_late;
        SET p_late_fee = v_late_fee;
        SET p_damage_fee = v_damage_fee;
        
        COMMIT;
    END IF;
    
    SELECT p_success, p_message, p_total_fine, p_book_title, p_days_late, p_late_fee, p_damage_fee;
END //

-- Procedure: Process fine payment
CREATE PROCEDURE sp_process_fine_payment(
    IN p_return_id INT,
    IN p_payment_method_id INT,
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(255)
)
BEGIN
    -- Start transaction
    START TRANSACTION;
    
    UPDATE return_records 
    SET fine_paid = TRUE,
        fine_payment_method_id = p_payment_method_id,
        fine_payment_date = NOW()
    WHERE return_id = p_return_id AND fine_amount > 0;
    
    IF ROW_COUNT() = 0 THEN
        SET p_success = FALSE;
        SET p_message = 'Return record not found or no fine to pay';
        ROLLBACK;
    ELSE
        SET p_success = TRUE;
        SET p_message = 'Fine payment processed successfully';
        COMMIT;
    END IF;
    
    SELECT p_success, p_message;
END //

-- Procedure: Handle membership downgrade
CREATE PROCEDURE sp_handle_membership_downgrade(
    IN p_reader_id INT,
    IN p_changed_by INT,
    OUT p_downgraded BOOLEAN,
    OUT p_message VARCHAR(255)
)
BEGIN
    DECLARE v_current_tier_id INT;
    DECLARE v_current_tier_name VARCHAR(50);
    DECLARE v_new_tier_id INT;
    DECLARE v_new_tier_name VARCHAR(50);
    DECLARE v_late_count INT;
    DECLARE v_threshold INT DEFAULT 5;
    
    -- Get current info
    SELECT 
        r.tier_id,
        mt.tier_name,
        r.late_count,
        mt.late_threshold
    INTO 
        v_current_tier_id,
        v_current_tier_name,
        v_late_count,
        v_threshold
    FROM readers r
    JOIN membership_tiers mt ON r.tier_id = mt.tier_id
    WHERE r.reader_id = p_reader_id;
    
    -- Check if downgrade needed
    IF v_late_count < v_threshold THEN
        SET p_downgraded = FALSE;
        SET p_message = 'Not enough late returns for downgrade';
    ELSEIF v_current_tier_id = 1 THEN
        -- Already at lowest tier, blacklist instead
        UPDATE readers 
        SET is_blacklisted = TRUE, 
            blacklist_reason = 'Exceeded late return threshold at lowest tier',
            late_count = 0
        WHERE reader_id = p_reader_id;
        
        INSERT INTO blacklist_history (reader_id, action, reason, performed_by)
        VALUES (p_reader_id, 'add', 'Exceeded late return threshold at lowest tier', p_changed_by);
        
        SET p_downgraded = TRUE;
        SET p_message = 'Reader has been blacklisted due to excessive late returns';
    ELSE
        -- Get next lower tier
        SELECT tier_id, tier_name INTO v_new_tier_id, v_new_tier_name
        FROM membership_tiers
        WHERE tier_id < v_current_tier_id
        ORDER BY tier_id DESC
        LIMIT 1;
        
        -- Record history
        INSERT INTO membership_history (reader_id, old_tier_id, new_tier_id, change_reason, late_count_at_change, changed_by)
        VALUES (p_reader_id, v_current_tier_id, v_new_tier_id, CONCAT('Downgraded due to ', v_late_count, ' late returns'), v_late_count, p_changed_by);
        
        -- Update reader
        UPDATE readers 
        SET tier_id = v_new_tier_id, 
            late_count = 0
        WHERE reader_id = p_reader_id;
        
        SET p_downgraded = TRUE;
        SET p_message = CONCAT('Reader downgraded from ', v_current_tier_name, ' to ', v_new_tier_name);
    END IF;
END //

-- Procedure: Cancel borrowing transaction (rollback)
CREATE PROCEDURE sp_cancel_borrowing(
    IN p_transaction_id INT,
    IN p_cancelled_by INT,
    IN p_reason TEXT,
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(255)
)
BEGIN
    DECLARE v_payment_status VARCHAR(20);
    DECLARE v_reader_id INT;
    
    -- Start transaction
    START TRANSACTION;
    
    -- Get transaction info
    SELECT payment_status, reader_id INTO v_payment_status, v_reader_id
    FROM borrow_transactions WHERE transaction_id = p_transaction_id;
    
    IF v_payment_status IS NULL THEN
        SET p_success = FALSE;
        SET p_message = 'Transaction not found';
        ROLLBACK;
    ELSEIF v_payment_status = 'completed' OR v_payment_status = 'cancelled' THEN
        SET p_success = FALSE;
        SET p_message = 'Cannot cancel completed or already cancelled transaction';
        ROLLBACK;
    ELSE
        -- Restore all copies to available
        UPDATE book_copies bc
        JOIN borrow_details bd ON bc.copy_id = bd.copy_id
        SET bc.status = 'available'
        WHERE bd.transaction_id = p_transaction_id;
        
        -- Mark transaction as cancelled
        UPDATE borrow_transactions 
        SET status = 'cancelled',
            notes = CONCAT(COALESCE(notes, ''), ' | Cancelled by ', p_cancelled_by, ' at ', NOW(), '. Reason: ', p_reason)
        WHERE transaction_id = p_transaction_id;
        
        -- Log activity
        INSERT INTO activity_logs (user_id, action, entity_type, entity_id, new_values)
        VALUES (p_cancelled_by, 'CANCEL', 'borrow_transaction', p_transaction_id, 
                JSON_OBJECT('reason', p_reason, 'cancelled_at', NOW()));
        
        SET p_success = TRUE;
        SET p_message = 'Transaction cancelled successfully';
        
        COMMIT;
    END IF;
    
    SELECT p_success, p_message;
END //

-- Procedure: Search reader with borrow info
CREATE PROCEDURE sp_search_reader(
    IN p_search_term VARCHAR(255)
)
BEGIN
    SELECT 
        r.reader_id,
        r.card_number,
        r.full_name,
        r.phone,
        r.email,
        r.address,
        mt.tier_name,
        mt.badge_icon,
        mt.badge_color,
        mt.max_books,
        r.current_borrows,
        r.late_count,
        r.is_active,
        r.is_blacklisted,
        r.registered_at,
        (SELECT COUNT(*) FROM borrow_transactions bt WHERE bt.reader_id = r.reader_id AND bt.status = 'active') as active_transactions,
        (SELECT COUNT(*) FROM return_records rr 
         JOIN borrow_transactions bt ON rr.transaction_id = bt.transaction_id 
         WHERE bt.reader_id = r.reader_id AND rr.fine_paid = FALSE AND rr.fine_amount > 0) as unpaid_fines
    FROM readers r
    JOIN membership_tiers mt ON r.tier_id = mt.tier_id
    WHERE r.deleted_at IS NULL
    AND (r.card_number LIKE CONCAT('%', p_search_term, '%')
         OR r.full_name LIKE CONCAT('%', p_search_term, '%')
         OR r.phone LIKE CONCAT('%', p_search_term, '%')
         OR r.email LIKE CONCAT('%', p_search_term, '%'))
    ORDER BY r.full_name;
END //

-- Procedure: Get reader current borrows
CREATE PROCEDURE sp_get_reader_current_borrows(
    IN p_reader_id INT
)
BEGIN
    SELECT 
        bt.transaction_id,
        bt.transaction_code,
        bt.borrow_date,
        DATE_ADD(bt.borrow_date, INTERVAL bd.borrow_days DAY) as expected_return_date,
        bt.borrow_fee,
        DATEDIFF(DATE_ADD(bt.borrow_date, INTERVAL bd.borrow_days DAY), CURDATE()) as days_remaining,
        CASE 
            WHEN DATEDIFF(DATE_ADD(bt.borrow_date, INTERVAL bd.borrow_days DAY), CURDATE()) < 0 THEN 'overdue'
            WHEN DATEDIFF(DATE_ADD(bt.borrow_date, INTERVAL bd.borrow_days DAY), CURDATE()) <= 3 THEN 'due_soon'
            ELSE 'normal'
        END as urgency_status,
        bd.detail_id,
        bd.copy_id,
        bc.barcode,
        b.book_id,
        b.title,
        b.cover_image,
        b.price,
        bd.borrow_days,
        bd.daily_fee,
        bd.subtotal
    FROM borrow_transactions bt
    JOIN borrow_details bd ON bt.transaction_id = bd.transaction_id
    JOIN book_copies bc ON bd.copy_id = bc.copy_id
    JOIN books b ON bd.book_id = b.book_id
    WHERE bt.reader_id = p_reader_id
    AND bt.status = 'active'
    AND bc.status = 'borrowed'
    AND NOT EXISTS (
        SELECT 1 FROM return_records rr WHERE rr.detail_id = bd.detail_id
    )
    ORDER BY days_remaining ASC;
END //

DELIMITER ;

-- =====================================================
-- VIEWS FOR REPORTING
-- =====================================================

-- View: Revenue summary by day
CREATE VIEW vw_revenue_daily AS
SELECT 
    DATE(bt.payment_date) as revenue_date,
    COUNT(DISTINCT bt.transaction_id) as borrow_transactions,
    SUM(bt.borrow_fee) as borrow_revenue,
    (SELECT COALESCE(SUM(
        calculate_late_fee(b.price, GREATEST(0, DATEDIFF(rr.return_date, DATE_ADD(bt2.borrow_date, INTERVAL bd.borrow_days DAY)))) + COALESCE(rr.damage_fee, 0)
    ), 0)
     FROM return_records rr
     JOIN borrow_details bd ON rr.detail_id = bd.detail_id
     JOIN books b ON bd.book_id = b.book_id
     JOIN borrow_transactions bt2 ON bd.transaction_id = bt2.transaction_id
     WHERE DATE(rr.fine_payment_date) = DATE(bt.payment_date) AND rr.fine_paid = TRUE) as fine_revenue,
    SUM(bt.borrow_fee) + (SELECT COALESCE(SUM(
        calculate_late_fee(b.price, GREATEST(0, DATEDIFF(rr.return_date, DATE_ADD(bt2.borrow_date, INTERVAL bd.borrow_days DAY)))) + COALESCE(rr.damage_fee, 0)
    ), 0)
                           FROM return_records rr
                           JOIN borrow_details bd ON rr.detail_id = bd.detail_id
                           JOIN books b ON bd.book_id = b.book_id
                           JOIN borrow_transactions bt2 ON bd.transaction_id = bt2.transaction_id
                           WHERE DATE(rr.fine_payment_date) = DATE(bt.payment_date) AND rr.fine_paid = TRUE) as total_revenue,
    SUM(CASE WHEN bt.payment_method_id = 1 THEN bt.borrow_fee ELSE 0 END) as cash_revenue,
    SUM(CASE WHEN bt.payment_method_id != 1 THEN bt.borrow_fee ELSE 0 END) as banking_revenue
FROM borrow_transactions bt
WHERE bt.payment_status = 'paid'
GROUP BY DATE(bt.payment_date)
ORDER BY DATE(bt.payment_date) DESC;

-- View: Revenue summary by week
CREATE VIEW vw_revenue_weekly AS
SELECT 
    CONCAT(YEAR(bt.payment_date), '-W', WEEK(bt.payment_date)) as week_key,
    YEAR(bt.payment_date) as year,
    WEEK(bt.payment_date) as week_number,
    STR_TO_DATE(CONCAT(YEAR(bt.payment_date), '-', WEEK(bt.payment_date), ' Monday'), '%X-%V %W') as week_start,
    COUNT(DISTINCT bt.transaction_id) as borrow_transactions,
    SUM(bt.borrow_fee) as borrow_revenue,
    (SELECT COALESCE(SUM(
        calculate_late_fee(b.price, GREATEST(0, DATEDIFF(rr.return_date, DATE_ADD(bt2.borrow_date, INTERVAL bd.borrow_days DAY)))) + COALESCE(rr.damage_fee, 0)
    ), 0)
     FROM return_records rr
     JOIN borrow_details bd ON rr.detail_id = bd.detail_id
     JOIN books b ON bd.book_id = b.book_id
     JOIN borrow_transactions bt2 ON bd.transaction_id = bt2.transaction_id
     WHERE YEAR(rr.fine_payment_date) = YEAR(bt.payment_date)
     AND WEEK(rr.fine_payment_date) = WEEK(bt.payment_date)
     AND rr.fine_paid = TRUE) as fine_revenue,
    SUM(bt.borrow_fee) + (SELECT COALESCE(SUM(
        calculate_late_fee(b.price, GREATEST(0, DATEDIFF(rr.return_date, DATE_ADD(bt2.borrow_date, INTERVAL bd.borrow_days DAY)))) + COALESCE(rr.damage_fee, 0)
    ), 0)
                           FROM return_records rr
                           JOIN borrow_details bd ON rr.detail_id = bd.detail_id
                           JOIN books b ON bd.book_id = b.book_id
                           JOIN borrow_transactions bt2 ON bd.transaction_id = bt2.transaction_id
                           WHERE YEAR(rr.fine_payment_date) = YEAR(bt.payment_date)
                           AND WEEK(rr.fine_payment_date) = WEEK(bt.payment_date)
                           AND rr.fine_paid = TRUE) as total_revenue
FROM borrow_transactions bt
WHERE bt.payment_status = 'paid'
GROUP BY YEAR(bt.payment_date), WEEK(bt.payment_date)
ORDER BY YEAR(bt.payment_date) DESC, WEEK(bt.payment_date) DESC;

-- View: Revenue summary by month
CREATE VIEW vw_revenue_monthly AS
SELECT 
    DATE_FORMAT(bt.payment_date, '%Y-%m') as month_key,
    YEAR(bt.payment_date) as year,
    MONTH(bt.payment_date) as month,
    DATE_FORMAT(bt.payment_date, '%M %Y') as month_name,
    COUNT(DISTINCT bt.transaction_id) as borrow_transactions,
    SUM(bt.borrow_fee) as borrow_revenue,
    (SELECT COALESCE(SUM(
        calculate_late_fee(b.price, GREATEST(0, DATEDIFF(rr.return_date, DATE_ADD(bt2.borrow_date, INTERVAL bd.borrow_days DAY)))) + COALESCE(rr.damage_fee, 0)
    ), 0)
     FROM return_records rr
     JOIN borrow_details bd ON rr.detail_id = bd.detail_id
     JOIN books b ON bd.book_id = b.book_id
     JOIN borrow_transactions bt2 ON bd.transaction_id = bt2.transaction_id
     WHERE DATE_FORMAT(rr.fine_payment_date, '%Y-%m') = DATE_FORMAT(bt.payment_date, '%Y-%m')
     AND rr.fine_paid = TRUE) as fine_revenue,
    SUM(bt.borrow_fee) + (SELECT COALESCE(SUM(
        calculate_late_fee(b.price, GREATEST(0, DATEDIFF(rr.return_date, DATE_ADD(bt2.borrow_date, INTERVAL bd.borrow_days DAY)))) + COALESCE(rr.damage_fee, 0)
    ), 0)
                           FROM return_records rr
                           JOIN borrow_details bd ON rr.detail_id = bd.detail_id
                           JOIN books b ON bd.book_id = b.book_id
                           JOIN borrow_transactions bt2 ON bd.transaction_id = bt2.transaction_id
                           WHERE DATE_FORMAT(rr.fine_payment_date, '%Y-%m') = DATE_FORMAT(bt.payment_date, '%Y-%m')
                           AND rr.fine_paid = TRUE) as total_revenue
FROM borrow_transactions bt
WHERE bt.payment_status = 'paid'
GROUP BY DATE_FORMAT(bt.payment_date, '%Y-%m'), YEAR(bt.payment_date), MONTH(bt.payment_date)
ORDER BY year DESC, month DESC;

-- View: Revenue summary by day (last 7 days)
CREATE VIEW vw_revenue_daily AS
SELECT 
    DATE(bt.payment_date) as revenue_date,
    DATE_FORMAT(bt.payment_date, '%d/%m') as date_formatted,
    DAYNAME(bt.payment_date) as day_name,
    COUNT(DISTINCT bt.transaction_id) as borrow_transactions,
    SUM(bt.borrow_fee) as borrow_revenue,
    (SELECT COALESCE(SUM(rr.fine_amount), 0) 
     FROM return_records rr 
     WHERE DATE(rr.fine_payment_date) = DATE(bt.payment_date)
     AND rr.fine_paid = TRUE) as fine_revenue,
    SUM(bt.borrow_fee) + (SELECT COALESCE(SUM(rr.fine_amount), 0) 
                           FROM return_records rr 
                           WHERE DATE(rr.fine_payment_date) = DATE(bt.payment_date)
                           AND rr.fine_paid = TRUE) as total_revenue
FROM borrow_transactions bt
WHERE bt.payment_status = 'paid'
  AND bt.payment_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
GROUP BY DATE(bt.payment_date), DATE_FORMAT(bt.payment_date, '%d/%m'), DAYNAME(bt.payment_date)
ORDER BY revenue_date DESC;

-- View: Revenue summary by week (last 4 weeks)
DROP VIEW IF EXISTS vw_revenue_weekly;
CREATE VIEW vw_revenue_weekly AS
SELECT 
    CONCAT('Tuần ', WEEK(bt.payment_date, 1) - WEEK(DATE_FORMAT(bt.payment_date, '%Y-%m-01'), 1) + 1) as week_label,
    CONCAT('Tuần ', WEEK(bt.payment_date, 1) - WEEK(DATE_FORMAT(bt.payment_date, '%Y-%m-01'), 1) + 1, ' (', DATE_FORMAT(bt.payment_date, '%m/%Y'), ')') as week_formatted,
    STR_TO_DATE(CONCAT(YEAR(bt.payment_date), '-', WEEK(bt.payment_date, 1), ' Sunday'), '%X-%V %W') as week_date,
    COUNT(DISTINCT bt.transaction_id) as borrow_transactions,
    SUM(bt.borrow_fee) as borrow_revenue,
    (SELECT COALESCE(SUM(rr.fine_amount), 0) 
     FROM return_records rr 
     WHERE YEARWEEK(rr.fine_payment_date, 1) = YEARWEEK(bt.payment_date, 1)
     AND rr.fine_paid = TRUE) as fine_revenue,
    SUM(bt.borrow_fee) + (SELECT COALESCE(SUM(rr.fine_amount), 0) 
                           FROM return_records rr 
                           WHERE YEARWEEK(rr.fine_payment_date, 1) = YEARWEEK(bt.payment_date, 1)
                           AND rr.fine_paid = TRUE) as total_revenue
FROM borrow_transactions bt
WHERE bt.payment_status = 'paid'
  AND bt.payment_date >= DATE_SUB(CURDATE(), INTERVAL 4 WEEK)
GROUP BY YEARWEEK(bt.payment_date, 1), week_label, week_formatted, week_date;

-- View: Top borrowed books
CREATE VIEW vw_top_books AS
SELECT 
    b.book_id,
    b.book_code,
    b.isbn,
    b.title,
    b.cover_image,
    b.price,
    b.borrow_price_per_day,
    c.category_name,
    p.publisher_name,
    COUNT(DISTINCT bd.detail_id) as total_borrows,
    COUNT(DISTINCT bt.reader_id) as unique_readers,
    SUM(bd.subtotal) as total_revenue,
    AVG(DATEDIFF(rr.return_date, bt.borrow_date)) as avg_borrow_duration,
    SUM(CASE WHEN rr.days_late > 0 THEN 1 ELSE 0 END) as late_returns,
    b.total_copies,
    b.available_copies,
    (b.total_copies - b.available_copies) as currently_borrowed
FROM books b
LEFT JOIN borrow_details bd ON b.book_id = bd.book_id
LEFT JOIN borrow_transactions bt ON bd.transaction_id = bt.transaction_id
LEFT JOIN return_records rr ON bd.detail_id = rr.detail_id
LEFT JOIN categories c ON b.category_id = c.category_id
LEFT JOIN publishers p ON b.publisher_id = p.publisher_id
WHERE b.deleted_at IS NULL
GROUP BY b.book_id, b.book_code, b.isbn, b.title, b.cover_image, b.price, 
         b.borrow_price_per_day, c.category_name, p.publisher_name, b.total_copies, b.available_copies
ORDER BY total_borrows DESC;

-- View: Top readers
CREATE VIEW vw_top_readers AS
SELECT 
    r.reader_id,
    r.card_number,
    r.full_name,
    r.phone,
    r.email,
    mt.tier_name,
    mt.badge_icon,
    r.registered_at,
    COUNT(DISTINCT bt.transaction_id) as total_borrows,
    COUNT(DISTINCT bd.book_id) as unique_books_borrowed,
    SUM(bt.borrow_fee) as total_borrow_fees,
    SUM(CASE WHEN rr.days_late > 0 THEN 1 ELSE 0 END) as late_returns,
    SUM(rr.fine_amount) as total_fines,
    SUM(CASE WHEN rr.fine_paid = TRUE THEN rr.fine_amount ELSE 0 END) as fines_paid,
    r.current_borrows,
    DATEDIFF(CURDATE(), r.registered_at) as membership_days,
    ROUND(COUNT(DISTINCT bt.transaction_id) / (DATEDIFF(CURDATE(), r.registered_at) / 30), 2) as avg_borrows_per_month
FROM readers r
JOIN membership_tiers mt ON r.tier_id = mt.tier_id
LEFT JOIN borrow_transactions bt ON r.reader_id = bt.reader_id AND bt.status != 'cancelled'
LEFT JOIN borrow_details bd ON bt.transaction_id = bd.transaction_id
LEFT JOIN return_records rr ON bd.detail_id = rr.detail_id
WHERE r.deleted_at IS NULL
GROUP BY r.reader_id, r.card_number, r.full_name, r.phone, r.email, 
         mt.tier_name, mt.badge_icon, r.registered_at, r.current_borrows
ORDER BY total_borrows DESC;

-- View: Books due soon (for librarian alerts)
CREATE VIEW vw_books_due_soon AS
SELECT 
    bt.transaction_id,
    bt.transaction_code,
    r.reader_id,
    r.card_number,
    r.full_name as reader_name,
    r.phone as reader_phone,
    bd.detail_id,
    b.book_id,
    b.title as book_title,
    bc.barcode,
    bt.borrow_date,
    bt.expected_return_date,
    DATEDIFF(bt.expected_return_date, CURDATE()) as days_remaining,
    CASE 
        WHEN DATEDIFF(bt.expected_return_date, CURDATE()) < 0 THEN 'overdue'
        WHEN DATEDIFF(bt.expected_return_date, CURDATE()) <= 3 THEN 'due_soon'
        ELSE 'normal'
    END as urgency_status,
    dr.is_sent as reminder_sent,
    dr.sent_at as reminder_sent_at
FROM borrow_transactions bt
JOIN readers r ON bt.reader_id = r.reader_id
JOIN borrow_details bd ON bt.transaction_id = bd.transaction_id
JOIN books b ON bd.book_id = b.book_id
JOIN book_copies bc ON bd.copy_id = bc.copy_id
LEFT JOIN due_reminders dr ON bt.transaction_id = dr.transaction_id 
    AND dr.days_remaining = LEAST(3, DATEDIFF(bt.expected_return_date, CURDATE()))
WHERE bt.status = 'active'
AND NOT EXISTS (SELECT 1 FROM return_records rr WHERE rr.detail_id = bd.detail_id)
AND DATEDIFF(bt.expected_return_date, CURDATE()) <= 3
ORDER BY days_remaining ASC;

-- View: Overdue books
CREATE VIEW vw_overdue_books AS
SELECT 
    bt.transaction_id,
    bt.transaction_code,
    r.reader_id,
    r.card_number,
    r.full_name as reader_name,
    r.phone as reader_phone,
    r.email as reader_email,
    mt.tier_name,
    bd.detail_id,
    b.book_id,
    b.title as book_title,
    b.price as book_price,
    bc.barcode,
    bt.borrow_date,
    bt.expected_return_date,
    DATEDIFF(CURDATE(), bt.expected_return_date) as days_overdue,
    calculate_late_fee(b.price, DATEDIFF(CURDATE(), bt.expected_return_date), 50.00) as estimated_fine
FROM borrow_transactions bt
JOIN readers r ON bt.reader_id = r.reader_id
JOIN membership_tiers mt ON r.tier_id = mt.tier_id
JOIN borrow_details bd ON bt.transaction_id = bd.transaction_id
JOIN books b ON bd.book_id = b.book_id
JOIN book_copies bc ON bd.copy_id = bc.copy_id
WHERE bt.status = 'active'
AND bt.expected_return_date < CURDATE()
AND NOT EXISTS (SELECT 1 FROM return_records rr WHERE rr.detail_id = bd.detail_id)
ORDER BY days_overdue DESC;

-- View: Inventory status
CREATE VIEW vw_inventory_status AS
SELECT 
    b.book_id,
    b.book_code,
    b.isbn,
    b.title,
    b.price,
    c.category_name,
    p.publisher_name,
    b.total_copies,
    b.available_copies,
    (b.total_copies - b.available_copies) as borrowed_copies,
    ROUND((b.available_copies / b.total_copies) * 100, 2) as availability_percentage,
    (SELECT COUNT(*) FROM book_copies bc WHERE bc.book_id = b.book_id AND bc.status = 'maintenance') as maintenance_copies,
    (SELECT COUNT(*) FROM book_copies bc WHERE bc.book_id = b.book_id AND bc.status = 'lost') as lost_copies,
    b.is_active,
    b.created_at
FROM books b
LEFT JOIN categories c ON b.category_id = c.category_id
LEFT JOIN publishers p ON b.publisher_id = p.publisher_id
WHERE b.deleted_at IS NULL;

-- View: Daily statistics for dashboard
CREATE VIEW vw_daily_statistics AS
SELECT 
    CURDATE() as stat_date,
    (SELECT COUNT(*) FROM readers WHERE deleted_at IS NULL AND is_active = TRUE) as total_active_readers,
    (SELECT COUNT(*) FROM readers WHERE DATE(registered_at) = CURDATE()) as new_readers_today,
    (SELECT COUNT(*) FROM books WHERE deleted_at IS NULL AND is_active = TRUE) as total_active_books,
    (SELECT SUM(available_copies) FROM books WHERE deleted_at IS NULL) as total_available_copies,
    (SELECT COUNT(*) FROM borrow_transactions WHERE DATE(borrow_date) = CURDATE() AND status != 'cancelled') as borrows_today,
    (SELECT COUNT(*) FROM return_records WHERE DATE(return_date) = CURDATE()) as returns_today,
    (SELECT COALESCE(SUM(borrow_fee), 0) FROM borrow_transactions WHERE DATE(payment_date) = CURDATE() AND payment_status = 'paid') as revenue_borrow_today,
    (SELECT COALESCE(SUM(fine_amount), 0) FROM return_records WHERE DATE(fine_payment_date) = CURDATE() AND fine_paid = TRUE) as revenue_fine_today,
    (SELECT COUNT(*) FROM vw_books_due_soon WHERE urgency_status = 'due_soon') as books_due_soon,
    (SELECT COUNT(*) FROM vw_overdue_books) as overdue_books_count;

-- View: Book-level alerts for individual book tracking
CREATE VIEW vw_book_alerts AS
SELECT 
    bd.detail_id,
    bt.transaction_id,
    bt.transaction_code,
    bt.reader_id,
    r.card_number,
    r.full_name as reader_name,
    r.phone as reader_phone,
    r.email as reader_email,
    b.book_id,
    b.title as book_title,
    b.price as book_price,
    bc.barcode,
    bd.borrow_days,
    bt.borrow_date,
    DATE_ADD(bt.borrow_date, INTERVAL bd.borrow_days DAY) as book_due_date,
    bt.expected_return_date as transaction_due_date,
    DATEDIFF(DATE_ADD(bt.borrow_date, INTERVAL bd.borrow_days DAY), CURDATE()) as days_remaining,
    CASE 
        WHEN DATEDIFF(DATE_ADD(bt.borrow_date, INTERVAL bd.borrow_days DAY), CURDATE()) < 0 THEN 'overdue'
        WHEN DATEDIFF(DATE_ADD(bt.borrow_date, INTERVAL bd.borrow_days DAY), CURDATE()) <= 2 THEN 'urgent'
        WHEN DATEDIFF(DATE_ADD(bt.borrow_date, INTERVAL bd.borrow_days DAY), CURDATE()) <= 5 THEN 'warning'
        ELSE 'normal'
    END as alert_level,
    CASE 
        WHEN DATEDIFF(DATE_ADD(bt.borrow_date, INTERVAL bd.borrow_days DAY), CURDATE()) < 0 
            THEN calculate_late_fee(b.price, ABS(DATEDIFF(DATE_ADD(bt.borrow_date, INTERVAL bd.borrow_days DAY), CURDATE())), 50.00)
        ELSE 0
    END as estimated_fine,
    NOT EXISTS (SELECT 1 FROM return_records rr WHERE rr.detail_id = bd.detail_id) as is_unreturned
FROM borrow_details bd
JOIN borrow_transactions bt ON bd.transaction_id = bt.transaction_id
JOIN readers r ON bt.reader_id = r.reader_id
JOIN book_copies bc ON bd.copy_id = bc.copy_id
JOIN books b ON bc.book_id = b.book_id
WHERE bt.status IN ('active', 'overdue')
AND bc.status = 'borrowed'
ORDER BY 
    CASE alert_level
        WHEN 'overdue' THEN 1
        WHEN 'urgent' THEN 2
        WHEN 'warning' THEN 3
        ELSE 4
    END,
    days_remaining ASC;

-- =====================================================
-- EVENTS (Task Scheduling)
-- =====================================================

DELIMITER //

-- Procedure: Process all membership downgrades (called by event)
CREATE PROCEDURE sp_process_all_downgrades()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_reader_id INT;
    DECLARE v_downgraded BOOLEAN;
    DECLARE v_message VARCHAR(255);
    
    DECLARE reader_cursor CURSOR FOR
        SELECT reader_id FROM readers 
        WHERE late_count >= 5 AND is_blacklisted = FALSE AND is_active = TRUE;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN reader_cursor;
    
    read_loop: LOOP
        FETCH reader_cursor INTO v_reader_id;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        CALL sp_handle_membership_downgrade(v_reader_id, 1, v_downgraded, v_message);
    END LOOP;
    
    CLOSE reader_cursor;
END //

-- Event: Daily due date check and notification creation
CREATE EVENT evt_daily_due_check
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    -- Create notifications for books due in 3 days
    INSERT INTO notifications (reader_id, notification_type, title, message, related_transaction_id)
    SELECT 
        bt.reader_id,
        'due_reminder',
        'Nhắc nhở: Sách sắp đến hạn trả',
        CONCAT('Bạn có sách cần trả trong ', DATEDIFF(bt.expected_return_date, CURDATE()), ' ngày nữa. Mã phiếu: ', bt.transaction_code),
        bt.transaction_id
    FROM borrow_transactions bt
    WHERE bt.status = 'active'
    AND bt.expected_return_date = DATE_ADD(CURDATE(), INTERVAL 3 DAY)
    AND NOT EXISTS (
        SELECT 1 FROM notifications n 
        WHERE n.related_transaction_id = bt.transaction_id 
        AND n.notification_type = 'due_reminder'
        AND DATE(n.sent_at) = CURDATE()
    );
    
    -- Update due reminders as sent
    UPDATE due_reminders 
    SET is_sent = TRUE, sent_at = NOW()
    WHERE reminder_date = CURDATE() AND is_sent = FALSE;
    
    -- Process membership downgrades via procedure
    CALL sp_process_all_downgrades();
END //

-- Event: Weekly statistics update
CREATE EVENT evt_weekly_stats
ON SCHEDULE EVERY 1 WEEK
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    -- Archive old notifications (older than 90 days)
    DELETE FROM notifications WHERE sent_at < DATE_SUB(CURDATE(), INTERVAL 90 DAY);
    
    -- Clean up old activity logs (older than 1 year)
    DELETE FROM activity_logs WHERE performed_at < DATE_SUB(CURDATE(), INTERVAL 1 YEAR);
END //

DELIMITER ;

-- Enable event scheduler
SET GLOBAL event_scheduler = ON;

-- =====================================================
-- SEED DATA FOR TESTING
-- =====================================================

-- Insert sample categories
INSERT INTO categories (category_code, category_name, description) VALUES
('FIC', 'Tiểu thuyết', 'Sách tiểu thuyết các thể loại'),
('SCI', 'Khoa học', 'Sách khoa học tự nhiên và xã hội'),
('HIS', 'Lịch sử', 'Sách lịch sử thế giới và Việt Nam'),
('TEC', 'Công nghệ', 'Sách công nghệ thông tin và kỹ thuật'),
('BUS', 'Kinh doanh', 'Sách kinh doanh và quản trị'),
('ART', 'Nghệ thuật', 'Sách nghệ thuật và âm nhạc'),
('CHI', 'Thiếu nhi', 'Sách dành cho trẻ em');

-- Insert sample publishers
INSERT INTO publishers (publisher_code, publisher_name, address, phone, email) VALUES
('NXBT', 'Nhà xuất bản Trẻ', '161B Lý Chính Thắng, Q.3, TP.HCM', '0281234567', 'contact@nxbtre.com.vn'),
('NXBGD', 'Nhà xuất bản Giáo dục', '81 Trần Hưng Đạo, Hà Nội', '0241234567', 'info@nxbgd.vn'),
('NXBKD', 'Nhà xuất bản Kim Đồng', '55 Quang Trung, Hà Nội', '0248765432', 'kimdong@nxb.vn'),
('FPTU', 'FPT University Press', 'Hòa Lạc, Hà Nội', '0241112223', 'press@fpt.edu.vn');

-- Insert sample authors
INSERT INTO authors (author_code, full_name, biography, nationality) VALUES
('NGUYENN', 'Nguyễn Nhật Ánh', 'Nhà văn nổi tiếng viết cho tuổi thơ và tuổi mới lớn', 'Vietnamese'),
('TUEST', 'Tô Hoài', 'Nhà văn với tác phẩm Dế Mèn phiêu lưu ký', 'Vietnamese'),
('ROWLJK', 'J.K. Rowling', 'Tác giả của series Harry Potter', 'British'),
('ASIMOV', 'Isaac Asimov', 'Nhà văn khoa học viễn tưởng nổi tiếng', 'American'),
('NGUYENV', 'Nguyễn Du', 'Đại thi hào với Truyện Kiều', 'Vietnamese'),
('KAFKA', 'Franz Kafka', 'Nhà văn hiện đại người Séc', 'Czech');

-- Insert sample shelf locations
INSERT INTO shelf_locations (location_code, floor, section, shelf_number, description) VALUES
('A-01-01', '1', 'Khu A', '01', 'Tầng 1, Khu A, Kệ 01'),
('A-01-02', '1', 'Khu A', '02', 'Tầng 1, Khu A, Kệ 02'),
('A-02-01', '1', 'Khu A', '03', 'Tầng 1, Khu A, Kệ 03'),
('B-01-01', '2', 'Khu B', '01', 'Tầng 2, Khu B, Kệ 01'),
('B-01-02', '2', 'Khu B', '02', 'Tầng 2, Khu B, Kệ 02'),
('C-01-01', '3', 'Khu C', '01', 'Tầng 3, Khu C, Kệ 01');

-- Insert sample books
INSERT INTO books (isbn, book_code, title, subtitle, publisher_id, category_id, publish_year, page_count, summary, price, borrow_price_per_day, is_active) VALUES
('9786041012345', 'BK001', 'Cho tôi xin một vé đi tuổi thơ', NULL, 1, 7, 2008, 200, 'Một hành trình trở về tuổi thơ đầy cảm xúc', 85000.00, 3000.00, TRUE),
('9786041023456', 'BK002', 'Dế Mèn phiêu lưu ký', NULL, 2, 7, 1941, 150, 'Cuộc phiêu lưu của chú dế mèn', 75000.00, 2500.00, TRUE),
('9780747532699', 'BK003', 'Harry Potter và Hòn đá phù thủy', 'Harry Potter and the Philosopher\'s Stone', 3, 1, 1997, 320, 'Cuộc phiêu lưu phép thuật đầu tiên của Harry Potter', 120000.00, 4000.00, TRUE),
('9780553294385', 'BK004', 'Foundation', NULL, 4, 3, 1951, 255, 'Tiểu thuyết khoa học viễn tưởng kinh điển', 135000.00, 4500.00, TRUE),
('9786042012345', 'BK005', 'Truyện Kiều', NULL, 2, 6, 1820, 300, 'Kiệt tác văn học Việt Nam', 95000.00, 3000.00, TRUE);

-- Link authors to books
INSERT INTO book_authors (book_id, author_id, author_order) VALUES
(1, 1, 1),
(2, 2, 1),
(3, 3, 1),
(4, 4, 1),
(5, 5, 1);

-- Insert sample book copies (triggers will update book totals)
INSERT INTO book_copies (book_id, barcode, shelf_location_id, acquisition_date, condition_status, status) VALUES
(1, generate_book_barcode(1, 1), 1, '2023-01-15', 'good', 'available'),
(1, generate_book_barcode(1, 2), 1, '2023-02-20', 'good', 'available'),
(2, generate_book_barcode(2, 1), 2, '2023-01-10', 'fair', 'available'),
(2, generate_book_barcode(2, 2), 2, '2023-03-05', 'good', 'available'),
(3, generate_book_barcode(3, 1), 3, '2023-04-12', 'new', 'available'),
(3, generate_book_barcode(3, 2), 3, '2023-05-18', 'good', 'available'),
(3, generate_book_barcode(3, 3), 4, '2023-06-22', 'good', 'available'),
(4, generate_book_barcode(4, 1), 4, '2023-02-28', 'good', 'available'),
(5, generate_book_barcode(5, 1), 5, '2023-03-15', 'fair', 'available'),
(5, generate_book_barcode(5, 2), 5, '2023-07-20', 'good', 'available');

-- Insert sample readers
INSERT INTO readers (card_number, full_name, date_of_birth, gender, phone, email, address, tier_id, created_by) VALUES
(generate_card_number(), 'Nguyễn Văn A', '1995-05-15', 'male', '0901234567', 'nguyenvana@email.com', '123 Lê Lợi, Q.1, TP.HCM', 1, 1),
(generate_card_number(), 'Trần Thị B', '1990-08-20', 'female', '0912345678', 'tranthib@email.com', '456 Nguyễn Huệ, Q.1, TP.HCM', 2, 1),
(generate_card_number(), 'Lê Văn C', '1988-12-10', 'male', '0923456789', 'levanc@email.com', '789 Đồng Khởi, Q.1, TP.HCM', 3, 1);

-- =====================================================
-- Stored Procedure: Process Book Return
-- =====================================================

DELIMITER //

CREATE PROCEDURE IF NOT EXISTS sp_process_return(
    IN p_detail_id INT,
    IN p_condition_on_return VARCHAR(20),
    IN p_damage_type_id INT,
    IN p_damage_description TEXT,
    IN p_fine_payment_method_id INT,
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(255),
    OUT p_book_title VARCHAR(255),
    OUT p_days_late INT,
    OUT p_late_fee DECIMAL(10,2),
    OUT p_damage_fee DECIMAL(10,2),
    OUT p_total_fine DECIMAL(10,2),
    OUT p_return_id INT
)
BEGIN
    DECLARE v_due_date DATE;
    DECLARE v_actual_return_date DATE DEFAULT CURDATE();
    DECLARE v_book_price DECIMAL(10,2);
    DECLARE v_daily_late_fee DECIMAL(10,2) DEFAULT 5000; -- 5000 VND per day
    DECLARE v_detail_status VARCHAR(20);
    DECLARE v_book_id INT;
    DECLARE v_copy_id INT;
    DECLARE v_transaction_id INT;
    
    SET p_success = FALSE;
    SET p_message = '';
    SET p_late_fee = 0;
    SET p_damage_fee = 0;
    SET p_total_fine = 0;
    
    -- Get borrow detail info (calculate due_date from borrow_date + borrow_days)
    SELECT DATE_ADD(bt.borrow_date, INTERVAL bd.borrow_days DAY), bd.status, b.title, b.price, bd.book_id, bc.copy_id, bd.transaction_id
    INTO v_due_date, v_detail_status, p_book_title, v_book_price, v_book_id, v_copy_id, v_transaction_id
    FROM borrow_details bd
    JOIN books b ON bd.book_id = b.book_id
    JOIN book_copies bc ON bd.copy_id = bc.copy_id
    JOIN borrow_transactions bt ON bd.transaction_id = bt.transaction_id
    WHERE bd.detail_id = p_detail_id;
    
    -- Check if detail exists and copy is valid
    IF v_due_date IS NULL THEN
        SET p_message = 'Không tìm thấy thông tin mượn sách';
        SELECT p_success, p_message, p_book_title, p_days_late, p_late_fee, p_damage_fee, p_total_fine, p_return_id, p_copy_id;
    END IF;
    
    IF v_copy_id IS NULL THEN
        SET p_message = 'Không tìm thấy thông tin bản sao sách (có thể đã bị xóa)';
        SELECT p_success, p_message, p_book_title, p_days_late, p_late_fee, p_damage_fee, p_total_fine, p_return_id;
    END IF;
    
    -- Verify copy still exists in book_copies (for FK constraint)
    IF NOT EXISTS (SELECT 1 FROM book_copies WHERE copy_id = v_copy_id) THEN
        SET p_message = 'Bản sao sách không tồn tại trong hệ thống (có thể đã bị xóa)';
        SELECT p_success, p_message, p_book_title, p_days_late, p_late_fee, p_damage_fee, p_total_fine, p_return_id;
    END IF;
    
    -- Check if already returned
    IF v_detail_status = 'returned' THEN
        SET p_message = 'Sách đã được trả trước đó';
        SELECT p_success, p_message, p_book_title, p_days_late, p_late_fee, p_damage_fee, p_total_fine, p_return_id;
    END IF;
    
    -- Calculate days late
    IF v_actual_return_date > v_due_date THEN
        SET p_days_late = DATEDIFF(v_actual_return_date, v_due_date);
    ELSE
        SET p_days_late = 0;
    END IF;
    
    -- Calculate late fee using calculate_late_fee function (gets % from settings)
    IF p_condition_on_return != 'lost' AND p_days_late > 0 THEN
        SET p_late_fee = calculate_late_fee(v_book_price, p_days_late);
    END IF;
    
    -- Calculate damage/lost fee
    CASE p_condition_on_return
        WHEN 'fair' THEN SET p_damage_fee = v_book_price * 0.3;  -- 30% for minor damage
        WHEN 'poor' THEN SET p_damage_fee = v_book_price * 0.7;  -- 70% for major damage
        WHEN 'lost' THEN SET p_damage_fee = v_book_price;      -- 100% for lost
        ELSE SET p_damage_fee = 0;
    END CASE;
    
    -- Total fine
    SET p_total_fine = p_late_fee + p_damage_fee;
    
    -- Create return record
    INSERT INTO return_records (detail_id, return_date, condition_on_return, 
                                days_late, late_fee, damage_fee, fine_amount, fine_paid)
    VALUES (p_detail_id, CURDATE(), p_condition_on_return,
            p_days_late, p_late_fee, p_damage_fee, p_total_fine, 
            CASE WHEN p_total_fine > 0 THEN TRUE ELSE FALSE END);
    
    SET p_return_id = LAST_INSERT_ID();
    
    -- Update borrow detail status
    UPDATE borrow_details 
    SET status = 'returned', actual_return_date = v_actual_return_date
    WHERE detail_id = p_detail_id;
    
    -- Update book copy status (if not lost - lost will be deleted separately)
    IF p_condition_on_return != 'lost' THEN
        UPDATE book_copies 
        SET status = 'available', condition_status = p_condition_on_return
        WHERE copy_id = v_copy_id;
    END IF;
    
    -- Check if all books in this transaction are returned, if yes mark as completed
    IF NOT EXISTS (
        SELECT 1 FROM borrow_details bd2
        WHERE bd2.transaction_id = v_transaction_id AND bd2.status != 'returned'
    ) THEN
        UPDATE borrow_transactions 
        SET status = 'completed', updated_at = NOW()
        WHERE transaction_id = v_transaction_id;
    END IF;
    
    SET p_success = TRUE;
    SET p_message = 'Trả sách thành công';
    
    SELECT p_success, p_message, p_book_title, p_days_late, p_late_fee, p_damage_fee, p_total_fine, p_return_id, p_copy_id;
END //

DELIMITER ;

-- =====================================================
-- END OF DATABASE SCHEMA
-- =====================================================
DROP PROCEDURE IF EXISTS sp_process_return;

DELIMITER //

CREATE PROCEDURE sp_process_return(
    IN p_detail_id INT,
    IN p_condition_on_return VARCHAR(20),
    IN p_damage_type_id INT,
    IN p_damage_description TEXT,
    IN p_fine_payment_method_id INT,
    IN p_returned_by INT,
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(255),
    OUT p_book_title VARCHAR(255),
    OUT p_days_late INT,
    OUT p_late_fee DECIMAL(10,2),
    OUT p_damage_fee DECIMAL(10,2),
    OUT p_total_fine DECIMAL(10,2),
    OUT p_return_id INT
)
BEGIN
    DECLARE v_due_date DATE;
    DECLARE v_actual_return_date DATE DEFAULT CURDATE();
    DECLARE v_book_price DECIMAL(10,2);
    DECLARE v_daily_late_fee DECIMAL(10,2) DEFAULT 5000;
    DECLARE v_detail_status VARCHAR(20);
    DECLARE v_book_id INT;
    DECLARE v_copy_id INT;
    DECLARE v_transaction_id INT;
    
    SET p_success = FALSE;
    SET p_message = '';
    SET p_late_fee = 0;
    SET p_damage_fee = 0;
    SET p_total_fine = 0;
    
    -- FIX: Default returned_by to 1 if NULL
    IF p_returned_by IS NULL OR p_returned_by = 0 THEN
        SET p_returned_by = 1;
    END IF;
    
    -- Get borrow detail info
    SELECT DATE_ADD(bt.borrow_date, INTERVAL bd.borrow_days DAY), bd.status, b.title, b.price, bd.book_id, bc.copy_id, bd.transaction_id
    INTO v_due_date, v_detail_status, p_book_title, v_book_price, v_book_id, v_copy_id, v_transaction_id
    FROM borrow_details bd
    JOIN books b ON bd.book_id = b.book_id
    JOIN book_copies bc ON bd.copy_id = bc.copy_id
    JOIN borrow_transactions bt ON bd.transaction_id = bt.transaction_id
    WHERE bd.detail_id = p_detail_id;
    
    -- Check if detail exists
    IF v_due_date IS NULL THEN
        SET p_message = 'Không tìm thấy thông tin mượn sách';
        SELECT p_success, p_message, p_book_title, p_days_late, p_late_fee, p_damage_fee, p_total_fine, p_return_id;
    END IF;
    
    -- Check if already returned
    IF v_detail_status = 'returned' THEN
        SET p_message = 'Sách đã được trả trước đó';
        SELECT p_success, p_message, p_book_title, p_days_late, p_late_fee, p_damage_fee, p_total_fine, p_return_id;
    END IF;
    
    -- Calculate days late
    SET p_days_late = GREATEST(0, DATEDIFF(CURDATE(), v_due_date));
    
    -- Calculate late fee using calculate_late_fee function
    IF p_condition_on_return != 'lost' AND p_days_late > 0 THEN
        SET p_late_fee = calculate_late_fee(v_book_price, p_days_late);
    END IF;
    
    -- Calculate damage/lost fee
    CASE p_condition_on_return
        WHEN 'fair' THEN SET p_damage_fee = v_book_price * 0.3;
        WHEN 'poor' THEN SET p_damage_fee = v_book_price * 0.7;
        WHEN 'damaged' THEN SET p_damage_fee = v_book_price * 0.7;
        WHEN 'lost' THEN SET p_damage_fee = v_book_price;
        ELSE SET p_damage_fee = 0;
    END CASE;
    
    -- Total fine
    SET p_total_fine = p_late_fee + p_damage_fee;
    
    -- Create return record
    INSERT INTO return_records (transaction_id, detail_id, returned_by, return_date, condition_on_return, 
                                days_late, late_fee, damage_fee, fine_amount, fine_paid)
    VALUES (v_transaction_id, p_detail_id, p_returned_by, CURDATE(), p_condition_on_return,
            p_days_late, p_late_fee, p_damage_fee, p_total_fine, 
            CASE WHEN p_total_fine > 0 THEN TRUE ELSE FALSE END);
    
    SET p_return_id = LAST_INSERT_ID();
    
    -- Update book copy status
    UPDATE book_copies SET status = 'available' WHERE copy_id = v_copy_id;
    
    -- Update borrow detail status
    UPDATE borrow_details SET status = 'returned' WHERE detail_id = p_detail_id;
    
    -- Check if all books returned
    IF NOT EXISTS (
        SELECT 1 FROM borrow_details bd2
        WHERE bd2.transaction_id = v_transaction_id AND bd2.status != 'returned'
    ) THEN
        UPDATE borrow_transactions 
        SET status = 'completed', updated_at = NOW()
        WHERE transaction_id = v_transaction_id;
    END IF;
    
    SET p_success = TRUE;
    SET p_message = 'Trả sách thành công';
    
    SELECT p_success, p_message, p_book_title, p_days_late, p_late_fee, p_damage_fee, p_total_fine, p_return_id;
END //

DELIMITER ;