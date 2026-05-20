# Enterprise Inventory Management System (EMS)

A production-grade full-stack inventory management platform built with React.js, Node.js/Express.js, and PostgreSQL.

## Tech Stack

| Layer       | Technology                                      |
|-------------|------------------------------------------------|
| Frontend    | React 18, Vite, Tailwind CSS, React Query, Recharts |
| Backend     | Node.js, Express.js (OOP architecture)         |
| Database    | PostgreSQL 16 (normalised schema, transactions) |
| Auth        | JWT (access + refresh) with rotation           |
| Deployment  | Docker Compose, Nginx                           |

## Architecture

```
Client (React)
  └── Axios (JWT interceptors + auto-refresh)
        └── Express Router
              └── verifyToken middleware
                    └── requireRole middleware (RBAC)
                          └── Controller (HTTP adapter)
                                └── Service (business logic + transactions)
                                      └── Repository (raw SQL, pg pool)
                                            └── PostgreSQL
```

## Database Schema

| Table            | Purpose                                  |
|------------------|------------------------------------------|
| users            | Auth + role management                   |
| suppliers        | Vendor master data                       |
| products         | Product catalogue with reorder levels    |
| inventory        | Live stock quantities per product        |
| orders           | Purchase and sale order headers          |
| order_items      | Line items with price snapshots          |
| stock_movements  | Full audit trail of all stock changes    |

## Key Technical Features

### Atomic Stock Deduction
When a sale order is confirmed, all three operations run in a single `BEGIN/COMMIT` transaction:
1. Validate sufficient stock
2. `UPDATE inventory SET quantity_on_hand = quantity_on_hand - X`
3. `INSERT INTO stock_movements`

Any failure triggers `ROLLBACK` — no partial state ever persists.

### Role-Based Access Control
Three roles with route-level enforcement:
- **Admin**: full access to all endpoints
- **Warehouse**: stock adjustments, inventory reads
- **Sales**: create/view orders, read products

### Price Snapshot
`order_items.unit_price_snapshot` captures the product price at order creation time. Historical order totals remain accurate independent of future price changes — mirrors real ERP design (SAP/Oracle).

### Refresh Token Rotation
Refresh tokens are stored server-side. On `/auth/refresh`:
- Old token is invalidated
- New pair is issued
- Reuse detection: if an already-rotated token is presented, all sessions for that user are invalidated immediately.

## Quick Start

### With Docker Compose (recommended)

```bash
git clone <repo>
cd ems
docker compose up -d
```

Then seed the database:
```bash
docker exec ems_backend node seed.js
```

App available at: `http://localhost:5173`

### Local Development

**Prerequisites:** Node.js 20+, PostgreSQL 16

```bash
# Database setup
psql -U postgres -c "CREATE DATABASE ems_db;"
psql -U postgres -d ems_db -f backend/schema.sql

# Backend
cd backend
cp .env.example .env   # fill in your values
npm install
npm run seed           # seed demo data
npm run dev            # http://localhost:5000

# Frontend (new terminal)
cd frontend
npm install
npm run dev            # http://localhost:5173
```

## Demo Credentials

| Role      | Email                | Password    |
|-----------|----------------------|-------------|
| Admin     | admin@ems.com        | password123 |
| Warehouse | warehouse@ems.com   | password123 |
| Sales     | sales@ems.com        | password123 |

## API Reference

### Auth
| Method | Endpoint            | Access | Description        |
|--------|---------------------|--------|--------------------|
| POST   | /api/auth/login     | Public | Get JWT tokens     |
| POST   | /api/auth/refresh   | Public | Rotate tokens      |
| POST   | /api/auth/logout    | Auth   | Invalidate refresh |
| POST   | /api/auth/register  | Admin  | Create user        |
| GET    | /api/auth/me        | Auth   | Current user info  |

### Products
| Method | Endpoint                  | Access | Description              |
|--------|---------------------------|--------|--------------------------|
| GET    | /api/products             | Auth   | List (search/filter/low) |
| GET    | /api/products/categories  | Auth   | Distinct categories      |
| GET    | /api/products/:id         | Auth   | Single product           |
| POST   | /api/products             | Admin  | Create + init inventory  |
| PUT    | /api/products/:id         | Admin  | Update product           |
| DELETE | /api/products/:id         | Admin  | Soft delete              |

### Inventory
| Method | Endpoint                          | Access           | Description       |
|--------|-----------------------------------|------------------|-------------------|
| GET    | /api/inventory                    | Auth             | All stock levels  |
| GET    | /api/inventory/low-stock          | Auth             | Below reorder     |
| GET    | /api/inventory/:productId/movements | Auth           | Movement history  |
| POST   | /api/inventory/adjust             | Warehouse, Admin | Manual adjustment |

### Orders
| Method | Endpoint                | Access | Description              |
|--------|-------------------------|--------|--------------------------|
| GET    | /api/orders             | Auth   | List (filter status/type)|
| GET    | /api/orders/:id         | Auth   | Order + line items       |
| POST   | /api/orders             | Auth   | Create (pending state)   |
| POST   | /api/orders/:id/confirm | Auth   | Atomic stock operation   |
| PATCH  | /api/orders/:id/status  | Auth   | Update status            |
| DELETE | /api/orders/:id         | Admin  | Delete pending/cancelled |

### Analytics
| Method | Endpoint                    | Access | Description         |
|--------|-----------------------------|--------|---------------------|
| GET    | /api/analytics/kpis         | Auth   | Dashboard KPIs      |
| GET    | /api/analytics/top-products | Auth   | Top sellers         |
| GET    | /api/analytics/stock-value  | Auth   | Value by category   |
| GET    | /api/analytics/movements    | Auth   | Movement trend      |
| GET    | /api/analytics/order-trend  | Auth   | Order volume trend  |
| GET    | /api/analytics/reorder-report | Auth | Full reorder report |

## Project Structure

```
ems/
├── backend/
│   ├── src/
│   │   ├── config/         db.js
│   │   ├── middleware/      auth.js, role.js, error.js
│   │   ├── modules/
│   │   │   ├── auth/        router, controller, service
│   │   │   ├── users/       router, controller, repository
│   │   │   ├── products/    router, controller, service, repository
│   │   │   ├── suppliers/   router, controller, repository
│   │   │   ├── inventory/   router, controller, service, repository
│   │   │   ├── orders/      router, controller, service, repository
│   │   │   └── analytics/   router, controller, service
│   │   └── utils/           jwt.js, response.js
│   ├── schema.sql
│   ├── seed.js
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/             axios.js (interceptors)
│   │   ├── contexts/        AuthContext.jsx
│   │   ├── routes/          ProtectedRoute.jsx
│   │   ├── components/
│   │   │   ├── layout/      Layout.jsx, Sidebar.jsx
│   │   │   └── ui/          Modal, KpiCard, Badge, etc.
│   │   └── pages/           Dashboard, Products, Inventory,
│   │                        Orders, Suppliers, Analytics, Users
│   └── Dockerfile
└── docker-compose.yml
```
