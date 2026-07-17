# National Library Management System

A full-stack library management platform built with **React**, **Node.js**, and **MySQL**. It covers reader profiles, book inventory with barcoded copies, multi-book borrow/return workflows, late fines, due-date alerts, and revenue reporting.

[Link demo: [National Library - Hệ thống Quản lý Thư viện]](https://library-management-system-sepia-theta.vercel.app/login)

## Features

- **Reader management** — profiles, membership tiers, borrow limits
- **Book inventory** — titles, categories, publishers, and per-copy barcode tracking
- **Borrow & return** — 3-step borrow flow (select reader → scan barcodes → finalize); return with late/damage fees
- **Due alerts** — books due soon or overdue
- **Dashboard & reports** — revenue charts, top books/readers (Chart.js)
- **Role-based UI** — menu access by role (admin, librarian, staff, accountant, reader)
- **Database automation** — stored procedures, triggers, functions, and views for fees, reminders, and analytics

## Tech Stack


| Layer    | Technologies                                                      |
| -------- | ----------------------------------------------------------------- |
| Frontend | React 18, React Router v6, Axios, Zustand, Tailwind CSS, Chart.js |
| Backend  | Node.js, Express, mysql2, JWT, bcryptjs, helmet, cors             |
| Database | MySQL — 26 tables, procedures, triggers, functions, views         |


## Project Structure

```
national_library/
├── frontend/          # React SPA (Vercel-ready)
├── backend/           # Express REST API
└── database/
    └── library_schema.sql
```

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8+

### 1. Database

Create a database, then import the schema:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS national_library;"
mysql -u root -p national_library < database/library_schema.sql
```

The schema creates tables, seed data, and database objects (procedures, triggers, views).  
`CREATE EVENT` and `SET GLOBAL event_scheduler` may fail on managed MySQL hosts without SUPER privileges — the app still works without scheduled events.

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env   # Windows: copy .env.example .env
npm run dev
```

Default API: `http://localhost:5000`  
Health check: `GET /api/health`

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

Default app: `http://localhost:3000`

Set the API URL if the backend is not on localhost:

```bash
# frontend/.env
REACT_APP_API_URL=http://localhost:5000/api
```

### Demo Login


| Field    | Value              |
| -------- | ------------------ |
| Email    | `admin@library.vn` |
| Password | `admin123`         |


### Quick Demo Flow

1. Log in as admin.
2. Create a reader under **Readers**.
3. Add a book and copies (barcodes) under **Books**.
4. Start a borrow transaction: select reader → scan barcodes → finalize.
5. Process a return (optionally overdue/damaged) to see fines applied.
6. Open **Reports** to view revenue and rankings.

## Deployment

### Frontend (Vercel)


| Setting          | Value           |
| ---------------- | --------------- |
| Root Directory   | `frontend`      |
| Build Command    | `npm run build` |
| Output Directory | `build`         |


Environment variable:

```
REACT_APP_API_URL=https://your-backend-url/api
```

### Backend (Render, Railway, etc.)

Set from `backend/.env.example`, plus:

```
CORS_ORIGIN=https://your-frontend-url.vercel.app
DB_SSL=true          # required for Aiven and most cloud MySQL providers
```

### Database (Aiven, PlanetScale, etc.)

Import `database/library_schema.sql` into your target database and point `DB_NAME`, `DB_HOST`, `DB_PORT`, and credentials at the backend.

## API Overview


| Prefix            | Purpose                    |
| ----------------- | -------------------------- |
| `/api/auth`       | Login, register, profile   |
| `/api/readers`    | Reader CRUD and membership |
| `/api/books`      | Books, copies, categories  |
| `/api/borrowings` | Borrow/return transactions |
| `/api/reports`    | Dashboard and analytics    |
| `/api/settings`   | System settings            |


## Notes

- **Users vs readers** — login accounts live in `users`; library cards live in `readers`. Registration creates a `users` row with the `reader` role, not a `readers` profile automatically.
- **Schema duplicates** — some objects (e.g. `vw_revenue_daily`, `sp_process_return`) are redefined at the end of `library_schema.sql`; the last definition wins.
- **Authorization** — role checks are enforced in the frontend sidebar; most backend routes use JWT authentication only.

## License

Educational / portfolio project.