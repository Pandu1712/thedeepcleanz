# TheDeep CleanerZ Admin Server

Standalone Node + Express admin dashboard for managing TheDeep CleanerZ categories,
services, and bookings. **This runs separately from the Lovable frontend** —
it cannot be deployed on Lovable's hosting (Cloudflare Workers). Host it on
Render, Railway, Fly, a VPS, or run locally.

## Run locally

```bash
cd backend
cp .env.example .env       # then edit SESSION_SECRET / admin password hash
npm install
npm run dev                # or: npm start
```

Open http://localhost:4000

**Default login:** `admin` / `admin123`

## Change the admin password

```bash
node -e "console.log(require('bcryptjs').hashSync('YourNewPassword', 10))"
```

Paste the output into `ADMIN_PASSWORD_HASH` in `.env`.

## Data storage

Everything lives in `data/db.json` (categories, services, bookings). Back it
up by copying that file. For production, swap `lib/db.js` to a real DB.

## Public API (for the frontend)

- `GET  /api/catalog`   → `{ categories, services }`
- `POST /api/bookings`  → accepts JSON, returns `{ ok, booking }`

CORS is open (`*`) on those two endpoints so the Lovable site can call them.
Point the frontend at `http://localhost:4000` in dev, or your deployed URL.

## Features

- Sessions + bcrypt-hashed admin login
- Dashboard with counts + recent bookings
- CRUD for Categories
- CRUD for Services (linked to categories)
- View & delete Bookings
- JSON API for the frontend to consume
