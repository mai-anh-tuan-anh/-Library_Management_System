# File 1 - Giai thich kien truc toan bo project

Tai lieu nay giai thich website thu vien theo goc nhin fullstack senior, de nguoi moi co the lan theo tung lop `frontend -> backend -> database`.

## 1) Tong quan cau truc thu muc

```text
national_library/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── routes/
│       └── utils/
├── frontend/
│   ├── package.json
│   └── src/
│       ├── App.js
│       ├── components/
│       ├── layouts/
│       ├── pages/
│       ├── services/
│       └── stores/
├── database/
│   └── library_schema.sql
└── README.md
```

Ngoai ra con mot so file tai lieu, PDF, docx khong anh huong den runtime cua he thong.

---

## 2) Frontend - React app

### 2.1 Entry va dinh tuyen

- `frontend/src/App.js`:
  - Quan ly route bang `react-router-dom`.
  - Route public: `/login`.
  - Route private: dashboard, readers, books, borrowing, returns, reports, settings.
  - `ProtectedRoute` kiem tra `isAuthenticated` tu Zustand store.

### 2.2 Quan ly dang nhap

- `frontend/src/stores/authStore.js`:
  - `login(email, password)` goi `POST /auth/login`.
  - Luu `token` vao `localStorage`.
  - Persist `user` va `isAuthenticated`.
- `frontend/src/services/api.js`:
  - Tao axios instance (`baseURL` la `/api`).
  - Request interceptor: gan `Authorization: Bearer <token>`.
  - Response interceptor: xu ly 401/403/404/500, tu dong ve `/login` neu het han token.

### 2.3 Cac nhom page chinh

- `pages/Auth/Login.js`: dang nhap.
- `pages/Dashboard/Dashboard.js`: lay dashboard stats + due alerts + revenue chart.
- `pages/Readers/*`: CRUD ban doc, lich su muon.
- `pages/Books/*`: CRUD dau sach + ban sao.
- `pages/Borrowing/BorrowTransaction.js`: tao phieu muon 3 buoc.
- `pages/Borrowing/Borrowing.js`: danh sach giao dich, xem chi tiet, tra sach theo tung cuon.
- `pages/Returns/Returns.js`: tra sach theo barcode.
- `pages/Reports/Reports.js`: doanh thu, top books, top readers.
- `pages/Settings/Settings.js`: cap nhat `system_settings`.

### 2.4 Services (frontend goi API nhu the nao)

- `readerService.js` -> `/api/readers/*`
- `bookService.js` -> `/api/books/*`
- `borrowService.js` -> `/api/borrowings/*`
- `reportService.js` -> `/api/reports/*`
- `settingsService.js` -> `/api/settings`

Pattern chung:
1. Page goi service.
2. Service goi axios (`api.js`).
3. Token duoc gan tu dong.
4. Nhan JSON `success/data/message`.

---

## 3) Backend - Express API

### 3.1 server.js (xuong song toan he thong)

`backend/server.js` la noi setup:

- CORS (cho phep `localhost:3000`).
- Bao mat: `helmet`, `rate-limit`.
- Parse body: `express.json`.
- Health endpoint: `GET /api/health`.
- Mount route:
  - `/api/auth`
  - `/api/readers`
  - `/api/books`
  - `/api/borrowings`
  - `/api/reports`
  - `/api/settings`
- 404 handler + global `errorHandler`.

### 3.2 database layer

- `backend/src/config/database.js`:
  - Tao `mysql2` pool.
  - `query(sql, params)` cho lenh SQL thong thuong.
  - `transaction(callback)` de commit/rollback.
  - `callProcedure(name, params, outParamNames)` de goi stored procedure, ho tro OUT params.

Day la lop ket noi trung tam giua controller va MySQL.

### 3.3 middleware

- `auth.middleware.js`:
  - Doc JWT tu `Authorization`.
  - Verify token.
  - Query DB lay `req.user`.
- `error.middleware.js`:
  - Bat loi MySQL, JWT, Validation.
  - `asyncHandler(fn)` tranh lap try/catch o moi controller.

### 3.4 routes -> controller mapping

- `auth.routes.js` -> `auth.controller.js`
- `reader.routes.js` -> `reader.controller.js`
- `book.routes.js` -> `book.controller.js`
- `borrow.routes.js` -> `borrow.controller.js`
- `report.routes.js` -> `report.controller.js`
- `settings.routes.js` -> `settings.controller.js`

Phan lon route (tru auth) deu bat buoc `authenticate`.

---

## 4) Chi tiet API va luong du lieu

## 4.1 Auth API

- `POST /api/auth/login`
  - Controller query bang `email`.
  - So sanh `bcrypt.compare(password, password_hash)`.
  - Tra JWT + user info.
- `GET /api/auth/me`
  - Lay role tu `roles` + `user_roles`.
- `POST /api/auth/change-password`
  - Kiem tra mat khau cu.
  - Hash mat khau moi.

## 4.2 Reader API

- `GET /api/readers`: danh sach co paging/search/filter.
- `GET /api/readers/search`: goi `sp_search_reader`.
- `GET /api/readers/:id/borrows`: goi `sp_get_reader_current_borrows`.
- `GET /api/readers/:id/history`: query join lich su muon/tra.
- `POST/PUT/DELETE`: CRUD + soft delete.
- `POST /:id/change-tier`: ghi `membership_history` va cap nhat tier.

Kieu lay du lieu:
- vua query SQL truc tiep,
- vua goi procedure (neu can business logic phuc tap o DB).

## 4.3 Book API

- `GET /api/books`: list + thong tin author/category/publisher + so ban copy.
- `GET /api/books/:id/copies`: danh sach ban sao.
- `POST /api/books`: tao dau sach.
- `POST /api/books/:id/copies`: them ban sao, cap nhat ton kho.
- `PUT /api/books/book-copies/:copyId`: cap nhat tinh trang ban sao.
- `DELETE /api/books/:bookId/copies/:copyId`: soft delete copy.
- `POST /api/books/:bookId/copies/:copyId/restore`: khoi phuc copy.
- `GET /api/books/book-copies/search?barcode=`: tim theo barcode.

## 4.4 Borrowing API (module nghiep vu kho nhat)

### Luong tao phieu muon
1. `POST /api/borrowings` -> goi `sp_process_borrowing` tao header.
2. `POST /api/borrowings/:id/books` -> goi `sp_add_book_to_transaction`.
3. `POST /api/borrowings/:id/finalize` -> goi `sp_finalize_borrowing`.

### Luong huy phieu
- `POST /api/borrowings/:id/cancel` -> `sp_cancel_borrowing`.

### Luong tra sach
- `POST /api/borrowings/returns` -> goi `sp_process_return` (legacy).
- `POST /api/borrowings/returns/barcode` -> goi `sp_process_return_by_barcode` (flow moi).

### Canh bao
- `GET /api/borrowings/due-alerts`
- `GET /api/borrowings/overdue`
- `POST /api/borrowings/:id/remind`

## 4.5 Report API

- `GET /api/reports/dashboard`: thong ke tong hop.
- `GET /api/reports/revenue/daily|weekly|monthly`: doc tu view.
- `GET /api/reports/top-books`, `top-readers`.
- `GET /api/reports/inventory`.

## 4.6 Settings API

- `GET /api/settings`: doc `system_settings`.
- `PUT /api/settings`: upsert key-value.

---

## 5) Database duoc su dung nhu the nao trong backend

Co 3 kieu truy cap du lieu:

1. **Query truc tiep**
   - CRUD co ban.
   - Example: `SELECT * FROM readers ...`, `UPDATE books ...`.
2. **Stored Procedure**
   - Xu ly giao dich co nhieu buoc va can rollback.
   - Example: `sp_process_borrowing`, `sp_process_return`.
3. **View**
   - Bao cao tong hop san o DB de API chi viec doc.
   - Example: `vw_revenue_daily`, `vw_inventory_status`.

Khi nao can transaction:
- Tao phieu muon, tra sach, huy phieu, thanh toan phat.
- Controller goi procedure hoac dung helper `transaction`.

---

## 6) Luong ket noi dau-cuoi (end-to-end)

Vi du luong "tao phieu muon":

1. Thu thu thao tac o `BorrowTransaction.js`.
2. Page goi `borrowService.create`.
3. `api.js` gui request den backend kem JWT.
4. `borrow.routes.js` nhan request, middleware xac thuc.
5. `borrow.controller.js` goi `sp_process_borrowing`.
6. Procedure tao `borrow_transactions`.
7. Frontend nhan `transaction_id`, tiep tuc add books + finalize.
8. Trigger/procedure cap nhat trang thai copy, tong phi, due date.

Do la cach he thong ket noi front-back-db rat ro rang.

---

## 7) Cac diem can luu y cho nguoi moi

- Du an dung song song logic o backend JS va DB SQL, nen debug can theo ca 2 phia.
- SQL schema co mot so object bi define lai o cuoi file (`sp_process_return`, `vw_revenue_daily`, `vw_revenue_weekly`), object cuoi cung moi la object co hieu luc.
- Frontend dang co mot vai endpoint params dat ten chua hoan toan dong bo backend (vi du camelCase vs snake_case), can thong nhat neu refactor tiep.
- Mot so trang (vi du returns) co flow cu va flow moi cung ton tai de giu backward compatibility.

---

## 8) Goi y hoc nhanh cho ban

Neu ban moi:

1. Doc `frontend/src/pages/Borrowing/BorrowTransaction.js`.
2. Doc `frontend/src/services/borrowService.js`.
3. Doc `backend/src/routes/borrow.routes.js`.
4. Doc `backend/src/controllers/borrow.controller.js`.
5. Doc procedure `sp_process_borrowing`, `sp_add_book_to_transaction`, `sp_finalize_borrowing` trong SQL.

Chi can nam vung luong nay la ban hieu duoc hon 60% he thong.
