# Deployment (Full-Stack)

This repo is now deployable as a **single Node.js full-stack app**:

- **Backend (Express + MongoDB Atlas)**: `admin-backend`
- **Frontend (static HTML/JS/CSS)**: `fastsewafrontedapp` (served by the backend)
- **Admin panel (static)**: `fastsewafrontedapp/admin-frontend`

## 1) What to Deploy

Deploy **only the Node server** in `admin-backend`, but make sure the deployment includes the sibling folder `fastsewafrontedapp` in the same build artifact/repo.

The backend serves:

- Public site: `/` → `fastsewafrontedapp/index.html`
- Admin panel: `/admin-frontend/` → `fastsewafrontedapp/admin-frontend/index.html`
- API: `/api/*`

## 2) Required Environment Variables

Set these in your hosting provider:

- `MONGODB_URI` (MongoDB Atlas SRV URL)
- `JWT_SECRET` (random long secret)
- `PORT` (usually set automatically by host)

Optional:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_EMAIL`

## 3) Local Run (Full-Stack)

From the repo root:

```powershell
cd "admin-backend"
npm install
npm run dev
```

Then open:

- Site: `http://localhost:4000/`
- Admin panel: `http://localhost:4000/admin-frontend/`
- Health: `http://localhost:4000/api/health`

## 4) Frontend API Base Behavior

Frontend code now behaves like this:

- If `localStorage.apiUrl` is set, it will use that.
- Else if running on `localhost`, it defaults to `http://localhost:4000/api`.
- Else (production), it uses **same-origin**: `${window.location.origin}/api`.

That means: once deployed, you do **not** need to configure any API URL.

## 5) Deploy Notes (Generic)

Most hosts (Render/Railway/Fly.io/etc.) can deploy this with:

- **Root/Working directory**: `admin-backend`
- **Build**: `npm install`
- **Start**: `npm start`

If your platform can’t set a working directory, deploy from repo root but ensure it runs:

```bash
node admin-backend/src/server.js
```

and that `fastsewafrontedapp/` exists next to `admin-backend/`.
