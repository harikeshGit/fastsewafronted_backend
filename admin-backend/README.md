# Admin Backend (Express + MongoDB Atlas)

This service powers a simple admin panel to create and manage announcements that the live FastSewa website displays.

## Setup

1. Create a MongoDB Atlas cluster.
   - Add Network Access rule: Allow your IP (or 0.0.0.0/0 for dev).
   - Create a Database User with password.
   - Get your connection string (SRV) for your database.
2. Configure environment:
   - Copy `.env.example` to `.env` and set `MONGODB_URI` to your Atlas URI.
   - Optionally set `PORT` (default 4000).

## Install & Run

```powershell
Set-Location "C:\Users\harik\OneDrive\Documents\New folder (2)\New folder\admin-backend"
npm install
# Edit .env with your actual MONGODB_URI
npm run dev
```

Server runs at http://localhost:4000.

## API

- `GET /api/health` → `{ status: "ok" }`
- `GET /api/announcements` → List announcements
- `POST /api/announcements` → Create `{ title, message, active }`
- `PUT /api/announcements/:id` → Update any fields
- `DELETE /api/announcements/:id` → Remove announcement

## Admin Panel Frontend

Open the admin panel:

```powershell
Start-Process "C:\Users\harik\OneDrive\Documents\New folder (2)\New folder\fastsewafrontedapp\admin-frontend\index.html"
```

- It will call `http://localhost:4000/api/announcements` by default.
- To point elsewhere, set in browser console:

```js
localStorage.setItem("apiUrl", "https://your-server");
```

## Live Website Integration

The live site `fastsewafrontedapp` now includes `js/announcements.js`:

- It fetches active announcements and injects a top banner.
- For local testing, run the backend and open:

```powershell
Start-Process "C:\Users\harik\OneDrive\Documents\New folder (2)\New folder\fastsewafrontedapp\index.html"
```

If loading from `file://`, CORS is allowed by the backend (`origin: '*'`). For production, host the site on HTTPS and set `localStorage.apiUrl` to your backend URL.
