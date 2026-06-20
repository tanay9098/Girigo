
A wish making application inspired from Kdrama, "If wishes could kill."

**Detailed Blog:** https://dev.to/tanay_dwivedi9098/i-developed-an-app-that-can-kll-you-2oad <br>
**Live app:** https://girigofrontend.netlify.app/

---

## How it works

1. Sign in with email and password
2. Record your wish via webcam
3. Set a seal password 
4. Submit — the encrypted video is uploaded and a 24-hour countdown begins
5. After 24 hours, you receive a push notification: your wish is granted

---

## Tech stacks used 🤖

| Layer | Technology |
|---|---|
| Web Frontend | React 19, Vite 8, PWA (Workbox), Web Crypto API |
| Backend | Node.js, Express 5 |
| Database | Supabase (PostgreSQL + Storage + Auth) |
| Job Queue | BullMQ, Redis, IORedis |
| Push Notifications | Web Push API (VAPID), web-push |
| Encryption | AES-256-GCM, PBKDF2 (310k iterations) |
| Deployment | Netlify (frontend), Render.com (backend + worker) |

---

## Project structure

```
Girigo/
├── frontend/          # React + Vite SPA
│   └── src/
│       ├── components/    # VideoRecorder, WishForm, CountDown, …
│       ├── hooks/         # useMediaRecorder, useCountdown, usePush
│       ├── lib/           # crypto.js, api.js, supabase.js
│       └── pages/         # AuthPage, DashboardPage
├── backend/           # Express API + BullMQ worker
│   ├── routes/        # wishes.js, push.js
│   ├── jobs/          # worker.js (scheduled notifications)
│   ├── middleware/    # auth.js (Supabase JWT)
│   └── lib/           # queue.js, storage.js, webpush.js, supabase.js
└── supabase/
    └── migrations/    # SQL schema migrations
```

---

## Local setup

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- A Redis instance 

---

### 1. Clone the repo

```bash
git clone https://github.com/tanay9098/Girigo.git
cd Girigo
```

---

### 2. Supabase setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the migrations in order from `supabase/migrations/` in the Supabase SQL editor
3. Create a **private** Storage bucket named `wish-videos`
4. Enable **Email/Password** auth under Authentication → Providers

---

### 3. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Redis
REDIS_URL=redis://127.0.0.1:6379

# Web Push — generate with: npx web-push generate-vapid-keys
VAPID_CONTACT_EMAIL=you@example.com
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
```

Generate VAPID keys:

```bash
npx web-push generate-vapid-keys
```

Start the API server and the background worker in separate terminals:

```bash
# Terminal 1 — API server
npm run dev

# Terminal 2 — notification worker
npm run worker
```

---

### 4. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_BACKEND_URL=http://localhost:4000
```

Start the dev server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Environment variables reference

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `PORT` | Port for the Express server (default: `4000`) |
| `NODE_ENV` | `development` or `production` |
| `FRONTEND_URL` | Allowed CORS origin(s), comma-separated |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `REDIS_URL` | Redis connection URL |
| `VAPID_CONTACT_EMAIL` | Contact email for Web Push |
| `VAPID_PUBLIC_KEY` | VAPID public key |
| `VAPID_PRIVATE_KEY` | VAPID private key |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `VITE_BACKEND_URL` | Backend API base URL |

---

## Security Features

- Videos are encrypted **in the browser** before upload  using AES-256-GCM. The server only stores ciphertext and it can never see your wish.
- The seal password is never sent to the server
- Supabase Row Level Security (RLS) ensures users can only access their own data
- Storage paths are scoped per user: `wishes/{userId}/{wishId}.bin`
