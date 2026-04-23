# National Library Management System

Hệ thống Quản lý Thư viện Quốc gia với đầy đủ tính năng mượn/trả sách, quản lý kho, báo cáo thống kê và cảnh báo hạn trả.

## 📁 Cấu trúc thư mục

```
national_library/
├── database/                    # File SQL database
│   └── library_schema.sql       # Schema đầy đủ 24 bảng + procedures/triggers/views
├── backend/                     # NodeJS + ExpressJS API
│   ├── src/
│   │   ├── config/              # Database config
│   │   ├── controllers/         # API controllers
│   │   ├── middleware/          # Auth, validation, error handling
│   │   ├── routes/              # API routes
│   │   └── utils/               # Helper functions
│   ├── .env.example             # Mẫu file môi trường
│   ├── package.json
│   └── server.js                # Entry point
├── frontend/                    # ReactJS + Tailwind CSS
│   ├── public/
│   ├── src/
│   │   ├── components/          # UI components (Sidebar, Header)
│   │   ├── layouts/             # Page layouts
│   │   ├── pages/               # Page components
│   │   ├── services/            # API services
│   │   ├── stores/              # Zustand state management
│   │   └── utils/               # Helper functions
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
└── README.md                    # File này
```

## 🚀 Hướng dẫn cài đặt và khởi chạy

### Yêu cầu hệ thống

- **Node.js** v14+ và npm
- **MySQL** 5.7+ hoặc MariaDB 10.2+
- **XAMPP** (khuyến nghị cho Windows) hoặc LAMP/MAMP

### Bước 1: Import Database

1. Mở **MySQL Workbench** hoặc **phpMyAdmin**
2. Tạo database mới tên `national_library`
3. Import file `database/library_schema.sql`:
   ```bash
   mysql -u root -p national_library < database/library_schema.sql
   ```
   Hoặc qua phpMyAdmin: Import → Chọn file → Thực thi

4. **Kiểm tra**: Database đã được tạo với 24+ bảng, functions, triggers, views, và events

### Bước 2: Cài đặt Backend (NodeJS)

```bash
# Di chuyển vào thư mục backend
cd backend

# Cài đặt dependencies
npm install

# Tạo file .env từ mẫu
copy .env.example .env

# Chỉnh sửa .env theo cấu hình của bạn:
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=        (để trống nếu không có)
# DB_NAME=national_library
# JWT_SECRET=your-secret-key

# Khởi chạy server development
npm run dev

# Hoặc chạy production
npm start
```

Server sẽ chạy tại: `http://localhost:5000`

**Test API**: Mở trình duyệt vào `http://localhost:5000/api/health`

### Bước 3: Cài đặt Frontend (ReactJS)

```bash
# Di chuyển vào thư mục frontend
cd frontend

# Cài đặt dependencies
npm install

# Khởi chạy React development server
npm start
```

Frontend sẽ chạy tại: `http://localhost:3000`

## 🔧 Tài khoản mặc định

| Email | Password | Role |
|-------|----------|------|
| admin@library.vn | admin123 | Admin |

**Đổi mật khẩu**: Sau khi đăng nhập, vào Cài đặt → Đổi mật khẩu

## 📊 Tính năng chính

### 1. Quản lý Độc giả
- Đăng ký độc giả mới với mã thẻ tự động
- 5 cấp độ thành viên: Đồng → Bạc → Vàng → Kim Cương → Huyền Thoại
- Tự động hạ cấp khi trễ hạn 5 lần
- Danh sách đen (blacklist)
- Tìm kiếm nhanh theo tên, SĐT, email

### 2. Quản lý Sách
- Quản lý đầu sách với ISBN, barcode
- Quản lý nhiều bản copy cho mỗi sách
- Phân loại theo danh mục, tác giả, NXB
- Theo dõi tình trạng sách (mới/tốt/kém/hư hỏng)

### 3. Mượn/Trả Sách
- Mượn nhiều sách trong 1 phiếu
- Tính phí mượn theo ngày (do thủ thư nhập)
- Tối đa 14 ngày, tùy cấp độ thành viên
- Thanh toán tiền mặt hoặc chuyển khoản

### 4. Phí Phạt Tự Động
- Trễ hạn: 50% giá sách
- Hư hỏng: 20-30% giá sách (tùy mức độ)
- Mất sách: 100% giá sách

### 5. Cảnh báo & Nhắc nhở
- Cảnh báo sách sắp đến hạn (3 ngày, 1 ngày)
- Danh sách sách quá hạn
- Hiển thị SĐT độc giả để thủ thư gọi điện

### 6. Báo cáo & Thống kê
- Doanh thu theo ngày/tuần/tháng (Bar chart + Line chart)
- Top sách được mượn nhiều nhất
- Top độc giả tích cực
- Tồn kho sách

## 🗄️ Database Schema

### 24+ Bảng chính:

**User Management (3 bảng):**
- `users`, `roles`, `user_roles`

**Membership & Reader (4 bảng):**
- `membership_tiers`, `readers`, `membership_history`, `blacklist_history`

**Book Catalog (7 bảng):**
- `categories`, `authors`, `publishers`, `books`, `book_authors`, `book_copies`, `shelf_locations`

**Borrowing (5 bảng):**
- `borrow_transactions`, `borrow_details`, `return_records`, `damage_types`, `payment_methods`

**Reservation & Notification (4 bảng):**
- `reservations`, `notification_templates`, `notifications`, `due_reminders`

**System & Audit (3 bảng):**
- `system_settings`, `activity_logs`, `borrow_rules`

### Các đối tượng đặc biệt:

**Stored Procedures (11):**
- `sp_process_borrowing` - Tạo phiếu mượn với transaction
- `sp_add_book_to_transaction` - Thêm sách vào phiếu
- `sp_finalize_borrowing` - Hoàn tất phiếu mượn
- `sp_process_return` - Xử lý trả sách + tính phạt
- `sp_process_fine_payment` - Thanh toán phạt
- `sp_handle_membership_downgrade` - Xử lý hạ cấp thành viên
- `sp_cancel_borrowing` - Hủy phiếu (rollback)
- `sp_search_reader` - Tìm kiếm độc giả
- `sp_get_reader_current_borrows` - Sách đang mượn của độc giả

**Functions (6):**
- `calculate_late_fee` - Tính phí trễ hạn
- `calculate_damage_fee` - Tính phí hư hỏng
- `calculate_borrow_fee` - Tính phí mượn
- `generate_book_barcode` - Tạo barcode
- `generate_transaction_code` - Tạo mã phiếu
- `can_reader_borrow` - Kiểm tra quyền mượn

**Triggers (8):**
- Cập nhật số lượng sách tự động
- Cập nhật đếm mượn của độc giả
- Ghi log hoạt động
- Tạo nhắc nhở tự động

**Views (9):**
- `vw_revenue_daily/weekly/monthly` - Doanh thu
- `vw_top_books/readers` - Xếp hạng
- `vw_books_due_soon` - Sắp đến hạn
- `vw_overdue_books` - Quá hạn
- `vw_inventory_status` - Tồn kho
- `vw_daily_statistics` - Thống kê ngày

**Events (2):**
- `evt_daily_due_check` - Kiểm tra hạn mượn hàng ngày
- `evt_weekly_stats` - Dọn dẹp log hàng tuần

## 🔒 Bảo mật

- JWT Authentication cho API
- Password hashing với bcrypt
- Rate limiting chống brute force
- Helmet.js bảo vệ HTTP headers
- SQL injection prevention qua parameterized queries
- CORS configuration

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Thông tin user hiện tại
- `POST /api/auth/change-password` - Đổi mật khẩu

### Readers
- `GET /api/readers` - Danh sách độc giả
- `GET /api/readers/search?q=...` - Tìm kiếm
- `GET /api/readers/:id` - Chi tiết độc giả
- `GET /api/readers/:id/borrows` - Sách đang mượn
- `POST /api/readers` - Thêm độc giả
- `PUT /api/readers/:id` - Cập nhật
- `DELETE /api/readers/:id` - Xóa (soft delete)

### Books
- `GET /api/books` - Danh sách sách
- `GET /api/books/:id` - Chi tiết sách
- `GET /api/books/:id/copies` - Danh sách bản sao
- `POST /api/books` - Thêm sách
- `PUT /api/books/:id` - Cập nhật
- `DELETE /api/books/:id` - Xóa

### Borrowing
- `GET /api/borrowings` - Danh sách phiếu mượn
- `POST /api/borrowings` - Tạo phiếu mượn
- `POST /api/borrowings/:id/books` - Thêm sách
- `POST /api/borrowings/:id/finalize` - Hoàn tất
- `POST /api/borrowings/:id/cancel` - Hủy phiếu
- `POST /api/borrowings/returns` - Trả sách

### Reports
- `GET /api/reports/dashboard` - Dashboard stats
- `GET /api/reports/revenue/daily` - Doanh thu ngày
- `GET /api/reports/revenue/weekly` - Doanh thu tuần
- `GET /api/reports/revenue/monthly` - Doanh thu tháng
- `GET /api/reports/top-books` - Top sách
- `GET /api/reports/top-readers` - Top độc giả

## 🐛 Troubleshooting

### Lỗi kết nối database
```bash
# Kiểm tra MySQL đang chạy
mysql -u root -p -e "SELECT 1"

# Kiểm tra database tồn tại
mysql -u root -p -e "SHOW DATABASES LIKE 'national_library'"
```

### Lỗi CORS
```bash
# Trong backend .env, đảm bảo:
CORS_ORIGIN=http://localhost:3000
```

### Lỗi port đã được sử dụng
```bash
# Tìm process đang dùng port 5000
netstat -ano | findstr :5000
# Kill process hoặc đổi port trong .env
```

### Reset database
```bash
mysql -u root -p -e "DROP DATABASE IF EXISTS national_library; CREATE DATABASE national_library;"
mysql -u root -p national_library < database/library_schema.sql
```

## 📱 Giao diện

Giao diện hiện đại với:
- Tailwind CSS cho styling
- Responsive design
- React Icons
- Chart.js cho biểu đồ
- Hot toast notifications
- Zustand cho state management

## 📝 License

MIT License - Phát triển cho mục đích học tập và sử dụng thư viện.

## 👥 Tác giả

National Library Development Team

---

**Lưu ý**: Đây là phiên bản demo. Trong môi trường production, hãy:
1. Thay đổi JWT_SECRET mạnh
2. Bật HTTPS
3. Cấu hình firewall
4. Backup database định kỳ
5. Sử dụng biến môi trường cho mật khẩu
