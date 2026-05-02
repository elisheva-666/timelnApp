# TimeIn — Deployment Guide

## Architecture

| Layer    | Local dev            | Production              |
|----------|----------------------|-------------------------|
| Database | SQLite (node:sqlite) | PostgreSQL (Render)     |
| Backend  | Node 22, port 3001   | Render Web Service      |
| Frontend | Vite dev server      | Vercel / Netlify        |

---

## 1. Push code to GitHub

```bash
git init          # if not already done
git add .
git commit -m "feat: production-ready build"
git remote add origin https://github.com/YOUR_USERNAME/timeln.git
git push -u origin main
```

---

## 2. Deploy backend to Render

1. Go to [render.com](https://render.com) → **New** → **Blueprint**
2. Connect your GitHub repo — Render auto-detects `render.yaml`
3. It creates:
   - A **PostgreSQL** database (`timeln-db`)
   - A **Web Service** (`timeln-server`) linked to that database
4. After first deploy, set the missing env var:
   - `CLIENT_URL` → your Vercel frontend URL (e.g. `https://timeln.vercel.app`)
5. Copy the server URL (e.g. `https://timeln-server.onrender.com`)

> **Note:** Free-tier Render services spin down after 15 min of inactivity. First request after sleep takes ~30 s.

---

## 3. Deploy frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo
2. Set **Root Directory** to `client`
3. Add environment variable:
   - `VITE_API_URL` = `https://timeln-server.onrender.com/api`
4. Deploy — Vercel auto-detects Vite; `vercel.json` handles SPA routing

---

## 4. Local development

```bash
# Backend
cd server
cp .env.example .env   # edit JWT_SECRET, leave DATABASE_URL empty for SQLite
npm install
node --experimental-sqlite src/index.js

# Frontend (new terminal)
cd client
cp .env.example .env.local   # leave VITE_API_URL empty (defaults to localhost:3001)
npm install
npm run dev
```

---

## Environment variables reference

### server/.env
| Variable       | Required | Description                                      |
|----------------|----------|--------------------------------------------------|
| `PORT`         | No       | HTTP port (default 3001)                         |
| `DATABASE_URL` | No       | PostgreSQL URL — omit to use local SQLite        |
| `JWT_SECRET`   | Yes      | Secret for signing JWTs                          |
| `CLIENT_URL`   | No       | Frontend origin for CORS (omit to allow all)     |

### client/.env.local
| Variable        | Required | Description                                     |
|-----------------|----------|-------------------------------------------------|
| `VITE_API_URL`  | No       | Backend API base URL (default: localhost:3001)  |
