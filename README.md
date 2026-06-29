# Kartigo

A multi-tenant e-commerce platform with Owner, Admin, and Seller panels — built for dropshipping. Supports product listings, cart, checkout, Razorpay payments, KartiCoins rewards, referrals, and flash sales.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite, Tailwind CSS v4 |
| Backend | Express 5, Node.js 24 |
| Database | PostgreSQL + Drizzle ORM |
| Validation | Zod v4 + drizzle-zod |
| API contract | OpenAPI → Orval codegen |
| Package manager | pnpm workspaces |
| Language | TypeScript 5.9 |
| Images | Cloudinary |
| Email | Resend |
| Payments | Razorpay |

---

## Project Structure

```
artifacts/
  kartigo/        — React + Vite frontend
  api-server/     — Express 5 API
lib/
  db/             — Drizzle schema, migrations, seed
  api-spec/       — OpenAPI spec (source of truth)
  api-client-react/ — Generated React Query hooks
  api-zod/        — Generated Zod schemas
  replit-auth-web/ — Auth hook (useAuth)
scripts/          — Utility scripts
```

---

## Local Setup

### 1. Prerequisites

- Node.js 24+
- pnpm 9+
- A PostgreSQL database (Neon recommended — free tier works great)

### 2. Clone & install

```bash
git clone <your-repo-url>
cd kartigo
pnpm install
```

### 3. Environment variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

Required:
- `DATABASE_URL` — Postgres connection string (see Neon setup below)
- `JWT_SECRET` — Any strong random string: `openssl rand -base64 32`
- `APP_URL` — Base URL of your deployed app

Optional but recommended:
- `CLOUDINARY_*` — For image uploads in the admin and seller panels
- `RESEND_API_KEY` — For transactional emails (welcome, order confirmation)
- `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` — For live payment processing

### 4. Push the database schema

```bash
pnpm --filter @workspace/db run push
```

### 5. Seed the database

Creates categories, brands, 34+ products, coupons, banners, and demo accounts:

```bash
pnpm --filter @workspace/db run seed
```

### 6. Run in development

Two processes run together:

```bash
# Terminal 1 — API server (port 5000)
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Frontend (Vite, reads PORT from env)
pnpm --filter @workspace/kartigo run dev
```

### 7. Full typecheck

```bash
pnpm run typecheck
```

### 8. Regenerate API hooks (after OpenAPI changes)

```bash
pnpm --filter @workspace/api-spec run codegen
```

---

## Setting Up Third-Party Services

### Neon Database

1. Create a free project at [neon.tech](https://neon.tech)
2. Go to your project dashboard → **Connection Details**
3. Copy the connection string (it already includes `sslmode=require`)
4. Paste into `DATABASE_URL` in your `.env`
5. Append `&connect_timeout=30` if not present

### Cloudinary (image uploads)

1. Sign up at [cloudinary.com](https://cloudinary.com) (free tier is generous)
2. Dashboard → **API Keys**
3. Copy **Cloud Name**, **API Key**, and **API Secret**
4. Paste into `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
5. Set `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` to the same cloud name

### Razorpay (payments)

1. Sign up at [razorpay.com](https://razorpay.com)
2. Settings → **API Keys** → **Generate Test Key**
3. Copy **Key ID** (starts with `rzp_test_`) and **Key Secret**
4. Paste into `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
5. For webhooks: Dashboard → **Webhooks** → Add your endpoint URL → copy the **Webhook Secret** → paste into `RAZORPAY_WEBHOOK_SECRET`
6. To go live: generate a **live** key pair (starts with `rzp_live_`) and replace the test keys

### Resend (email)

1. Sign up at [resend.com](https://resend.com)
2. **API Keys** → **Create API Key**
3. Paste into `RESEND_API_KEY`
4. Add a verified sending domain under **Domains**, or use `onboarding@resend.dev` while testing
5. Set `EMAIL_FROM` to a verified address (e.g. `noreply@yourdomain.com`)

---

## Deploying on Replit

1. Open your Repl → **Deploy** tab
2. Set all environment variables from `.env.example` in the **Secrets** section:
   - `DATABASE_URL`, `JWT_SECRET`, `APP_URL`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
   - `RESEND_API_KEY`, `EMAIL_FROM`
3. Click **Deploy**
4. Your app will be live at `https://your-repl-name.replit.app`

> **Note:** After deploying, update `APP_URL` in Secrets to your live `.replit.app` domain, then redeploy.

---

## API Health Check

```
GET /api/healthz
→ { "status": "ok", "db": "connected" }
```

---

## Seed Accounts

After running `pnpm --filter @workspace/db run seed`:

| Role | Email | Password |
|---|---|---|
| Owner | owner@kartigo.com | Owner@123 |
| Admin | admin@kartigo.com | Admin@123 |
| Seller | seller@kartigo.com | Seller@123 |

---

## Coupon Codes (seeded)

| Code | Type | Value | Minimum Order |
|---|---|---|---|
| KARTIGO10 | 10% off | Max ₹500 | ₹500 |
| FLAT100 | ₹100 off | Fixed | ₹999 |
| NEWUSER50 | 50% off | Max ₹200, first order | ₹200 |
| WELCOME | ₹50 off | Fixed | ₹199 |

---

## Panel URLs

| Panel | URL | Role required |
|---|---|---|
| Admin | `/admin` | admin / owner |
| Owner | `/owner` | owner |
| Seller Dashboard | `/seller` | seller |

---

## Admin Panel Features

Access at `/admin` — requires an account with `admin` or `owner` role.

- Dashboard with revenue, order, and user stats
- Products — add, edit, delete with images, pricing, flash sale flags
- Orders — view, filter by status, export CSV
- Users — manage roles (buyer → seller → admin)
- Reviews — approve or delete

---

## GitHub Setup

Before pushing to GitHub, make sure:

1. `.gitignore` already excludes `.env`, `node_modules`, and `dist`
2. Never commit your `.env` file — only commit `.env.example`
3. Add all secrets as **Repository Secrets** if using GitHub Actions

```bash
# Verify .env is ignored
git status  # .env should not appear
git add .
git commit -m "initial commit"
git push origin main
```

---

## Contact

karticocontact@gmail.com
