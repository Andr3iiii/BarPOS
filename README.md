# The Velvet Tap — Bar Point-of-Sale (POS) System

A modern, fast, and reliable Bar Point-of-Sale (POS) System built with **React**, **TypeScript**, **Vite**, **Joy UI**, **Electron**, and **PostgreSQL**.

---

## 1. Core Order Workflow

```text
Table 1
   ↓
Customer scans Table 1 QR (/order/table/1)
   ↓
Mobile ordering page
   ↓
Customer browses menu & adds drinks/food to cart
   ↓
Customer submits order
   ↓
System generates atomic Order Reference (e.g. T1-1001)
   ↓
Order immediately appears on Cashier Desktop POS (live sync)
   ↓
Customer proceeds to counter and provides reference number
   ↓
Cashier searches/opens order on POS
   ↓
Cashier confirms items & chooses payment method (Cash, GCash, Card)
   ↓
For Cash: Change is automatically computed (insufficient cash is blocked)
   ↓
Cashier confirms payment → Order & Payment marked PAID
   ↓
80mm thermal receipt generated and printed
```

> **Important Scope Rule:** This system is **NOT** a table management system. Tables are only identifiers for where an order originated via the table's QR code. Multiple separate orders can originate from the same table without occupancy monitoring.

---

## 2. Monorepo Structure

```text
BarPOS/
├── apps/
│   ├── customer/       # Mobile-first customer QR ordering web app (Port 3001)
│   ├── pos/            # Cashier Desktop POS (Electron + Joy UI) (Port 3002)
│   └── admin/          # Admin portal for products, categories, tables, sales (Port 3003)
├── backend/            # Express REST API, PostgreSQL pool, JWT auth (Port 4000)
├── database/           # PostgreSQL schema (schema.sql) and seed scripts
├── package.json        # NPM workspaces configuration
└── README.md
```

---

## 3. Technology Stack

* **Frontend UI**: [Joy UI](https://mui.com/joy-ui/getting-started/) (`@mui/joy`, `@emotion/react`, `@emotion/styled`)
* **Languages & Bundlers**: TypeScript, React 18, Vite
* **Desktop App**: Electron with `electron-updater` and `electron-builder`
* **Routing & Forms**: `react-router-dom`, `react-hook-form`
* **Icons & QR**: `lucide-react`, `qrcode.react`
* **Backend**: Node.js, Express, `pg` (PostgreSQL connection pool), `bcryptjs`, `jsonwebtoken`
* **Database**: PostgreSQL 14+
* **Strict Adherence**: No Zod, No TanStack Query, No Zustand (simple native fetch and React state).

---

## 4. Default Credentials & Ports

| Application | URL / Port | Role / Path | Default Credentials |
| :--- | :--- | :--- | :--- |
| **Backend API** | `http://localhost:4000` | `/api/v1` | N/A |
| **Customer App** | `http://localhost:3001` | `/order/table/1` | Public (No login needed) |
| **Cashier POS** | `http://localhost:3002` | `/orders`, `/dashboard` | `cashier` / `cashier123` |
| **Admin Portal**| `http://localhost:3003` | `/dashboard`, `/products`| `admin` / `admin123` |

---

## 5. Setup & Running Locally

### Prerequisites
* Node.js v18+ (tested on v24)
* PostgreSQL 14+ running locally (default: `localhost:5433` or `localhost:5432`)

### 1. Configure Database Connection
Edit `backend/.env` with your PostgreSQL credentials:
```env
PORT=4000
DATABASE_URL=postgresql://postgres:root@localhost:5433/bar_pos
JWT_SECRET=super_secret_bar_pos_jwt_key_2026_dev
NODE_ENV=development
```

### 2. Initialize Database Tables & Initial Seed Data
Run the migration script to create all tables, seed products, categories, tables, and default accounts:
```bash
npm run db:init
```

### 3. Build All Packages
```bash
npm run build:all
```

### 4. Run All Services Concurrently
```bash
npm run dev
# or: npm run dev:all
```
Or start each service individually:
```bash
# Terminal 1 - Backend API (Port 4000)
npm run dev:backend

# Terminal 2 - Customer Mobile App (Port 3001)
npm run dev:customer

# Terminal 3 - Cashier POS Web Terminal (Port 3002)
npm run dev:pos

# Terminal 4 - Admin Web App (Port 3003)
npm run dev:admin
```

### 5. Run Cashier Desktop Application (Electron)
To launch the native Windows Electron window:
```bash
npm run electron:dev
```
To build the installable Windows NSIS installer (`.exe`):
```bash
npm run --workspace=apps/pos electron:dist
```

---

## 6. Docker Deployment (All-in-One)

You can run the entire Bar POS system (PostgreSQL database, Backend API, Customer Web App, Cashier POS Web App, and Admin Portal) in isolated containers with a single command:

### Prerequisites
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### 1. Build and Start All Containers
```bash
docker compose up -d --build
```

### 2. Services & Port Mappings
| Service | Container Name | Port | Description |
| :--- | :--- | :--- | :--- |
| **Customer App** | `barpos-customer` | [`http://localhost:3001`](http://localhost:3001) | Mobile QR ordering page (`/order/table/1`) |
| **Cashier POS** | `barpos-pos` | [`http://localhost:3002`](http://localhost:3002) | Cashier Web POS terminal (`/orders`) |
| **Admin Portal** | `barpos-admin` | [`http://localhost:3003`](http://localhost:3003) | Admin management portal (`/dashboard`) |
| **Backend API** | `barpos-backend` | [`http://localhost:4000`](http://localhost:4000) | Express REST API & Health check (`/api/health`) |
| **PostgreSQL** | `barpos-postgres` | `localhost:5434` | PostgreSQL 16 database with persistent volume |

### 3. Management Commands
```bash
# View live logs
docker compose logs -f

# Check container health status
docker compose ps

# Stop all containers
docker compose down

# Stop all containers and reset database volume
docker compose down -v
```

---

## 7. Applications Overview

### 📱 Customer Mobile App (`apps/customer`)
* Accessed directly via table QR: `http://localhost:3001/order/table/1` (Table 1 .. 10).
* Categorized menu with search (Draft Beers, Craft Cocktails, Spirits, Bites, Main Plates, Non-Alcoholic).
* Cart drawer with quantity steppers (+/-) and optional customer special notes.
* Order submission generates atomic unique reference number (e.g. `T1-1001`).
* **Order Confirmed screen**: Displays reference number prominently with instructions: *"Please proceed to the counter and provide your order number to the cashier for payment."*
* Automatically polls backend to display a celebratory **"Payment Confirmed"** badge once the cashier marks the order paid!

### 💻 Cashier Desktop POS (`apps/pos`)
* Built with Electron + Joy UI for desktop screens (1366x768, 1440x900, 1920x1080).
* **Live Orders Screen**:
  * Real-time polling every 3 seconds with visual sync indicator.
  * Instant search bar by Order Reference (e.g. `T1-1001`, `1001`) or Table number.
  * Status filter chips (All, Pending, Paid, Cancelled).
  * Direct "Counter Order" button for walk-in patrons ordering directly at the bar without a table QR.
* **Payment Processing**:
  * Payment method selection: **Cash**, **GCash**, **Card**.
  * For Cash: Auto-calculates change with quick-cash presets (Exact, ₱100, ₱200, ₱500, ₱1,000, ₱2,000). Blocks confirmation if cash received is insufficient.
  * For GCash/Card: Records reference number.
* **Receipt Engine**:
  * Formatted thermal receipt preview (80mm standard).
  * `window.print()` integration with CSS `@media print` thermal formatting.
  * Copy text receipt option.

### 🛡️ Admin Web App (`apps/admin`)
* **Executive Dashboard**: Today's sales, average ticket, pending counter orders, cash vs GCash vs Card breakdown.
* **Product Catalog**: Add drinks/food, set prices, assign categories, toggle availability, deactivate unused items.
* **Category Manager**: Add, reorder display sequence, and deactivate categories.
* **Tables & QR Codes**: Add table identifiers, view QR codes, download SVGs, and print styled table stand cards.
* **Sales & Ledger**: Filter transactions by Today, Yesterday, This Week, This Month, or Custom Range. Export records to CSV.
* **User Management**: Add cashiers and administrators, toggle active status, and reset passwords with bcrypt hashing.

---

## 7. Security & Architecture
* **Database Isolation**: Desktop POS connects only to Backend REST API. PostgreSQL credentials are never exposed to clients.
* **Persistence Guarantee**: Reinstalling or updating the Electron POS does not affect PostgreSQL database data.
* **Data Auditing**: Product deletion is blocked if items are attached to historical sales; deactivation is enforced instead.
