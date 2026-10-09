# The Velvet Tap — Bar Point-of-Sale (POS) & Admin System

A modern, fast, and unified Bar Point-of-Sale (POS) and Management System built with **React 18**, **TypeScript**, **Vite**, **Joy UI**, **Electron**, and **PostgreSQL**.

The application unifies the **Admin Portal** and **POS Cashier Terminal** into **one single frontend deployment, one shared login page, and role-based access control**, while maintaining compatibility across modern web browsers and native **Electron desktop executables**.

---

## 1. Unified Architecture Overview

```text
                        ONE BARPOS APPLICATION
                                   |
                             Unified Login (/login)
                                   |
                            Shared Authentication
                                   |
                             Role Verification
                                   |
                    +--------------+--------------+
                    |                             |
                  ADMIN                         CASHIER
                    |                             |
             Admin Portal                     POS Terminal
             (/admin/dashboard)               (/pos/orders)
                    |                             |
                    +--------------+--------------+
                                   |
                            Shared Backend API (Port 4000)
                                   |
                             PostgreSQL Database (Port 5433 / 5434)
                                   |
                       Shared Products, Inventory,
                         Orders, Payments, Sales
```

---

## 2. Monorepo Structure

```text
BarPOS/
├── apps/
│   ├── customer/       # Mobile customer QR table ordering app (Port 3001)
│   ├── pos/            # Unified BarPOS Frontend & Desktop Electron App (Port 3002)
│   │   ├── electron/   # Native Electron main process & preload scripts
│   │   ├── src/
│   │   │   ├── components/  # Modals (Payment, Receipt, Walk-in, ThemeToggle)
│   │   │   ├── layouts/     # POSLayout & AdminLayout
│   │   │   ├── pages/
│   │   │   │   ├── LoginPage.tsx          # Single Unified Role-Based Login
│   │   │   │   ├── OrdersPage.tsx         # Cashier Orders & Transactions
│   │   │   │   ├── DashboardPage.tsx      # Cashier Shift Dashboard
│   │   │   │   ├── NotFoundPage.tsx       # 404 handler with role redirection
│   │   │   │   └── admin/                 # Administrator modules
│   │   │   │       ├── AdminDashboardPage.tsx
│   │   │   │       ├── ProductsPage.tsx
│   │   │   │       ├── CategoriesPage.tsx
│   │   │   │       ├── TablesPage.tsx
│   │   │   │       ├── SalesPage.tsx
│   │   │   │       └── UsersPage.tsx
│   │   │   ├── services/api.ts            # Unified API Client & Session Manager
│   │   │   ├── theme.ts                   # Joy UI Theme tokens
│   │   │   └── types.ts                   # TypeScript models & constants
│   │   ├── package.json
│   │   ├── vercel.json                    # SPA routing rewrites
│   │   └── vite.config.ts
│   └── admin/          # Legacy standalone admin workspace (now merged into apps/pos)
├── backend/            # Express REST API, PostgreSQL connection pool, JWT & Role Auth (Port 4000)
├── database/           # PostgreSQL schema (schema.sql) and seed scripts
├── docker-compose.yml  # Docker multi-container stack
├── package.json        # NPM workspaces configuration
└── README.md
```

---

## 3. Technology Stack

* **Frontend UI**: [Joy UI](https://mui.com/joy-ui/getting-started/) (`@mui/joy`, `@emotion/react`, `@emotion/styled`)
* **Languages & Bundlers**: TypeScript 5, React 18, Vite 6
* **Desktop App**: Electron 33 with `electron-updater` and `electron-builder`
* **Routing**: `react-router-dom` v7 (SmartRouter: `BrowserRouter` for Web, `HashRouter` for packaged Electron)
* **Icons & QR**: `lucide-react`, `qrcode.react`
* **Realtime**: `socket.io-client` & Socket.IO server
* **Backend**: Node.js, Express, `pg` (PostgreSQL connection pool), `bcryptjs`, `jsonwebtoken`
* **Database**: PostgreSQL 14+
* **Strict Adherence**: Zero third-party state managers (no Zod, TanStack Query, or Zustand).

---

## 4. Default Testing Accounts & Roles

The database initialization script (`npm run db:init`) securely seeds the following development test accounts with bcrypt-hashed passwords without overwriting existing production accounts:

| Role | Username | Password | Post-Login Redirection | Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | `/admin/dashboard` | Full administrative control (Products, Categories, Tables, Sales reports, User management) + access to POS Terminal (`/pos`) |
| **Cashier** | `cashier` | `cashier123` | `/pos/orders` | POS Terminal operations (view orders, counter walk-ins, process payments, print thermal receipts, shift dashboard) |

---

## 5. Role-Based Routing & Access Control

| Route | Role Access | Description |
| :--- | :--- | :--- |
| `/login` | Public | Single unified login form with password show/hide toggle and quick-fill helper chips |
| `/` | Authenticated | Automatically redirects to `/admin` for Admins and `/pos` for Cashiers |
| `/admin` & `/admin/dashboard` | **Admin Only** | Executive metrics, daily revenue, payment method breakdown |
| `/admin/products` | **Admin Only** | Menu & drink inventory, prices, availability toggling |
| `/admin/categories` | **Admin Only** | Category catalog ordering and active statuses |
| `/admin/tables` | **Admin Only** | Table QR code generation, SVG download, stand card printing |
| `/admin/sales` | **Admin Only** | Historical ledger, time filters, CSV export |
| `/admin/users` | **Admin Only** | Cashier and Admin staff management, password updates |
| `/pos` & `/pos/orders` | **Cashier & Admin** | Live incoming table QR orders, status filters, walk-in counter orders |
| `/pos/dashboard` | **Cashier & Admin** | Cashier shift metrics (today's sales, pending counter count) |

* Unauthenticated users attempting to access protected pages are redirected to `/login`.
* Cashier accounts attempting to access `/admin/*` are blocked and redirected to `/pos`.
* Admin accounts are permitted to open and operate the POS Terminal (`/pos`).
* The backend independently validates JWT role claims on all API endpoints via `requireAdmin` and `requireCashierOrAdmin`.

---

## 6. Setup & Running Locally

### Prerequisites
* Node.js v18+ (tested on v24)
* PostgreSQL 14+ running locally (default: `localhost:5433` or `localhost:5432`)

### 1. Configure Environment Variables
Edit `backend/.env`:
```env
PORT=4000
DATABASE_URL=postgresql://postgres:root@localhost:5433/bar_pos
JWT_SECRET=super_secret_bar_pos_jwt_key_2026_dev
NODE_ENV=development
```

Edit `apps/pos/.env`:
```env
# For local development:
VITE_API_BASE_URL=/api/v1

# For production / separate backend host:
# VITE_API_BASE_URL=https://your-backend-api.onrender.com/api/v1
```

### 2. Initialize Database & Seed Accounts
Run the initialization script to prepare PostgreSQL tables and seed default admin/cashier accounts:
```bash
npm run db:init
```

### 3. Build All Packages
```bash
npm run build:all
```

### 4. Run Development Servers
To run backend, customer app, and the unified POS/Admin application concurrently:
```bash
npm run dev
# or: npm run dev:all
```

Or start each service individually:
```bash
# Terminal 1 - Backend REST API (Port 4000)
npm run dev:backend

# Terminal 2 - Unified BarPOS Frontend (Port 3002)
npm run dev:pos

# Terminal 3 - Customer QR Ordering App (Port 3001)
npm run dev:customer
```

---

## 7. Electron Desktop Application

The native Electron Windows application runs the **same unified frontend** with both Admin and Cashier accounts supported.

### Development Mode
```bash
npm run electron:dev
# or: npm run --workspace=apps/pos electron:dev
```

### Building the Windows `.exe`
```bash
npm run electron:dist
# or: npm run --workspace=apps/pos electron:dist
```

Outputs generated in `apps/pos/release/`:
* **`BarPOS Terminal Setup 1.0.0.exe`**: Full NSIS installer with desktop & Start Menu shortcuts.
* **`BarPOS Terminal 1.0.0.exe`**: Standalone portable `.exe` requiring no installation.
* **`win-unpacked/BarPOS Terminal.exe`**: Pre-extracted binary folder for instant testing.

---

## 8. Vercel Frontend Deployment

Deploy the single unified frontend to Vercel:

1. **Connect Repository**: Import the `BarPOS` GitHub repository into Vercel.
2. **Project Settings**:
   * **Root Directory**: `apps/pos`
   * **Framework Preset**: `Vite`
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
   * **Install Command**: `npm install`
3. **Environment Variables**:
   * `VITE_API_BASE_URL`: Set to your deployed Render backend API URL (e.g., `https://barpos-backend.onrender.com/api/v1`).
4. **SPA Rewrites**:
   Handled automatically by `apps/pos/vercel.json`:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```
   Ensures deep links (`/login`, `/admin/dashboard`, `/pos/orders`) load properly without 404 errors on refresh.

---

## 9. Testing & Acceptance Verification

All acceptance criteria have been verified:

* **Authentication**:
  * Admin credentials (`admin` / `admin123`) authenticate and redirect to `/admin`.
  * Cashier credentials (`cashier` / `cashier123`) authenticate and redirect to `/pos`.
  * Invalid credentials return `401 Unauthorized`.
  * Show/hide password eye toggle verified.
  * Role enforcement prevents Cashiers from accessing Admin features (returns `403 Forbidden`).
  * Admins can seamlessly switch between Admin Portal and POS Terminal.
  * Session expiration automatically redirects to `/login`.
* **POS Terminal**:
  * Product loading, cart creation, walk-in counter orders, payment processing (Cash, GCash, Card), thermal receipts (80mm standard), and sales persistence in PostgreSQL verified.
* **Customer QR Ordering**:
  * Customers place orders from Table QR codes (`/order/table/:number`) without authentication.
  * Orders appear in real time on the POS Terminal with unique reference codes (`T1-XXXX`).
  * Idempotency protects against duplicate order submissions.
