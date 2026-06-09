# Shrinath Ji Enterprises — Retailer Ordering & Warehouse Fulfilment Platform

White-label B2B ordering platform. Three pieces, one Supabase backend:

1. **Retailer PWA** (mobile / iPhone-first) — scan or search parts → basket → order → track status.
2. **Warehouse Desk** (desktop web) — live orders → pick → enter invoice → auto-close.
3. **Admin** — catalogue, retailers, all orders.

Re-deploying for another distributor = edit `src/config.ts` + one `distributors` row. Nothing else.

---

## Repo layout

```
shrinath-ji-platform/
├── supabase/
│   ├── migrations/0001_init.sql   # tables, enums, indexes, RLS, realtime, auto-closer trigger
│   └── seed.mjs                   # distributor + admin/retailer/warehouse users + ~30 parts
├── shared/
│   ├── parseHeroQR.ts             # Hero QR parser (pure, typed)
│   ├── parseHeroQR.test.ts        # vitest suite — 9 tests, all passing
│   └── tokens.ts                  # Soft Tech design tokens (single source of truth)
├── apps/
│   ├── retailer-pwa/              # [phase 3]
│   └── warehouse-desk/            # [phase 4]
└── README.md
```

---

## Backend — LIVE (already provisioned)

This is deployed to the existing Supabase project **`lsnudhxlyypugunlgwxi`**, fully
**parallel** to the data already there: every object is `sj_`-prefixed and no existing
table was read or modified. Verified end-to-end (login, RLS, order placement, auto-close).

- Schema applied via migration `supabase/migrations/0001_init.sql`
- Seeded: 1 distributor, 4 users, and your **real catalogue of 7,664 Hero parts** (loaded from `data.js`)
- `apps/retailer-pwa/.env` is pre-filled with the project URL + anon key (public-safe)

To re-create elsewhere: run the migration, then `node supabase/seed.mjs` with
`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` set (it's idempotent).

### Seeded logins
| Role      | Email                        | Password      |
|-----------|------------------------------|---------------|
| admin     | admin@yantrayug.test        | Admin@12345   |
| retailer  | retailer1@yantrayug.test    | Retail@12345  |
| retailer  | retailer2@yantrayug.test    | Retail@12345  |
| warehouse | warehouse@yantrayug.test    | Wh@12345      |

---

## Run tests

```bash
cd shared && npm install && npm test     # parseHeroQR — 9/9 passing
```

## Run the Retailer PWA locally

```bash
cd apps/retailer-pwa
npm install
cp .env.example .env        # then fill in your Supabase URL + anon key
npm run dev                 # http://localhost:5173
npm run build               # production build (also emits the service worker)
```

Env vars (`apps/retailer-pwa/.env`):
```
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

The PWA is iPhone-first: bottom nav with a center scan FAB, 44px touch targets, safe-area
padding for the home indicator, `100dvh` layouts, 16px inputs (no Safari zoom), a one-time
"Add to Home Screen" sheet for iOS, and camera requested only on the Scan tap. Camera
unavailable → manual part-no entry feeds the same parse/search path.

**Catalogue is server-side search** (debounced `ilike` on part_no + description, 60-row pages)
rather than loading all parts client-side — required at 7,664 parts and scales to 32k+.
The app shell installs and runs offline; catalogue search needs a connection.

## Run the Warehouse Desk locally

```bash
cd apps/warehouse-desk
npm install
npm run dev      # http://localhost:5173
npm run build
```

`.env` is pre-filled (same Supabase project). Sign in with `warehouse@yantrayug.test` / `Wh@12345`
(staff). The admin catalogue tab (add/edit/CSV import) appears only for `admin@yantrayug.test`.

Live orders board subscribes to `sj_orders` realtime — orders placed in the PWA appear instantly.
Open an order → pick list with bin locations → enter an invoice number → the DB trigger closes it.

### Deploy the Warehouse Desk to Vercel
Add it as a **separate Vercel project** from the same repo, with **Root Directory = `apps/warehouse-desk`**.
Vite is auto-detected; `.env` carries the Supabase keys; `vercel.json` handles SPA routing.

---

## Build status

- [x] **Phase 1** — Supabase schema, RLS, realtime, auto-closer trigger, seed — **applied + verified live (`sj_` parallel)**
- [x] **Phase 2** — `parseHeroQR` + tests, shared design tokens
- [x] **Phase 3** — Retailer PWA (auth → catalogue → scan → basket → order → status), iPhone-first — typechecks + builds clean
- [x] **Phase 4** — Warehouse desk (live orders → pick → invoice/close → admin catalogue + CSV import) — typechecks + builds, joins verified live
- [x] **Phase 5** — Realtime wiring retailer → warehouse (board subscribes to `sj_orders`)
- [x] **Phase 6** — Soft Tech polish pass
- [~] **Phase 7** — Deploy to Vercel: retailer PWA live; warehouse desk ready to deploy
