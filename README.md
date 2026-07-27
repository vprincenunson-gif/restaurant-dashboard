# Restaurant Management Dashboard

A comprehensive restaurant management system built with **Next.js** (frontend), **Express.js** (backend), and **PostgreSQL** (database).

## Features

- **Dashboard** — Real-time overview of daily operations
- **Orders** — Create, update, and track orders with status management
- **Tables** — Manage table assignments, capacity, and occupancy
- **Inventory** — Track stock levels, set reorder alerts, manage suppliers
- **Staff** — Manage employee shifts, roles, attendance, and payroll
- **Customers** — View customer history, preferences, and loyalty data
- **Sales** — Daily/weekly/monthly sales reports and payment tracking
- **Analytics** — Visual insights with charts for revenue, orders, and trends

## Tech Stack

| Layer    | Technology                          |
| -------- | ----------------------------------- |
| Frontend | Next.js 14 (App Router), Tailwind CSS, Recharts |
| Backend  | Node.js, Express.js                 |
| Database | PostgreSQL + Prisma ORM             |
| Auth     | JWT (email/password) + Google OAuth |
| AI       | Gemini API (optional — analytics)   |
| Deploy   | Vercel / Netlify / Render / Railway |

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Google OAuth credentials (for social login)

## Getting Started

### 1. Clone & Install

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your database URL and secrets

# Database setup
npx prisma generate
npx prisma db push
npx prisma db seed

# Start backend (port 5000)
npm run dev

# Frontend (new terminal)
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your backend URL

# Start frontend (port 3000)
npm run dev
```

### 2. Environment Variables

**Backend (`backend/.env`)**
```
DATABASE_URL="postgresql://user:password@localhost:5432/restaurant_db"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:5000/api/auth/google/callback"
PORT=5000
FRONTEND_URL="http://localhost:3000"
GEMINI_API_KEY="your-gemini-api-key"  # optional
```

**Frontend (`frontend/.env.local`)**
```
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-google-client-id"
```

### 3. Seed Data

The seed script creates:
- Admin user (admin@restaurant.com / password123)
- 10 sample tables
- 20 sample menu items
- 5 staff members
- Sample inventory items
- Historical orders & sales

## API Endpoints

| Method | Endpoint                | Description          |
| ------ | ----------------------- | -------------------- |
| POST   | /api/auth/register      | Register new user    |
| POST   | /api/auth/login         | Login                |
| GET    | /api/auth/me            | Get current user     |
| POST   | /api/auth/google        | Google OAuth login   |
| GET    | /api/orders             | List orders          |
| POST   | /api/orders             | Create order         |
| PATCH  | /api/orders/:id/status  | Update order status  |
| GET    | /api/tables             | List tables          |
| PATCH  | /api/tables/:id         | Update table         |
| GET    | /api/inventory          | List inventory       |
| POST   | /api/inventory          | Add inventory item   |
| PATCH  | /api/inventory/:id      | Update inventory     |
| GET    | /api/staff              | List staff           |
| POST   | /api/staff              | Add staff            |
| GET    | /api/customers          | List customers       |
| GET    | /api/sales              | List sales           |
| GET    | /api/analytics/dashboard| Dashboard stats      |
| GET    | /api/analytics/revenue  | Revenue data         |

## Project Structure

```
restaurant-dashboard/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Auth, error handling
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Helpers
│   │   └── server.js        # Entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/             # Pages (App Router)
│   │   ├── components/      # React components
│   │   ├── lib/             # API client, utilities
│   │   ├── hooks/           # Custom hooks
│   │   └── types/           # TypeScript types
│   └── package.json
└── README.md
```

## Deployment

### Backend (Render / Railway)
1. Push to GitHub
2. Create new Web Service pointing to `backend/`
3. Set build command: `npm install && npx prisma generate && npx prisma db push`
4. Set start command: `npm start`
5. Add environment variables

### Frontend (Vercel / Netlify)
1. Connect GitHub repo
2. Set root directory to `frontend/`
3. Add environment variables
4. Deploy
