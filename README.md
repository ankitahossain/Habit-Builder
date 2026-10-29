
🌐 **Live Demo:**  http://localhost:5173/
🎥 **Demo Video:** [(https://youtu.be/ma0JVse_kAQ)](https://youtu.be/ma0JVse_kAQ)

# Habit Builder — Full-Stack Project

A responsive habit tracker built around the supplied project flow: authentication, habit CRUD, daily checklist, current/longest streaks, calendar heatmap, reminders, weekly analytics, and deployment guidance.

## Stack
- Frontend: React + Vite, Tailwind CSS, Recharts, Lucide React
- Backend: Node.js + Express REST API
- Database: PostgreSQL
- Scheduling / notifications: node-cron + Web Push (scaffold and setup notes)
- Tests: Vitest for frontend utility logic and Node's test runner for backend streak logic

## Prerequisites
- Node.js 20+
- PostgreSQL 15+
- npm

## Run locally

### 1. Database
Create a database named `habit_builder`, then run:
```bash
psql -U postgres -d habit_builder -f server/db/schema.sql
```

### 2. Backend
```bash
cd server
cp .env.example .env
npm install
npm run dev
```
Update `.env` with your PostgreSQL connection string and a long random JWT secret.

### 3. Frontend
In another terminal:
```bash
cd client
npm install
npm run dev
```
Open the Vite URL shown in the terminal (normally http://localhost:5173).

## Demo
Register a new account from the UI. The API stores users and habits in PostgreSQL. Never use real passwords in a demo database.

## Features
- Register / login with bcrypt password hashing and JWT authentication
- Create, edit, delete and schedule habits
- Daily check-off and idempotent habit logs
- Current and longest streak calculations based on scheduled days
- Completion heatmap and weekly completion chart
- Input validation and consistent API errors
- Responsive layout, loading and empty states
- Unit tests for streak edge cases

## Security and limitations
- Use HTTPS in production.
- Set a strong `JWT_SECRET`; keep `.env` out of Git.
- Configure CORS to your actual deployed frontend origin.
- Browser notifications require permission and a secure context (HTTPS or localhost). A reliable push system also requires VAPID keys, a service worker, subscription storage and a production scheduler; see `server/src/notifications.js`.
- This is a complete academic starter project, not a guarantee of a particular grade. Test it, understand it, and adapt it to your marking rubric before submission.

## Suggested academic submission checklist
1. Add your name/student ID and course details to your own report, not to this shared template.
2. Include screenshots of login, dashboard, habit form, heatmap, and analytics.
3. Explain the architecture and database schema.
4. Run tests and include actual test results.
5. Test timezone boundaries, invalid inputs, missed days, and duplicate check-offs.
6. Deploy using the options required by your module and include real URLs only after deployment.

## Deploy on Vercel (two projects from one repo)

**Server project** (Root Directory: `server`)
Environment variables: `DATABASE_URL` (hosted Postgres, e.g. Neon/Supabase), `JWT_SECRET`, `CLIENT_ORIGIN` (exact client URL, no trailing slash), `NODE_ENV=production`.
Run `server/db/schema.sql` once on the hosted database. Check `https://<server>.vercel.app/api/health`: it must show `"db":"connected"`.

**Client project** (Root Directory: `client`)
Environment variable: `VITE_API_URL=https://<server>.vercel.app/api`. Redeploy after setting it (Vite bakes it in at build time).

Note: node-cron does not run on Vercel; reminders need an external scheduler (Vercel Cron) in production.
