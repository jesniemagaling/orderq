# OrderQ

OrderQ is a full-stack, QR code-based ordering system for dine-in restaurants. Customers scan a table QR code to browse menus, place orders, track order status, and view receipts without installing a mobile app.

<p align="left">
	<img alt="React" src="https://img.shields.io/badge/React-19-61dafb?logo=react">
	<img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript">
	<img alt="Vite" src="https://img.shields.io/badge/Vite-7-646cff?logo=vite">
	<img alt="Node.js" src="https://img.shields.io/badge/Node.js-20-339933?logo=nodedotjs">
	<img alt="Express" src="https://img.shields.io/badge/Express-5-black?logo=express">
	<img alt="MySQL" src="https://img.shields.io/badge/MySQL-8-4479a1?logo=mysql">
	<img alt="Docker" src="https://img.shields.io/badge/Docker-Compose-2496ed?logo=docker">
</p>

## Table of Contents

- [Project Overview](#project-overview)
- [Screenshots](#screenshots)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [Development Commands](#development-commands)
- [Deployment Notes](#deployment-notes)
- [Capstone Context](#capstone-context)

## Project Overview

OrderQ is built for restaurants that want a faster and cleaner dine-in workflow:

1. A customer scans a table QR code.
2. The customer enters a session-bound ordering flow.
3. Orders are created in real time and tracked across customer and admin interfaces.
4. Staff can manage menu, tables, and payment states from the dashboard.
5. Kitchen/admin teams update order status from Pending to Preparing to Served.

The repository contains three coordinated apps:

- Customer Web App (frontend)
- Admin Dashboard (admin)
- Backend API (backend)

## Screenshots

### Customer App

<p align="left">
	<img src="docs/images/customer-app/home.jpg" alt="Customer app home" width="32%" />
	<img src="docs/images/customer-app/search.jpg" alt="Customer app search" width="32%" />
	<img src="docs/images/customer-app/menu.jpg" alt="Customer app menu" width="32%" />
</p>

<p align="left">
	<img src="docs/images/customer-app/food_details.jpg" alt="Customer app food details" width="32%" />
	<img src="docs/images/customer-app/cart.jpg" alt="Customer app cart" width="32%" />
	<img src="docs/images/customer-app/payment_method.jpg" alt="Customer app payment method" width="32%" />
</p>

<p align="left">
	<img src="docs/images/customer-app/orders.jpg" alt="Customer app order history" width="32%" />
	<img src="docs/images/customer-app/orders_canceled.jpg" alt="Customer app canceled order history" width="32%" />
	<img src="docs/images/customer-app/status_pending.jpg" alt="Customer app order status pending" width="32%" />
</p>

<p align="left">
	<img src="docs/images/customer-app/status_confirmed.jpg" alt="Customer app order status confirmed" width="32%" />
	<img src="docs/images/customer-app/status_served.jpg" alt="Customer app order status served" width="32%" />
	<img src="docs/images/customer-app/digital_receipt.jpg" alt="Customer app digital receipt" width="32%" />
</p>

### Admin Dashboard

#### Overview

<img src="docs/images/admin/1-overview.png" alt="Admin overview" width="100%" />

#### Sales - Main

<img src="docs/images/admin/1.2-sales-tab.png" alt="Admin sales tab" width="100%" />
<br />
<img src="docs/images/admin/1.3-sales-tab-details.png" alt="Admin sales tab order details" width="100%" />

#### Daily Income

<img src="docs/images/admin/2-daily-income.png" alt="Admin daily income" width="100%" />

#### Sales Per Day

<img src="docs/images/admin/3-sales-per-day.png" alt="Admin sales per day" width="100%" />

#### Sales Summary

<img src="docs/images/admin/4-sales-summary.png" alt="Admin sales summary" width="100%" />

#### Orders Per Table

<img src="docs/images/admin/5-orders-per-table.png" alt="Admin orders per table" width="100%" />

#### Orders Per Day

<img src="docs/images/admin/6-orders-per-day.png" alt="Admin orders per day" width="100%" />

#### Item Sales / Top Selling

<img src="docs/images/admin/7-item-sales.png" alt="Admin item sales top selling" width="100%" />

#### Category Sales

<img src="docs/images/admin/8-category-sales.png" alt="Admin category sales" width="100%" />

#### Payment Method Breakdown

<img src="docs/images/admin/9-payment-method-breakdown.png" alt="Admin payment method breakdown" width="100%" />

#### Hourly Heatmap

<img src="docs/images/admin/10-hourly-heatmap.png" alt="Admin hourly heatmap" width="100%" />

#### Menu and Audit

<img src="docs/images/admin/11-menu-tab.png" alt="Admin menu tab" width="100%" />
<br />
<img src="docs/images/admin/12-menu-history.png" alt="Admin menu history" width="100%" />
<br />
<img src="docs/images/admin/13-add-menu.png" alt="Admin add menu" width="100%" />
<br />
<img src="docs/images/admin/14-edit-menu.png" alt="Admin edit menu" width="100%" />

### Cashier Dashboard

#### Tables and Incoming Orders

<img src="docs/images/cashier/1-Cashier Tables.png" alt="Cashier tables" width="100%" />
<br />
<img src="docs/images/cashier/2-receive-order.png" alt="Cashier receive order" width="100%" />
<br />
<img src="docs/images/cashier/3-receive-order-confirmed.png" alt="Cashier receive order confirmed" width="100%" />
<br />
<img src="docs/images/cashier/4-tables-additional-order.png" alt="Cashier additional order in table" width="100%" />

#### Orders and Audit

<img src="docs/images/cashier/5-orders-tab.png" alt="Cashier orders tab" width="100%" />
<br />
<img src="docs/images/cashier/6-orders-tab-details.png" alt="Cashier order details" width="100%" />
<br />
<img src="docs/images/cashier/7-orders-tab-retract-logs.png" alt="Cashier retract logs" width="100%" />

### Kitchen / Operational View

<img src="docs/images/kitchen/Kitchen Oders.png" alt="Kitchen table queue" width="100%" />
<br />
<img src="docs/images/kitchen/receive-order.png" alt="Kitchen receive order" width="100%" />
<br />
<img src="docs/images/kitchen/receive-order(1).png" alt="Kitchen receive order done action" width="100%" />
<br />
<img src="docs/images/kitchen/receive-additional-order.png" alt="Kitchen receive additional order" width="100%" />

## Key Features

- QR code-based dine-in ordering with no app installation required
- Table session management for safe and isolated order flows
- Digital menu browsing with search and item filtering
- Cart and checkout workflow with receipt-ready order summaries
- Order lifecycle tracking (Pending -> Preparing -> Served)
- Admin dashboard for orders, menus, tables, and sales visibility
- Kitchen-oriented order handling for preparation workflows
- Optional PayPal integration for online payment scenarios
- Socket-based real-time updates across user interfaces
- Dockerized stack for consistent development setup

## Tech Stack

### Customer Frontend

- React 19 + TypeScript
- Vite
- Tailwind CSS
- Axios
- Socket.IO client

### Admin Dashboard

- React 19 + TypeScript
- Vite
- Tailwind CSS
- Chart.js / Recharts / XLSX export utilities
- Axios
- Socket.IO client

### Backend API

- Node.js 20
- Express 5
- MySQL 8 (mysql2)
- JWT + bcrypt authentication
- Joi / express-validator validation
- Socket.IO
- node-cron for scheduled session cleanup

### Infrastructure

- Docker + Docker Compose
- phpMyAdmin
- Render static deployment config (frontend)

## System Architecture

OrderQ follows a client-server architecture:

- Customer and admin clients consume REST endpoints from the backend (`/api/...`).
- Backend connects to MySQL for persistent data (users, tables, sessions, menu, orders).
- Session tokens are used to bind customer ordering activity to a table context.
- Real-time events propagate status changes to connected clients.

High-level request flow:

1. Customer scans table QR.
2. Frontend creates/verifies session token.
3. Customer places order through API.
4. Admin/Kitchen updates order status.
5. Updated status is reflected back to clients in real time.

## Project Structure

```bash
orderq/
├── backend/                # Express API, DB layer, controllers, routes
├── frontend/               # Customer ordering web app
├── admin/                  # Admin and kitchen dashboard
├── docker-compose.yml      # Full local stack (mysql, phpmyadmin, backend, frontend, admin)
├── render.yaml             # Static deployment settings (frontend)
└── README.md
```

## Getting Started

### Prerequisites

- Docker Desktop + Docker Compose (recommended)
- Node.js 20+ and npm (for non-Docker local workflow)

### 1) Clone the Repository

```bash
git clone https://github.com/jesniemagaling/orderq.git
cd orderq
```

### 2) Configure Environment Variables

Create a `.env` file in the project root (same level as `docker-compose.yml`) and set values described in [Environment Variables](#environment-variables).

### 3) Start with Docker (Recommended)

```bash
docker compose up --build
```

This starts MySQL, phpMyAdmin, backend API, customer app, and admin dashboard together.

### 4) Access Services

| Service         | URL                   |
| --------------- | --------------------- |
| Admin Dashboard | http://localhost:5173 |
| Customer App    | http://localhost:5174 |
| Backend API     | http://localhost:5000 |
| phpMyAdmin      | http://localhost:8080 |
| MySQL Host Port | localhost:3307        |

### Optional: Run Services Manually (Without Docker)

Use separate terminals:

```bash
# Backend
cd backend
npm install
npm run dev
```

```bash
# Customer app
cd frontend
npm install
npm run dev
```

```bash
# Admin dashboard
cd admin
npm install
npm run dev
```

## Environment Variables

### Root `.env` (used by Docker Compose)

```env
MYSQL_ROOT_PASSWORD=root
MYSQL_DATABASE=orderq_db
MYSQL_USER=orderq_user
MYSQL_PASSWORD=orderq_pass
```

### Backend Environment (`backend/.env` for non-Docker runs)

```env
PORT=5000

DB_HOST=localhost
DB_PORT=3307
DB_USER=orderq_user
DB_PASSWORD=orderq_pass
DB_NAME=orderq_db

JWT_SECRET=replace-with-strong-random-secret

FRONTEND_URL_1=http://localhost:5173
FRONTEND_URL_2=http://localhost:5174

BACKEND_URL=http://localhost:5000

PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_SECRET=your-paypal-secret
```

### Frontend/Admin Vite Environment

Set these in both `frontend/.env` and `admin/.env` when needed:

```env
VITE_API_URL=http://localhost:5000/api
VITE_BACKEND_URL=http://localhost:5000
```

## API Overview

The backend exposes REST endpoints under:

```text
http://localhost:5000/api
```

Main resource groups:

- `/menu` for menu browsing and management
- `/tables` for table state and QR-related operations
- `/sessions` for QR session creation/validation
- `/orders` for order creation, status updates, and payment workflow
- `/sales` for sales reporting endpoints
- `/auth` for admin authentication
- `/paypal` for payment integration handlers

For endpoint-level details, see `backend/API_DOCUMENTATION.md`.

## Development Commands

### Backend

```bash
cd backend
npm run dev      # Start with nodemon
npm start        # Start production-style node server
```

### Customer Frontend

```bash
cd frontend
npm run dev
npm run build
npm run lint
npm run preview
```

### Admin Dashboard

```bash
cd admin
npm run dev
npm run build
npm run lint
npm run preview
```

## Deployment Notes

- The repository includes `render.yaml` configured for static frontend deployment.
- Backend and database are containerized and can be deployed as separate services.
- Ensure production CORS origins and secrets are configured before release.
- Verify PayPal mode and credentials for sandbox vs production.

## Capstone Context

OrderQ was developed as a Bachelor of Science in Information Technology capstone project at La Consolacion University Philippines and evaluated using ISO/IEC 25010:2023 software quality standards.
