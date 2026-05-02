# File 2 - Phan tich `library_schema.sql` chi tiet

Tai lieu nay phan tich schema theo goc nhin thiet ke he thong va van hanh du lieu.

## 1 Tong quan nhanh

`database/library_schema.sql` dang theo huong "DB la noi giu business rules quan trong", gom:

- 26 bang chinh (quan tri, kho sach, giao dich, thong bao, audit).
- 7 functions.
- 9 triggers.
- nhieu stored procedures cho luong muon/tra/huy.
- 9+ views cho dashboard/report.
- 2 events chay dinh ky.

File co seed data, sample data, va mot so object duoc tao lai o cuoi file (can hieu theo thu tu thuc thi).

---

## 2 Nhom bang va vai tro

## 2.1 User management

- `roles`: danh muc vai tro.
- `users`: tai khoan he thong.
- `user_roles`: bang lien ket many-to-many.

Muc tieu: tach quyen ra khoi user, de mo rong nhieu vai tro cho 1 user.

## 2.2 Reader & membership

- `membership_tiers`: dinh nghia hang thanh vien (max_books, max_borrow_days, late_threshold).
- `readers`: ho so ban doc + tier hien tai + chi so vi pham (`late_count`).
- `membership_history`: lich su nang/hạ cap.
- `blacklist_history`: lich su vao/ra blacklist.

Muc tieu: quan ly han muc muon theo tier va ky luat theo lich su tra muon.

## 2.3 Book catalog & inventory

- `categories`, `authors`, `publishers`: dictionary tables.
- `books`: dau sach (metadata, gia, phi muon/ngay, tong ban sao).
- `book_authors`: lien ket nhieu tac gia cho 1 sach.
- `book_copies`: quan ly tung cuon vat ly bang `barcode`.
- `shelf_locations`: vi tri ke sach.

Muc tieu: inventory theo copy-level, phu hop bai toan thu vien thuc te.

## 2.4 Borrowing/return

- `borrow_transactions`: phieu muon (header).
- `borrow_details`: tung cuon trong phieu.
- `return_records`: record tra, phi tre, phi hu hong, thanh toan phat.
- `damage_types`: bang ti le phat hu hong.
- `payment_methods`: phuong thuc thanh toan.

Muc tieu: luu day du vong doi giao dich va phat sinh doanh thu.

## 2.5 Reservation/notification

- `reservations`
- `notification_templates`
- `notifications`
- `due_reminders`

Muc tieu: tao co che nhac han va gui thong bao theo su kien.

## 2.6 System/audit

- `system_settings`: key-value setting.
- `activity_logs`: nhat ky thao tac.
- `borrow_rules`: bo quy tac theo tier theo khoang hieu luc.

Muc tieu: cai dat he thong va truy vet thay doi.

---

## 3 Relationship quan trong

- `readers.tier_id` -> `membership_tiers.tier_id`
- `borrow_transactions.reader_id` -> `readers.reader_id`
- `borrow_details.transaction_id` -> `borrow_transactions.transaction_id`
- `borrow_details.copy_id` -> `book_copies.copy_id`
- `return_records.detail_id` -> `borrow_details.detail_id`
- `book_copies.book_id` -> `books.book_id`

Flow nghiep vu cot loi:

1. Tao `borrow_transactions`.
2. Them `borrow_details`.
3. Khi tra, tao `return_records`.
4. Cap nhat `borrow_details.status`, `book_copies.status`, `borrow_transactions.status`.

---

## 4 Functions - ly do va cach dung

## 4.1 `calculate_late_fee(book_price, days_late)`

- Doc `late_penalty_percent` tu `system_settings`.
- Phi tre = `book_price * (percent/100) * days_late`.
- Dung lai o procedure va view.

Y nghia senior: business rate co the doi ma khong sua code backend.

## 4.2 `calculate_damage_fee(book_price, damage_percentage)`

- Tinh phi theo % hu hong.

## 4.3 `calculate_borrow_fee(daily_fee, borrow_days)`

- Tong phi muon theo so ngay.

## 4.4 `generate_book_barcode(book_id, copy_number)`

- Sinh barcode format `LIB-xxxxxx-xxx`.

## 4.5 `generate_transaction_code(reader_id)`

- Sinh ma giao dich theo ngay + reader.

## 4.6 `generate_card_number()`

- Sinh ma the doc gia.

## 4.7 `can_reader_borrow(reader_id, requested_books)`

- Kiem tra active/blacklist/han muc max_books.
- Duoc backend goi truoc khi tao giao dich.

---

## 5 Triggers - tu dong hoa nhung gi

## 5.1 Nhom inventory

- `trg_update_book_available_copies`
- `trg_update_book_totals_on_insert`
- `trg_update_book_totals_on_delete`

Muc dich: khong de `books.total_copies` va `books.available_copies` bi lech.

## 5.2 Nhom reader stats

- `trg_update_reader_on_borrow`
- `trg_update_reader_on_return`
- `trg_handle_late_return`

Muc dich: cap nhat `current_borrows`, `total_borrows`, `late_count` tu dong.

## 5.3 Nhom logs/reminders

- `trg_log_reader_insert`
- `trg_log_reader_update`
- `trg_create_due_reminders`

Muc dich: ghi audit va tao lich nhac han ngay luc phat sinh giao dich.

---

## 6 Stored procedures (phan quan trong nhat)

## 6.1 Borrowing pipeline

### `sp_process_borrowing`

- Validate reader.
- Tao transaction header.
- Tra `transaction_id` qua OUT param.
- Co `START TRANSACTION` + `COMMIT/ROLLBACK`.

### `sp_add_book_to_transaction`

- Kiem tra copy co `available`.
- Kiem tra so ngay muon <= gioi han tier.
- Them `borrow_details`.
- Doi `book_copies.status` -> `borrowed`.

### `sp_finalize_borrowing`

- Tong hop so sach, tong phi.
- Chot `expected_return_date`.
- Chuyen `payment_status` sang `paid`.

## 6.2 Return pipeline

### `sp_process_return_by_barcode`

- Tim ban sao dang muon qua barcode.
- Tinh `days_late`, `late_fee`, `damage_fee`.
- Insert `return_records`.
- Update `borrow_details` va `book_copies`.
- Neu tra het: mark transaction completed.

### `sp_process_return` (duoc define lai o cuoi file)

- Co 2 phien ban trong file.
- Phien ban cuoi (sau dong `DROP PROCEDURE IF EXISTS`) la ban hieu luc.
- Ho tro tham so `p_returned_by`, xu ly dieu kien mat sach/hu hong.

## 6.3 Procedure khac

- `sp_process_fine_payment`: xac nhan thanh toan phat.
- `sp_handle_membership_downgrade`: ha hang/blacklist theo `late_count`.
- `sp_cancel_borrowing`: huy phieu va rollback trang thai copy.
- `sp_search_reader`: search reader + thong tin tong hop.
- `sp_get_reader_current_borrows`: lay sach dang muon + do uu tien han tra.
- `sp_process_all_downgrades`: chay theo batch cho event hang ngay.

---

## 7 Transactions - vi sao can va dang dung nhu nao

Trong SQL, transaction duoc dung de dam bao tinh nhat quan:

- Tao phieu muon: neu loi o giua, rollback toan bo.
- Them sach vao phieu: tranh co detail nhung status copy chua doi (hoac nguoc lai).
- Tra sach: dam bao return record, detail status, copy status cap nhat dong bo.
- Huy phieu: khoi phuc copy va cap nhat transaction atomically.

Y nghia senior:

- Tranh "dirty state" khi app bi ngat giua chung.
- Tot cho du lieu tai chinh (phi muon/phat).

---

## 8 Views - tach doc bao cao khoi query runtime

Views chinh:

- `vw_revenue_daily`
- `vw_revenue_weekly`
- `vw_revenue_monthly`
- `vw_top_books`
- `vw_top_readers`
- `vw_books_due_soon`
- `vw_overdue_books`
- `vw_inventory_status`
- `vw_daily_statistics`
- `vw_book_alerts`

Loi ich:

- Backend report chi can `SELECT * FROM view`.
- Cong thuc tong hop tap trung mot cho.
- UI chart khong can phai join phuc tap.

Luu y quan trong:

- `vw_revenue_weekly` va `vw_revenue_daily` duoc tao lai o cuoi file.
- Ban tao sau cung se ghi de ban truoc.

---

## 9 Events - tac vu nen dinh ky

## 9.1 `evt_daily_due_check`

- Tao thong bao nhac han cho giao dich sap den han.
- Mark reminder da gui.
- Goi `sp_process_all_downgrades`.

## 9.2 `evt_weekly_stats`

- Don dep notifications cu.
- Don dep activity logs qua han.

Y nghia senior:

- Day processing "maintenance" ra khoi web request.
- Giam tai API, giu DB gon theo thoi gian.

---

## 10 Seed data va kha nang demo

Schema co seed:

- role, user admin, membership tiers
- categories, authors, publishers
- sample books, book copies, readers
- setting mac dinh

Nen sau khi import la co the login va demo ngay.

---

## 11) Nhan xet senior (diem manh va diem can chu y)

## Diem manh

- Mo hinh data day du nghiep vu thu vien.
- Copy-level inventory rat dung bai toan thuc te.
- Procedure/trigger/event giup tu dong hoa cao.
- Co audit logs va settings cho van hanh.

## Diem can chu y

- Co object bi dinh nghia trung lap cuoi file (`sp_process_return`, `vw_revenue_daily`, `vw_revenue_weekly`).
- Co dau hieu schema tien hoa nhanh (mot so cot duoc backend dung/khong dung khac nhau theo thoi diem).
- Can version hoa migration de deploy production an toan hon.

---

## 12 Cach su dung schema dung chuan khi phat trien tiep

1. Khong sua truc tiep production SQL bang tay.
2. Tach migration theo version (`V1__init.sql`, `V2__fix_return_proc.sql`, ...).
3. Neu doi business rule (phi, tier, reminder), uu tien doi qua `system_settings` hoac bang config.
4. Moi procedure quan trong can test voi transaction rollback scenario.
5. Moi view bao cao can benchmark khi data lon.

Tai lieu nay nen duoc cap nhat cung luc moi lan sua `library_schema.sql`.
