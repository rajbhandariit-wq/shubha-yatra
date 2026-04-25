# 🚌 शुभ यात्रा — Shubha Yatra

**Nepal's Premier Bus Ticket Reservation System**

A full-stack bus booking platform with three roles: Customer, Provider (Bus Operator), and Admin.

---

## ✨ Features

### 👤 Customer
- Search buses by source, destination & date — no login required
- Interactive visual seat map (2-2 layout)
- Book & pay with mock payment (Card, eSewa, Khalti, Bank Transfer)
- Receive booking confirmation via mock Email & SMS
- My Bookings: view, download ticket, cancel trips

### 🚌 Provider (Bus Operator)
- Dashboard: today's trips, occupancy, upcoming bookings
- Manage Buses — add/edit/delete with amenities
- Manage Routes — source, destination, fare, timing, stops
- Manage Schedules — assign bus+route+date
- Manage Staff — drivers, conductors with license tracking
- Messaging — send Email/SMS to passengers (delay alerts, cancellations)
- Reports — revenue by bus, by route, total analytics

### 🛡️ Admin (Super User)
- View all customers & providers with search/filter
- Reset any user's password
- Activate/Deactivate/Delete any user
- Platform Reports — customer spend, provider revenue, cancellation rates

---

## 🏗️ Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18 + Vite + Tailwind CSS      |
| Backend    | Node.js + Express.js                |
| Database   | PostgreSQL + Sequelize ORM          |
| Auth       | JWT (JSON Web Tokens)               |
| Email      | Nodemailer (mock / Ethereal)        |
| SMS        | Mock service (console log)          |
| Icons      | Lucide React                        |

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- PostgreSQL 14+ (or Docker)
- npm or yarn

---

### 1. Start Database

**Option A — Docker (Recommended):**
```bash
docker-compose up -d
```

**Option B — Manual PostgreSQL:**
Create a database named `shubha_yatra` and update `backend/.env` with your credentials.

---

### 2. Set Up Backend

```bash
cd backend
npm install
```

Edit `backend/.env` if needed (DB credentials, JWT secret).

**Sync DB & seed demo data:**
```bash
npm run seed
```

**Start backend server:**
```bash
npm run dev       # development (auto-reload)
# or
npm start         # production
```

Backend runs on → **http://localhost:5000**

---

### 3. Set Up Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on → **http://localhost:5173**

---

## 🔐 Demo Credentials

| Role     | Email                           | Password  |
|----------|---------------------------------|-----------|
| Admin    | admin@shubhayatra.com           | admin123  |
| Provider | provider1@shubhayatra.com       | pass123   |
| Provider | provider2@shubhayatra.com       | pass123   |
| Customer | customer1@example.com           | pass123   |

Click **Demo Accounts** on the Login page for one-click login.

---

## 📁 Project Structure

```
Shubh_Yatra_New/
├── backend/
│   ├── server.js                  # Express entry point
│   ├── .env                       # Environment variables
│   └── src/
│       ├── config/database.js     # Sequelize config
│       ├── models/                # User, Bus, Route, Schedule, Booking, Staff, Notification
│       ├── controllers/           # authController, customerController, providerController, adminController
│       ├── routes/                # auth, customer, provider, admin
│       ├── middleware/auth.js     # JWT auth + role check
│       ├── services/              # emailService, smsService (mock)
│       └── seeders/seed.js        # Demo data seeder
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx                # Routes & role-based protection
│       ├── contexts/AuthContext.jsx
│       ├── services/api.js        # All API calls (axios)
│       ├── components/            # Navbar, Footer, SeatMap, ProviderLayout, AdminLayout
│       └── pages/
│           ├── Home.jsx           # Landing page with rotating Nepal landmarks
│           ├── auth/              # Login, Register
│           ├── customer/          # SearchResults, SeatSelection, Payment, Ticket, MyBookings
│           ├── provider/          # Dashboard, Buses, Routes, Schedules, Bookings, Staff, Messaging, Reports
│           └── admin/             # Dashboard, Users, Reports
│
└── docker-compose.yml             # PostgreSQL container
```

---

## 🌄 Nepal Visual Theme

The app features rotating full-screen backgrounds from Nepal's iconic landmarks:
- **Swayambhunath** (Monkey Temple, Kathmandu)
- **Annapurna Range** (Pokhara Region)
- **Lumbini** (Buddha's Birthplace)
- **Pashupatinath Temple** (Kathmandu)

UI uses Nepal's flag colours — **Crimson Red (#DC143C)** and **Royal Blue (#003893)**.
Nepali script (देवनागरी) appears in key branding elements. Prayer flags animate in the footer.

---

## 📡 API Endpoints

| Group    | Endpoint                       | Auth     |
|----------|--------------------------------|----------|
| Auth     | POST /api/auth/register        | Public   |
| Auth     | POST /api/auth/login           | Public   |
| Customer | GET  /api/customer/search      | Public   |
| Customer | GET  /api/customer/seats/:id   | Public   |
| Customer | POST /api/customer/bookings    | Customer |
| Provider | GET  /api/provider/dashboard   | Provider |
| Provider | CRUD /api/provider/buses       | Provider |
| Provider | CRUD /api/provider/routes      | Provider |
| Provider | CRUD /api/provider/staff       | Provider |
| Provider | POST /api/provider/messages/send| Provider|
| Admin    | GET  /api/admin/users          | Admin    |
| Admin    | PUT  /api/admin/users/:id/reset-password | Admin |
| Admin    | GET  /api/admin/reports/*      | Admin    |

---

## 📧 Email / SMS

Both services run in **mock mode** — they log to console instead of sending real messages. 
To use real services:
- **Email**: Update `.env` with real SMTP credentials (Gmail, Ethereal, SendGrid, etc.)
- **SMS**: Integrate [Sparrow SMS](https://sparrowsms.com/) or [Aakash SMS](https://aakashsms.com/) in `backend/src/services/smsService.js`

---

## 🙏 शुभ यात्रा — Safe Travels!

*Built with ❤️ for Nepal's travellers*
