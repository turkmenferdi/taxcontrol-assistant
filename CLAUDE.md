# TaxControl — Project Context for Claude

## What This App Does
TaxControl is a **Turkish SMB tax pre-check SaaS**. It syncs e-invoices, classifies expenses for VAT deductibility, and estimates VAT payable + provisional tax (geçici vergi) before the accountant sees anything. It is NOT a filing tool — it is a pre-check assistant.

Target users: sole proprietors (şahıs şirketi) and limited companies (limited şirket) in Turkey.

Live: https://taxcontrol-assistant.vercel.app  
Demo: `demo@taxcontrol.io` / `demo1234`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| ORM | Prisma 7 with driver adapters |
| DB (prod) | Neon PostgreSQL (pooled via `@prisma/adapter-pg`) |
| DB (local) | SQLite via libSQL (`@prisma/adapter-libsql`) |
| Auth | Custom session-based (bcryptjs + random token + httpOnly cookie) |
| Hosting | Vercel (auto-deploy from GitHub `master`) |
| i18n | React context + localStorage (`src/lib/i18n.ts`) |
| Icons | lucide-react |
| PDF/Excel | jspdf, xlsx |

**No next-auth. No Redux. No React Query. No tRPC.**

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/          # Login + register page
│   ├── (dashboard)/           # All protected pages
│   │   ├── layout.tsx         # Wraps with <Sidebar />
│   │   ├── dashboard/         # KPI overview
│   │   ├── gelen-faturalar/   # Incoming invoices
│   │   ├── giden-faturalar/   # Outgoing invoices
│   │   ├── riskli-giderler/   # Risky/flagged expenses
│   │   ├── kdv-ozeti/         # VAT summary
│   │   ├── gecici-vergi/      # Provisional tax
│   │   ├── raporlar/          # Excel report downloads
│   │   └── ayarlar/           # Company settings
│   └── api/
│       ├── auth/              # login, logout, register, me
│       ├── company/           # GET/POST company settings
│       ├── invoices/          # GET list, PATCH classification
│       ├── provider/sync/     # Trigger invoice sync
│       ├── reports/[type]/    # Excel downloads
│       └── tax/               # dashboard, vat, provisional
├── components/
│   ├── dashboard/KPICard.tsx
│   ├── invoices/InvoiceTable.tsx   # Used by all invoice pages
│   ├── invoices/ReviewModal.tsx    # Accountant decision modal
│   ├── invoices/ClassificationBadge.tsx
│   └── layout/Sidebar.tsx         # Fixed sidebar with TR/EN toggle
├── contexts/
│   └── language-context.tsx       # LanguageProvider + useLanguage()
├── lib/
│   ├── prisma.ts              # Singleton PrismaClient (pg or libsql)
│   ├── auth.ts                # Session helpers
│   ├── i18n.ts                # Full TR + EN translation dictionary
│   └── utils.ts               # formatCurrency, formatDate, classificationLabel, cn
├── providers/
│   ├── base-provider.ts
│   ├── mock-provider.ts       # Demo mode — generates fake invoices
│   ├── isnet-provider.ts      # İşNet NetteFatura API integration
│   └── provider-factory.ts
└── services/
    ├── expense-classification.service.ts  # Keyword-rule classifier
    ├── invoice-sync.service.ts
    └── tax-calculation.service.ts         # VAT + provisional tax math
```

---

## Database (Prisma Schema)

Models: `User` → `Company` → `Invoice` → `InvoiceLine` + `ExpenseClassification`  
Also: `Session`, `TaxSummary`, `TaxRate`

**Key invariants:**
- One user = one company (1:1)
- Invoice direction: `"incoming"` | `"outgoing"`
- Invoice type: `"eInvoice"` | `"eArchive"`
- Classification values: `"deductible"` | `"non_deductible"` | `"partially_deductible"` | `"accountant_review_required"`
- `accountantFinalDecision` overrides `classification` everywhere in tax calculations
- `status: "active"` — only active invoices count in tax calculations
- `partially_deductible` = 50% deductible in all calculations

**Prisma client instantiation** — NEVER use `new PrismaClient()` directly. Always import from `@/lib/prisma`:
```ts
import { prisma } from "@/lib/prisma";
```
The client auto-selects pg adapter (prod) or libsql adapter (local) based on `DATABASE_URL`.

**Migrations:** Run `prisma migrate dev` only against Neon using `POSTGRES_URL_NON_POOLING` (direct connection). The pooled `DATABASE_URL` is for runtime only.

---

## Auth Pattern

Custom session auth — no NextAuth:

```ts
// In API routes: get current user + company
import { getSession } from "@/lib/auth";
const session = await getSession(); // reads httpOnly "session" cookie
if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
const { user } = session; // user.company is included
```

Session token stored as httpOnly cookie `"session"`, 7-day expiry.  
All `/api/*` routes (except auth) must call `getSession()` and guard with 401.  
Middleware at `src/middleware.ts` redirects unauthenticated requests from dashboard pages.

---

## i18n Pattern

All UI strings live in `src/lib/i18n.ts` as `tr` and `en` objects.  
Language is stored in `localStorage` key `"lang"`, defaults to `"tr"`.

```tsx
// In any "use client" component:
import { useLanguage } from "@/contexts/language-context";
const { t, lang, setLang } = useLanguage();

// Static string:
<h1>{t.dashboardTitle}</h1>

// Dynamic string (function):
<p>{t.syncDone(json.created, json.skipped)}</p>
```

**When adding new UI strings:** add to BOTH `tr` and `en` objects in `i18n.ts`. The `en` object is typed `as typeof tr` so TypeScript will error if a key is missing.

**Never hardcode Turkish strings** in components — always use `t.keyName`.

---

## Tax Calculation Logic

Located in `src/services/tax-calculation.service.ts`:

**VAT (KDV):**
```
Ödenecek KDV = Satışlardan Hesaplanan KDV - İndirilebilir Alış KDV'si
```
- `accountant_review_required` invoices are **excluded** from deductible VAT until confirmed
- `partially_deductible` = 50% of VAT is deductible

**Provisional Tax (Geçici Vergi):**
```
Geçici Vergi = (Net Satışlar - İndirilebilir Giderler) × Vergi Oranı
```
- Rate: 15% for `sole_proprietorship`, 25% for `limited_company`
- Rates are stored in `TaxRate` table and can be updated from settings

**Expense Classification** (`src/services/expense-classification.service.ts`):
- Pure keyword-rule engine — no AI/ML
- Matches supplier name + invoice description + line descriptions
- Returns: `category`, `classification`, `confidenceScore`, `reason`

---

## Invoice Providers

```ts
// Provider interface (base-provider.ts)
interface InvoiceProvider {
  fetchInvoices(companyId: string, ...): Promise<InvoiceData[]>
}
```

- `mock`: Returns hardcoded sample data — used for demo accounts
- `isnet`: Calls İşNet NetteFatura REST API with Basic Auth
- Selected via `company.providerName` field
- Config (API credentials) stored encrypted as JSON in `company.providerConfig`

---

## Code Conventions

- All dashboard pages are `"use client"` — data fetched via `fetch()` to API routes
- API routes are always server-side — they call Prisma directly
- No server components with data fetching in the dashboard (keeps auth pattern simple)
- Component files use PascalCase, page files are `page.tsx`
- `cn()` utility for conditional Tailwind classes (from `src/lib/utils.ts`)
- `formatCurrency(amount)` — formats as Turkish Lira: `₺1.234,56`
- `formatDate(isoString)` — formats as `DD.MM.YYYY`

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon pooled connection (runtime) |
| `POSTGRES_URL_NON_POOLING` | Neon direct connection (migrations only) |
| `NEXTAUTH_SECRET` | Session signing secret |

Local dev: `DATABASE_URL` can be a `file:./dev.db` path — libsql adapter is used automatically.

---

## Deployment

- **GitHub** → `master` branch → auto-deploys to Vercel
- Build command: `prisma generate && prisma migrate deploy && next build`
- `postinstall`: `prisma generate` (runs on `npm install`)
- Neon DB connected via Vercel integration — env vars set automatically

**To deploy:** `git push origin master` — Vercel picks it up automatically.

---

## What NOT to Do

- Don't use `new PrismaClient()` — use the singleton from `@/lib/prisma`
- Don't add `next-auth` — auth is custom and intentional
- Don't fetch data in server components inside `(dashboard)` — use client components + API routes
- Don't hardcode Turkish strings in components — add to `i18n.ts` and use `t.key`
- Don't change `schema.prisma` provider — it must stay `"postgresql"`
- Don't run `prisma migrate dev` with the pooled `DATABASE_URL` — use `POSTGRES_URL_NON_POOLING`
- Don't add comments that describe what code does — only add comments for non-obvious WHY
- Don't create new pages without adding a nav item to `Sidebar.tsx` and a translation key to `i18n.ts`
