# Connect by Swipecraft

> **Open peer mock interview infrastructure for the world's software engineers.**  
> 100% Free · Zero Paywalls · Zero Advertisements · Equal Reciprocal Standing

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19-61dafb.svg?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178c6.svg?logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6.0-646cff.svg?logo=vite)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ecf8e.svg?logo=supabase)](https://supabase.com)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers%20%26%20Pages-f38020.svg?logo=cloudflare)](https://workers.cloudflare.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS%203.4-38bdf8.svg?logo=tailwind-css)](https://tailwindcss.com)

---

## 🌟 Key Features

- 🤝 **Reciprocal Mock Matching:** Browse open practice listings or publish your own session across Systems Design, Frontend, Backend, DSA, Distributed Systems, Behavioral, ML, and Data tracks.
- ⭐ **Dynamic Karma & Reputation Engine:** Points earned for evaluating peers (+35), practicing (+15), and maintaining high reliability (+2x). Reputation tiers from *Apprentice* to *Grandmaster*.
- 🛡️ **Anti-Flake & Trust Safeguards:** 2-hour notice cancellation standards with automatic marketplace feed restoration and reliability tracking.
- 📹 **Deterministic Google Meet Rooms:** Time-calibrated Google Meet video links generated directly without third-party meeting dependencies.
- 📅 **Automatic Calendar Integration:** One-click Google Calendar scheduling and automated email reminders with standard `.ics` calendar invites.
- ⚡ **Realtime Synchronization:** Instant live updates powered by Supabase Realtime WebSockets and TanStack Query cache.
- 🎨 **Antigravity Glassmorphic UI:** Precision dark aesthetic built with Google Sans Flex typography, smooth Lenis scrolling, and glassmorphic micro-interactions.

---

## 🏗️ Architecture

```text
┌────────────────────────────────────────────────────────┐
│               Frontend (Cloudflare Pages)              │
│       Vite · React 19 · Tailwind CSS · TanStack Query  │
└───────────────┬────────────────────────┬───────────────┘
                │                        │
       REST / WebSockets          HTTPS / API
                │                        │
                ▼                        ▼
┌───────────────────────────┐ ┌──────────────────────────┐
│         Supabase          │ │    Cloudflare Workers    │
│  PostgreSQL (RLS) · Auth  │ │  Atomic booking actions  │
│  Realtime Event Stream    │ │  15-minute Cron Sweeper  │
│  Stored Procedures (RPC)  │ │  Transactional Resend API│
└───────────────────────────┘ └──────────────────────────┘
```

---

## 📁 Repository Structure

```text
peer-mock-platform/
├── apps/
│   └── web/                   # Vite + React 19 Frontend
│       ├── src/
│       │   ├── components/    # UI views, modals, cards, badges
│       │   ├── context/       # Auth, Timezone, Alert, Presence, Notifications
│       │   ├── hooks/         # useSlots, useAuth, useDebounce
│       │   ├── lib/           # Supabase client, email service
│       │   ├── types/         # Database and UI interfaces
│       │   └── utils/         # Karma engine, calendar generator
│       ├── .env.example       # Frontend environment template
│       └── vite.config.ts
├── packages/
│   └── workers/               # Cloudflare Worker & Cron Sweeper
│       ├── src/
│       │   └── index.ts       # Booking endpoints & email dispatch
│       └── wrangler.toml      # Worker configuration template
├── scripts/                   # Migration & verification utilities
└── supabase/
    └── migrations/            # SQL DDL & stored procedures (0001 - 0005)
```

---

## ⚡ Quick Start (Local Setup)

### Prerequisites
- Node.js 18+ and npm
- A free [Supabase](https://supabase.com) project
- A [Google Cloud Console](https://console.cloud.google.com) project for Google OAuth
- *(Optional)* [Cloudflare](https://cloudflare.com) account for worker deployments
- *(Optional)* [Resend](https://resend.com) API key for transactional emails

---

### 1. Clone Repository & Install Dependencies

```bash
git clone https://github.com/<your-username>/connect.git
cd connect
npm install
```

---

### 2. Configure Database & Auth (Supabase)

1. Create a new Supabase project at [database.new](https://database.new).
2. Open the **SQL Editor** in Supabase and run the migration files in numerical order:
   - `supabase/migrations/0001_initial_schema.sql`
   - `supabase/migrations/0002_review_enhancements.sql`
   - `supabase/migrations/0003_slot_requests_and_onboarding.sql`
   - `supabase/migrations/0004_fix_slots_rls_cancellation_and_deletion.sql`
   - `supabase/migrations/0005_karma_and_cancellation_tracking.sql`
3. Under **Authentication** -> **Providers**, enable **Google OAuth**:
   - Provide your Google Client ID & Secret from Google Cloud Console.
   - Add your local URL (`http://localhost:3000/**`) and production domain to **URL Configuration** -> **Redirect URLs**.

---

### 3. Configure Frontend Environment

Copy the environment template:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Edit `apps/web/.env.local`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
VITE_WORKER_API_URL=https://your-worker.workers.dev
```

---

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### 5. (Optional) Deploy Cloudflare Worker

```bash
cd packages/workers
cp wrangler.toml.example wrangler.toml  # configure your project settings
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put RESEND_API_KEY
npx wrangler deploy
```

---

## 🤝 Contributing

We welcome contributions to Connect! To contribute:

1. **Fork** the repository.
2. **Create a feature branch:** `git checkout -b feature/amazing-feature`
3. **Commit your changes:** `git commit -m 'feat: add amazing feature'`
4. **Push to the branch:** `git push origin feature/amazing-feature`
5. **Open a Pull Request** explaining your changes.

Please ensure your code builds cleanly (`npm --prefix apps/web run build`) and contains no hardcoded secrets or API keys.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

Developed with ❤️ by the **[Swipecraft](https://swipecraft.in)** community.
