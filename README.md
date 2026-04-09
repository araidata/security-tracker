# Security Program Tracker

A production-ready web application for managing Annual Goals, Quarterly Rocks, and execution tracking for government security organizations. Built for CJIS-aligned environments with role-based access control, audit logging, and a dark professional UI.

## Features

- **Executive Dashboard** - KPIs, status charts, attention items at a glance
- **Annual Goals** - Strategic goal management with auto-rollup from linked rocks
- **Quarterly Rocks** - Core execution tracking with overdue/stale/blocked detection
- **Team Assignments** - Break rocks into individual work items with owners and contributors
- **Weekly Updates** - Append-only progress log driving rock status derivation
- **Monthly & Quarterly Reviews** - Leadership reporting with planned vs actual outcomes
- **Role-Based Access** - Executive, Manager, Contributor roles with RBAC on all mutations
- **Audit Logging** - All mutations logged for compliance
- **Dark Theme** - Professional, low-fatigue interface with risk-driven color coding

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js (Credentials provider, JWT sessions)
- **Styling**: Tailwind CSS (dark theme)
- **Charts**: Recharts
- **Validation**: Zod
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (local, Neon, Supabase, or Vercel Postgres)

### 1. Clone and Install

```bash
git clone https://github.com/araidata/security-tracker.git
cd security-tracker
npm install
```

### 2. Configure Environment

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Random 32+ character string (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Your app URL (`http://localhost:3000` for local dev)

### 3. Run Database Migrations

```bash
npx prisma migrate dev --name init
```

### 4. Seed Sample Data

```bash
npm run db:seed
```

This creates:
- 9 users (3 per department: SecOps, SAE, GRC)
- 6 annual goals with realistic security program objectives
- 12 quarterly rocks (Q1 completed, Q2 in-progress)
- 24 team assignments
- 36 weekly updates
- Monthly and quarterly reviews

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Login Credentials (Seed Data)

| Role | Email | Password |
|------|-------|----------|
| Executive | sarah.chen@secops.gov | SecTrack2026! |
| Manager | james.rivera@secops.gov | SecTrack2026! |
| Contributor | maria.thompson@secops.gov | SecTrack2026! |

All 9 users share the same password. See `prisma/seed.ts` for the full list.

## Deploy to Vercel

1. Push your repo to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables in the Vercel dashboard:
   - `DATABASE_URL` (from Neon, Supabase, or Vercel Postgres)
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (your Vercel deployment URL)
4. Vercel will automatically run `prisma generate` via the `postinstall` script
5. Run migrations against your production database:
   ```bash
   npx prisma migrate deploy
   ```
6. Seed the database (optional):
   ```bash
   npm run db:seed
   ```

## Project Structure

```
src/
├── app/
│   ├── (app)/              # Authenticated app pages
│   │   ├── dashboard/      # Executive dashboard
│   │   ├── goals/          # Annual goals CRUD
│   │   ├── rocks/          # Quarterly rocks CRUD + weekly updates
│   │   ├── assignments/    # Team assignments
│   │   ├── updates/        # Weekly updates feed
│   │   ├── reviews/        # Monthly + quarterly reviews
│   │   └── admin/          # User management + audit log
│   ├── (auth)/             # Login page
│   └── api/                # REST API routes
├── components/
│   ├── dashboard/          # KPI cards, charts
│   ├── goals/              # Goal forms
│   ├── rocks/              # Rock forms
│   ├── reviews/            # Review dialogs
│   ├── layout/             # Sidebar, topbar
│   └── shared/             # Badges, page headers, empty states
└── lib/
    ├── services/           # Business logic layer
    ├── validations/        # Zod schemas
    ├── auth.ts             # RBAC helpers
    ├── auth-options.ts     # NextAuth config
    ├── prisma.ts           # Prisma client singleton
    ├── constants.ts        # Color/status mappings
    └── utils.ts            # Utility functions
```

## Departments

- **SecOps** - Security Operations Center
- **SAE** - Security Architecture & Engineering
- **GRC** - Governance, Risk & Compliance

## Security Considerations

- All routes protected by NextAuth middleware
- JWT sessions with 8-hour expiry
- RBAC on all mutation endpoints
- Audit log on all create/update/delete operations
- Security headers (HSTS, X-Frame-Options, CSP, etc.)
- No sensitive data stored (CJIS-aligned design)
- Password hashing with bcrypt (12 rounds)
