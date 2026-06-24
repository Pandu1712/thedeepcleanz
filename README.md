# TheDeep CleanerZ

A premium deep cleaning service platform for homes and businesses, restructured into a clean monorepo format.

## Directory Structure

```
project-root/
├── frontend/             # TanStack Start web application (Vite, TS, TailwindCSS)
├── backend/              # Node.js + Express admin dashboard server
└── README.md             # This document
```

---

## 🎨 Frontend Setup

The frontend is built using **TanStack Start**, a full-stack React framework with type-safe routing.

### Quick Start
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies (if needed):
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:8080](http://localhost:8080) in your browser.

### Configuration
By default, the frontend connects to the backend API at `http://localhost:4000`. You can configure a different backend URL by creating a `.env` file in the `frontend` folder:
```env
VITE_ADMIN_API_URL=https://your-backend-api.com
```

---

## ⚙️ Backend Setup

The backend is a standalone **Node + Express** admin dashboard for managing TheDeep CleanerZ categories, services, and bookings.

### Quick Start
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` to configure your `SESSION_SECRET` and admin passwords.*
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:4000](http://localhost:4000) to access the admin dashboard.

**Default Credentials:** `admin` / `admin123`

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, TanStack Start, TailwindCSS, Radix UI.
- **Backend:** Node.js, Express, EJS (for templates), JSON (for simple file-based database).
