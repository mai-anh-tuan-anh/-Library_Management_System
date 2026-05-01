# National Library Management System

Website quản lý thư viện theo mô hình fullstack (`React + Node.js + MySQL`) dành cho nghiệp vụ thực tế: quản lý độc giả, quản lý đầu sách và bản sao, luồng mượn/trả theo barcode, tính phí phạt, cảnh báo đến hạn, báo cáo doanh thu.

## Tổng quan dự án

Đây là một hệ thống mô phỏng hoạt động của thư viện hiện đại, tập trung vào 3 mục tiêu:

- Chuẩn hóa nghiệp vụ mượn/trả: giao dịch nhiều sách trong một phiếu, kiểm soát hạn mượn theo hạng thành viên.
- Theo dõi tồn kho theo từng bản sao (`book_copies`) thay vì chỉ theo đầu sách.
- Tự động hóa vận hành: trigger/procedure/event trong DB để xử lý phạt, nhắc hạn, downgrade thành viên, báo cáo.

## Lý do xây dựng website này

- Thay thế cách quản lý thủ công (sổ sách/Excel) vốn khó kiểm soát lịch sử mượn trả và tình trạng sách.
- Tạo nền tảng học tập đầy đủ cho mô hình fullstack có nghiệp vụ rõ ràng từ `frontend -> backend -> database`.
- Minh họa cách kết hợp business logic ở cả tầng API và tầng SQL (function/procedure/trigger/view/event).

## Tech stack

### Frontend
- `React 18`
- `React Router v6`
- `Axios`
- `Zustand` (auth state)
- `Tailwind CSS`
- `Chart.js` + `react-chartjs-2`
- `react-hot-toast`, `react-icons`

### Backend
- `Node.js` + `Express`
- `mysql2/promise` (pool + transaction + stored procedure caller)
- `JWT` (`jsonwebtoken`)
- `bcryptjs`
- `helmet`, `cors`, `express-rate-limit`, `morgan`

### Database
- `MySQL`
- `26 bảng` chính (quản trị user, bạn đọc, kho sách, giao dịch mượn/trả, notification, system)
- Functions, triggers, stored procedures, views, events

## Đối tượng người dùng

- **Admin/Thủ thư**: quản lý độc giả, sách, phiếu mượn/trả, cảnh báo hạn trả.
- **Nhân viên vận hành**: xử lý trả sách bằng barcode, tính phí phạt.
- **Quản lý**: xem dashboard, doanh thu ngày/tuần/tháng, top sách/độc giả.
- **Developer mới**: có thể học cách tổ chức hệ thống fullstack thực chiến theo module.

## Cách sử dụng website

### 1) Chuẩn bị database

```bash
mysql -u root -p < database/library_schema.sql
```

Schema sẽ tự tạo DB `national_library`, bảng, dữ liệu mẫu, procedure/function/trigger/view/event.

### 2) Chạy backend

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

API mặc định: `http://localhost:5000`  
Health check: `GET /api/health`

### 3) Chạy frontend

```bash
cd frontend
npm install
npm start
```

Web app mặc định: `http://localhost:3000`

### 4) Đăng nhập demo

- Email: `admin@library.vn`
- Password: `admin123`

### 5) Luồng dùng cơ bản

- Vào `Độc giả` để tạo/chỉnh sửa hồ sơ bạn đọc.
- Vào `Sách` để tạo đầu sách và thêm bản sao (`barcode`).
- Vào `Mượn sách / Trả sách` để tạo phiếu mượn 3 bước: chọn độc giả -> quét barcode -> finalize.
- Vào `Trả sách` hoặc modal trả sách trong trang mượn để xử lý trả và phí phạt.
- Vào `Báo cáo` để xem doanh thu + top books + top readers.

## Demo

Hiện tại dự án được thiết kế theo demo local:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api`
- Health endpoint: `http://localhost:5000/api/health`

Bạn có thể quay màn hình nhanh theo kịch bản demo sau:
1. Login bằng tài khoản admin.
2. Tạo một độc giả mới.
3. Tạo phiếu mượn mới bằng barcode.
4. Trả sách với tình huống quá hạn/hư hỏng để thấy phí phạt.
5. Mở trang báo cáo để xem dữ liệu đã phát sinh.

## Tài liệu chi tiết kèm theo

- `file1.md`: phân tích toàn bộ folder/file, API flow, cách frontend gọi backend, backend làm việc với database.
- `file2.md`: phân tích chuyên sâu `database/library_schema.sql` (tables, procedures, transactions, triggers, views, events).

## Lưu ý quan trọng

- File SQL hiện có một số đối tượng được định nghĩa lại ở cuối file (ví dụ `sp_process_return`, `vw_revenue_daily`, `vw_revenue_weekly`). Bản định nghĩa cuối cùng sẽ là bản có hiệu lực.
- Một số cột/trạng thái trong schema rộng hơn phần backend đang sử dụng; đây là điểm mở rộng nghiệp vụ, không phải lỗi chạy ngay lập tức.
