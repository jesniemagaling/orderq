# OrderQ

**A QR Code–Based Ordering System for Dine-In Restaurants**

OrderQ is a full-stack, web-based QR ordering system that allows dine-in customers to scan a table QR code, browse a digital menu, place orders, track order status, and view digital receipts — all without installing a mobile app.

The entire system is containerized using Docker for easy setup and consistent deployment.

---

## System Overview

OrderQ is composed of three main applications:

* **Customer Web App** – QR-based menu browsing and ordering
* **Admin Dashboard** – Order, menu, table, and payment management
* **Backend API** – Business logic, database operations, and order processing

---

## Tech Stack

### Frontend (Customer App)

* Vite
* React + TypeScript
* Tailwind CSS

### Admin Dashboard

* Vite
* React + TypeScript
* Tailwind CSS

### Backend API

* Node.js
* Express.js
* MySQL 8

### Infrastructure

* Docker & Docker Compose
* phpMyAdmin

---

## Key Features

* QR code–based table ordering (no app installation required)
* Digital menu browsing with search and cart management
* Real-time order status tracking (Pending → Preparing → Served)
* Digital receipts and flexible payment flow (cash or online)
* Admin dashboard for managing orders, menus, and table status
* Kitchen view for order preparation tracking
* Fully containerized development and deployment setup

---

## Project Structure

```bash
orderq/
├── backend/        # Node.js + Express API
├── frontend/       # Customer web app
├── admin/          # Admin dashboard
├── docker-compose.yml
└── README.md
```

---

## Getting Started (Docker Setup)

### Prerequisites

* Docker
* Docker Compose

### Clone the Repository

```bash
git clone https://github.com/jesniemagaling/orderq.git
cd orderq
```

### Run the Application

```bash
docker compose up --build
```

This will start:

* Backend API
* MySQL database
* phpMyAdmin
* Frontend customer app
* Admin dashboard

---

## Access the Application

| Service         | URL                                            |
| --------------- | ---------------------------------------------- |
| Customer App    | [http://localhost:5173](http://localhost:5173) |
| Admin Dashboard | [http://localhost:5174](http://localhost:5174) |
| Backend API     | [http://localhost:5000](http://localhost:5000) |
| phpMyAdmin      | [http://localhost:8080](http://localhost:8080) |

---

## Database Management

* MySQL runs inside a Docker container
* phpMyAdmin is included for easy database inspection
* Database credentials are defined using environment variables

---

## Development Notes

* The system uses a REST API architecture
* Table-specific QR codes link customers to ordering sessions
* Order status updates are reflected across customer, admin, and kitchen views
* Built following Agile/Scrum methodology

---

## Capstone Project

OrderQ was developed as a **Bachelor of Science in Information Technology** capstone project at **La Consolacion University Philippines** and evaluated using **ISO/IEC 25010:2023** software quality standards.
