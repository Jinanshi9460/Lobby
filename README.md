<div align="center">

# LOBBy — Campus Marketplace

**A full-stack multi-vendor marketplace for college campuses** — students shop, vendors sell, admins govern.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](https://expressjs.com/)

[Architecture](#-system-architecture) · [Database](#-database) · [Process Flows](#-process-flows) · [Quick Start](#-quick-start) · [Demo Accounts](#-demo-accounts)

</div>

---

## Overview

**LOBBy** connects **students**, **approved vendors**, and **platform admins** on one campus marketplace. Students browse multi-vendor shops, pay with **Razorpay**, and track orders. Vendors manage shops and products after admin approval. Admins govern vendors, listings, analytics, and helpdesk tickets.

---

## System Architecture

LOBBy uses a **Node.js + Express** REST API with **MongoDB Atlas**, serving a **React (Vite) Single Page Application**. Payments run through **Razorpay**; images use **Cloudinary**; email alerts use **SMTP**.

```mermaid
flowchart TB
    subgraph Users["Campus Users"]
        direction TB
        STU["Student"]
        VEN["Vendor"]
        ADM["Admin"]
    end

    subgraph Client["Client · Web Browser"]
        direction TB
        SPA["React SPA · Vite"]
        RQ["React Query + Axios"]
        UI["Tailwind CSS · MUI"]
    end

    subgraph Backend["Backend Server · Node.js + Express"]
        direction TB
        ROUTER["API Router · /api"]
        AUTH["JWT + Google OAuth"]
        SOCKET["Socket.io · Chat"]
        DB[(MongoDB Atlas)]
    end

    subgraph External["External Services"]
        direction TB
        RZR["Razorpay"]
        CLD["Cloudinary"]
        GGL["Google OAuth"]
        MAIL["Gmail SMTP"]
    end

    STU --> SPA
    VEN --> SPA
    ADM --> SPA

    SPA -->|"REST API Calls (JWT)"| ROUTER
    SPA -->|"WebSocket"| SOCKET

    ROUTER --> AUTH
    AUTH --> DB
    ROUTER --> DB
    SOCKET --> DB

    ROUTER -->|"POST orders / verify"| RZR
    ROUTER -->|"Upload product images"| CLD
    AUTH -->|"Verify ID token"| GGL
    ROUTER -->|"Vendor / login alerts"| MAIL
```

---

## Process Flows

### Process Flow: Student Login to Dashboard

```mermaid
sequenceDiagram
    participant Student
    participant Frontend as React Frontend
    participant API as LOBBy API
    participant DB as MongoDB

    Student->>Frontend: Open /login
    Student->>Frontend: Submit email + password OR Google sign-in

    Frontend->>API: POST /api/auth/login OR /api/auth/google

    API->>API: Validate college email (.edu / .ac.in + allowlist)

    alt Invalid credentials or email domain
        API-->>Frontend: 401 Unauthorized
        Frontend-->>Student: Show error
    else Valid student
        API->>DB: Find user · issue JWT + refresh token
        API-->>Frontend: 200 OK + tokens + role
        Frontend-->>Student: Redirect to /customer
    end
```

---

### Process Flow: Browse Shop to Cart

```mermaid
sequenceDiagram
    participant Student
    participant Frontend as React Frontend
    participant API as LOBBy API
    participant DB as MongoDB

    Student->>Frontend: Browse /shops and /products
    Frontend->>API: GET /api/shops · GET /api/products

    API->>DB: Fetch shops and products
    DB-->>API: Listings (includes closed shops as view-only)
    API-->>Frontend: 200 OK

    Student->>Frontend: Add product to cart
    Frontend->>API: POST /api/orders/cart (or cart endpoint)

    API->>DB: Check shop isOpen · vendor isApproved · stock

    alt Shop closed OR vendor not approved OR out of stock
        API-->>Frontend: 400 Unavailable at this moment
        Frontend-->>Student: Show unavailable message
    else Available
        API->>DB: Update cart
        API-->>Frontend: 200 OK
        Frontend-->>Student: Cart updated
    end
```

---

### Process Flow: Checkout to Razorpay Payment

```mermaid
sequenceDiagram
    participant Student
    participant Frontend as React Frontend
    participant API as LOBBy API
    participant RZ as Razorpay
    participant DB as MongoDB

    Student->>Frontend: Open /checkout
    Frontend->>API: POST /api/orders (create order)

    API->>DB: Validate cart items and availability

    alt Invalid cart or unavailable items
        API-->>Frontend: 400 Bad Request
        Frontend-->>Student: Cannot checkout
    else Valid order
        API->>DB: Save order (pending)
        API->>RZ: Create Razorpay order
        RZ-->>API: order_id
        API-->>Frontend: order_id + Razorpay key

        Frontend->>RZ: Open Razorpay checkout popup
        Student->>RZ: Complete test payment
        RZ-->>Frontend: payment_id + signature

        Frontend->>API: POST /api/orders/verify

        alt Invalid signature
            API-->>Frontend: 400 Payment verification failed
            Frontend-->>Student: Payment failed
        else Valid signature
            API->>DB: Mark order as paid
            API-->>Frontend: 200 OK { success: true }
            Frontend-->>Student: Order confirmed · /orders
        end
    end
```

---

### Process Flow: Vendor Registration to Approval

```mermaid
sequenceDiagram
    participant Vendor
    participant Frontend as React Frontend
    participant API as LOBBy API
    participant DB as MongoDB
    participant Admin
    participant Mail as SMTP

    Vendor->>Frontend: Register at /vendor/register
    Frontend->>API: POST /api/auth/register (role: vendor)

    API->>API: Validate college email

    alt Email not allowed
        API-->>Frontend: 400 Invalid college email
    else Valid registration
        API->>DB: Create user + vendor (isApproved: false)
        API-->>Frontend: 201 Pending approval (no auto-login)
        Frontend-->>Vendor: Await admin approval

        Admin->>Frontend: Open /admin dashboard
        Admin->>Frontend: Approve or reject vendor
        Frontend->>API: PUT /api/admin/vendors/:id

        alt Admin rejects
            API->>DB: Update vendor status
            API->>Mail: Send rejection email
            API-->>Frontend: 200 OK
        else Admin approves
            API->>DB: Set isApproved: true
            API->>Mail: Send approval email
            API-->>Frontend: 200 OK
            Vendor->>Frontend: Login at /vendor/login
            Frontend->>API: POST /api/auth/login
            API-->>Frontend: JWT · access vendor dashboard
        end
    end
```

---

### Process Flow: Admin Governance

```mermaid
flowchart TD
    A["Admin logs in · /admin/login"] --> B["Admin Dashboard"]
    B --> C{"Select action"}

    C --> D["Approve / Reject / Remove vendor"]
    C --> E["Open / Close shop"]
    C --> F["Enable / Disable product"]
    C --> G["Export CSV · date range"]
    C --> H["Manage helpdesk tickets"]

    D --> I["Email notification to vendor"]
    E --> J["Shop stays visible · not orderable if closed"]
    F --> K["Product stays visible · unavailable if disabled"]
    G --> L["Download platform metrics + orders"]
    H --> M["Update ticket: open · in progress · resolved"]
```

---

### Process Flow: Helpdesk Ticket

```mermaid
sequenceDiagram
    participant User as Student / Vendor / Guest
    participant Frontend as React Frontend
    participant API as LOBBy API
    participant DB as MongoDB
    participant Admin

    User->>Frontend: Open /helpdesk · submit form
    Frontend->>API: POST /api/helpdesk

    API->>DB: Create HelpdeskTicket (status: open)
    API-->>Frontend: 201 Created
    Frontend-->>User: Ticket submitted

    Admin->>Frontend: View tickets in admin panel
    Frontend->>API: GET /api/helpdesk/admin
    API->>DB: Fetch all tickets
    DB-->>API: Ticket list
    API-->>Frontend: 200 OK

    Admin->>Frontend: Update status
    Frontend->>API: PUT /api/helpdesk/admin/:id
    API->>DB: status → in_progress OR resolved
    API-->>Frontend: 200 OK
```

---

### Database Entity Relationships

```mermaid
erDiagram
    USER ||--o| VENDOR : owns
    VENDOR ||--|{ SHOP : operates
    SHOP ||--|{ PRODUCT : lists
    USER ||--o{ ORDER : places
    ORDER ||--|{ ORDER_ITEM : contains
    PRODUCT ||--o{ ORDER_ITEM : included_in
    USER ||--o| CART : has
    USER ||--o| WISHLIST : has
    USER ||--o{ HELPDESK_TICKET : submits
    ORDER ||--o| PAYMENT : has
```

---

## Features

| Role | Capabilities |
|------|----------------|
| **Student** | College email + Google OAuth, browse shops/products, cart, Razorpay checkout, orders, wishlist, chat, helpdesk |
| **Vendor** | Register (pending approval), multi-shop dashboard, product CRUD, Cloudinary images, CSV export |
| **Admin** | Secure login only, vendor approval, shop/product toggles, stats, CSV export, helpdesk |

---

## Tech Stack

| Layer | Technologies |
|-------|----------------|
| Frontend | React 18, Vite, Tailwind, TanStack Query, React Router, MUI, Recharts |
| Backend | Node.js, Express, Mongoose, JWT, Socket.io, Helmet, rate-limit |
| Database | MongoDB Atlas |
| Payments | Razorpay (test mode) |
| Media | Cloudinary |
| Auth | Email/password, Google OAuth, college domain allowlist |

---

## Database

LOBBy stores all application data in **MongoDB** (recommended: **MongoDB Atlas**). The backend uses **Mongoose** ODM; connection logic is in `backend/src/config/db.js`.

### Connection

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | Full connection string (Atlas or local). Example: `mongodb+srv://user:pass@cluster.mongodb.net/lobby` |
| `MONGO_DNS_SERVERS` | Optional DNS override (default `8.8.8.8,1.1.1.1`) if Atlas SRV lookup fails |

If `MONGO_URI` is not set, the API falls back to:

```text
mongodb://127.0.0.1:27017/lobby
```

Copy `backend/.env.example` → `backend/.env` and set your Atlas URI before running the server.

### Health check

```http
GET http://localhost:5000/health
```

Returns `database: connected` when MongoDB is reachable.

### Collections (Mongoose models)

| Model | File | Purpose |
|-------|------|---------|
| `User` | `backend/src/models/User.js` | Students, vendors, admins (role field) |
| `Vendor` | `backend/src/models/Vendor.js` | Vendor profile, `isApproved` |
| `Shop` | `backend/src/models/Shop.js` | Vendor shops, `isOpen` |
| `Product` | `backend/src/models/Product.js` | Catalog items, stock, images |
| `Category` | `backend/src/models/Category.js` | Product categories |
| `Order` | `backend/src/models/Order.js` | Student orders |
| `Payment` | `backend/src/models/Payment.js` | Razorpay payment records |
| `Cart` | `backend/src/models/Cart.js` | Shopping cart per user |
| `Wishlist` | `backend/src/models/Wishlist.js` | Saved products |
| `Review` | `backend/src/models/Review.js` | Product reviews |
| `Chat` / `Message` | `backend/src/models/Chat.js`, `Message.js` | Real-time messaging |
| `Notification` | `backend/src/models/Notification.js` | User notifications |
| `HelpdeskTicket` | `backend/src/models/HelpdeskTicket.js` | Support tickets |

### Entity diagram

See **[Database Entity Relationships](#database-entity-relationships)** under Process Flows for the ER diagram.

### Seed data

Populate demo users, shops, and products:

```bash
cd backend
npm run seed              # Upsert demo data (safe)
npm run seed -- --reset   # Wipe users, vendors, shops, products first
```

---

## Project Structure

```
try/
├── backend/          # Express API + models + routes
├── frontend/         # React SPA
├── docs/
│   ├── diagrams/     # Optional SVG exports
│   └── screenshots/  # UI screenshots for README
└── README.md
```

---

## Quick Start

### Prerequisites

Node.js 18+, MongoDB Atlas, Razorpay test keys, Google OAuth (optional), Cloudinary, Gmail SMTP (optional).

### Install and run

```bash
git clone https://github.com/YOUR_USERNAME/lobby-campus-marketplace.git
cd lobby-campus-marketplace

cd backend && npm install && cp .env.example .env
cd ../frontend && npm install && cp .env.example .env

cd backend && npm run dev    # http://localhost:5000
cd frontend && npm run dev   # http://localhost:5173
```

### Seed demo data

```bash
cd backend
npm run seed              # Safe upsert
npm run seed -- --reset   # Clears users, vendors, shops, products
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:5000 |
| Health | http://localhost:5000/health |
| API docs | http://localhost:5000/api/docs |

### Environment variables

**Backend** (`backend/.env`) — see also [Database](#-database) for `MONGO_URI` / `MONGO_DNS_SERVERS`:

`MONGO_URI`, `MONGO_DNS_SERVERS`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `GOOGLE_CLIENT_ID`, `COLLEGE_EMAIL_ALLOWLIST`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `CLOUDINARY_*`, `SMTP_*`, `CLIENT_URL`, `ADMIN_LOGIN_SECRET`

**Frontend** (`frontend/.env`): `VITE_API_BASE_URL`, `VITE_GOOGLE_CLIENT_ID`, `VITE_RAZORPAY_KEY_ID`

---

## API Overview

| Prefix | Purpose |
|--------|---------|
| `/api/auth` | Login, register, Google OAuth, tokens |
| `/api/users` | Profile, settings |
| `/api/vendors` | Dashboard, shops, products, CSV |
| `/api/admin` | Stats, approvals, toggles, CSV |
| `/api/shops` | Shop listings |
| `/api/products` | Catalog, search |
| `/api/orders` | Cart, checkout, Razorpay verify |
| `/api/chat` | Messaging |
| `/api/notifications` | Alerts |
| `/api/helpdesk` | Support tickets |

---

## Demo Accounts

> Development only. Change passwords before production.

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@lobby.com` | `AdminPass123` | Admin Key - `Access123`
| Vendor | `vendor@lobby.com` | `VendorPass123` |
| Student | `user@uni.edu.in` | `Demo1234` |

| Portal | Route |
|--------|-------|
| Admin | `/admin/login` |
| Vendor | `/vendor/login` |
| Student | `/login` |

---


<div align="center">

**LOBBy** · Campus Market · MERN + Razorpay

</div>
