# RaxwoLMS

A multi-tenant SaaS platform for tuition institutes: academic LMS features (courses, quizzes, assignments, grading, attendance, exams) combined with institute back-office operations (fees, payments, commissions, salary, concessions, expenses) and platform-level subscription billing for the institutes themselves as tenants.

## Roles

- **Super-admin** — platform operator. Manages institutes (tenants), subscription plans, billing/invoices, trial lifecycle, and platform-wide audit/health.
- **Institute-admin** — runs one institute. Manages staff, students, classes, subjects, terms, enrollments, fees/payments/concessions/commissions/salary/expenses, bulk imports, and institute reports.
- **Institute-staff** — teacher. Manages their courses (modules/lessons), quizzes, assignments, grading queue, class sessions, and student follow-ups.
- **Student** — enrolls in courses/classes, takes quizzes, submits assignments, tracks grades/attendance/deadlines/progress, registers for exams, and views/downloads fee statements, receipts, and report cards.

Every institute is an isolated tenant: all data is scoped by `instituteId` and enforced server-side (see [Tenant isolation](#tenant-isolation)) except for the super-admin, who operates across tenants.

## Tech stack

- **Framework**: Next.js 16 (App Router), React 19 — note this Next.js version has renamed Middleware to **Proxy** (`src/proxy.ts`) and defaults it to the Node.js runtime; consult `node_modules/next/dist/docs/` before assuming APIs match older Next.js versions.
- **Database**: MongoDB via Mongoose (`src/models/*.ts`, `src/lib/db/connect.ts`)
- **Auth**: custom JWT session in an HTTP-only cookie (`src/lib/auth/session.ts`), no third-party auth provider
- **UI**: Tailwind CSS v4, Radix UI / shadcn-style components, `recharts` for charts
- **Forms/validation**: `react-hook-form` + `zod` (`src/lib/validation/*`)
- **Files**: S3 presigned uploads (`src/lib/storage/s3.ts`)
- **Reports**: PDF via `@react-pdf/renderer`, XLSX via `exceljs` (`src/lib/reports/*`)

## Architecture

- **Server Actions over API routes**: most writes go through `src/lib/actions/*` (one file per entity), not REST handlers. `src/app/api/` is reserved for a handful of cases that need raw HTTP semantics: PDF/CSV/XLSX downloads, S3 upload signing, and system/cron endpoints.
- **Read/write split**: `src/lib/data/*` holds read queries, `src/lib/actions/*` holds mutations.
- **Route groups by role**: `src/app/(super-admin)`, `(institute-admin)`, `(institute-staff)`, `(student)` hold pages exclusive to each role. `src/app/(dashboard)` holds pages shared across roles (e.g. `/fees`, `/attendance`, `/exams`, `/grades`, `/dashboard`, `/calendar`, `/announcements`, `/settings`) — each of those pages branches on `session.role` internally to render the right view for whoever's looking at it. This is intentional, not duplication.

### Tenant isolation

Auth and scoping helpers live in `src/lib/tenant/scope.ts`:

- `requireSession()` / `requireRole()` — called in every route group's `layout.tsx` and in most `src/lib/data/*` query functions.
- `withTenantScope()` — forces `instituteId` into a query filter for every role except super-admin; a client-supplied `instituteId` is never trusted.
- `assertSameInstitute()` — guards fetch-then-mutate flows against cross-tenant access.
- `src/proxy.ts` — a request-level backstop that requires a valid session cookie for every route except `/login` and the secret-gated `/api/system/sweep-trials`, so a new route added outside the existing layout groups doesn't silently ship unauthenticated.

## Getting started

1. Copy `.env.example` to `.env.local` and fill in `MONGODB_URI`, `JWT_SECRET`, AWS S3 credentials, and `SUPERADMIN_EMAIL`/`SUPERADMIN_PASSWORD`.
2. Install dependencies and bootstrap a super-admin:
   ```bash
   npm install
   npm run seed:superadmin
   ```
3. Optionally seed demo data: `npm run seed:demo`, `npm run seed:phase2`.
4. Start the dev server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) and sign in with the super-admin credentials from step 1.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` / `build` / `start` | standard Next.js dev/build/serve |
| `npm run lint` | ESLint |
| `npm run seed:superadmin` | bootstrap the initial super-admin account |
| `npm run seed:demo`, `seed:phase2` | seed demo institutes/data |
| `npm run seed:fill-current`, `seed:student-demo` | backfill demo data onto existing users |
| `npm run backfill:subscriptions` | one-off subscription data backfill |

## Known gaps

- No automated tests or CI configured yet.
- `src/app/(dashboard)` and the role-specific route groups look similar at a glance — see [Architecture](#architecture) for why that's intentional before "cleaning it up."
