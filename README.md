# Maruti Suzuki — In-Store Wi-Fi & Retail Dashboard Platform

A Node.js/Express + Supabase backend, paired with two React/Vite frontends:
a customer-facing **captive Wi-Fi portal** (Sales / Services / Pre-book a Test Drive)
and a **retail management dashboard** for showroom staff. Also includes a Flutter
companion app and ESP32 firmware for in-store hotspot hardware.

## Structure

```
maruti-suzuki-portal/
├── server/              ← Node.js/Express + Supabase API (deploy to Render)
├── captive-portal-app/  ← Customer Wi-Fi sign-in portal (React/Vite, deploy to Vercel)
├── dashboard-app/       ← Showroom staff dashboard (React/Vite, deploy to Vercel — or served by the API)
├── mobile-app/          ← Flutter companion app (standalone — build/run separately)
├── firmware/            ← ESP32 captive-portal firmware (Arduino/C++ — flash separately)
├── mcp-server/          ← MCP tool definitions + local stdio server; remote HTTP connector is mounted in server/
├── docs/                ← Supabase schema (this project + Marketplace integration)
├── render.yaml          ← Render blueprint for the backend
└── package.json         ← npm workspaces root (server + captive-portal-app + dashboard-app only)
```

`mobile-app/`, `firmware/`, and `mcp-server/` are standalone projects included for
convenience — they're not part of the npm workspace and don't affect `npm
install`/`npm run build` at the root. See `mobile-app/README.md`, `firmware/README.md`,
and `mcp-server/README.md` for their own setup steps.

---

## 1. Local setup

```bash
npm install                       # installs all 3 workspaces at once (server, captive-portal-app, dashboard-app)
cp server/.env.example server/.env
# then edit server/.env with your Supabase URL + key (see Section 2)
```

Without a configured `.env`, the server still runs — it just falls back to in-memory
storage, which resets every time the server restarts. That's fine for a five-minute
test, but **for anything real (including test drive bookings surviving a restart),
set up Supabase first.**

Run each piece in its own terminal:

```bash
npm run dev:server      # API on http://localhost:8000
npm run dev:portal      # captive portal on http://localhost:3000
npm run dev:dashboard   # dashboard on a Vite dev port (check terminal output)
```

Both frontends read `VITE_API_URL` to know where the backend lives. Locally they
default to `http://localhost:8000`, so nothing extra is needed to develop. To point a
frontend at a different backend, create a `.env` in that app's folder:

```
VITE_API_URL=http://localhost:8000
```

> **Deploying the portal or dashboard separately from the backend?** You MUST set
> `VITE_API_URL` to the full deployed backend URL in that project's environment
> variables, then trigger a fresh build — Vite only reads env vars at build time.
> Without this, the portal will still *look* like it's working (form submissions
> show a success screen) while nothing actually reaches the server. See
> "Troubleshooting" below.

---

## 2. Database setup (Supabase)

The server works without Supabase (in-memory fallback), but anything that needs to
survive a restart — customer check-ins, test drive bookings, coupon redemptions —
needs it. You can either reuse an existing Supabase project or spin up a dedicated
one just for this app; the steps are the same either way.

### a) Create a project (skip if reusing one)

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Pick an organization, name it (e.g. `maruti-suzuki-portal`), set a database
   password, choose a region close to your users
3. Wait ~2 minutes for it to provision

### b) Get your credentials

**Settings → API** in the project:
- **Project URL** — `https://xxxxxxxxxxxx.supabase.co`
- **service_role key** — under "Project API keys". Use this one, **not** the
  `anon`/`publishable` key. `service_role` bypasses Row Level Security, which is what
  a trusted backend server wants. **Never** put this key in a frontend `.env`
  (anything prefixed `VITE_`) — only in `server/.env`, which stays private.

### c) Create the tables

Run `docs/supabase_schema.sql` in your Supabase project's **SQL Editor**. It creates:

| Table | Used for |
|---|---|
| `customers` | Wi-Fi captive-portal check-ins, loyalty tier, points |
| `coupons` | Active promotions (seeded automatically on first API call) |
| `redemptions` | Coupon usage log |
| `orders` | Placed orders (dashboard "Orders" tab) |
| `feedbacks` | Customer feedback (dashboard "Customer Feedback" tab) |
| `testdrives` | "Pre-book a Test Drive" bookings (dashboard "Test Drives" tab) |

It also enables Row Level Security with permissive "allow all" policies on every
table, and sets up a trigger that auto-creates a redemption row whenever a customer
is assigned a coupon.

### d) Wire it up

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key-here
```

Restart the server. Check the startup log:
- Still seeing `⚠ SUPABASE_URL / SUPABASE_KEY are not set`? The env vars weren't
  picked up — check for typos, quotes, or trailing spaces.
- Warning gone → you're connected. Data now survives restarts.

---

## 3. Deploy the backend to Render

`render.yaml` is already set up:

1. Push this repo to GitHub.
2. On Render: **New → Blueprint** → point at the repo. It reads `render.yaml` automatically.
3. In the Render dashboard, set the two env vars it asks for: `SUPABASE_URL` and `SUPABASE_KEY`.
4. Render builds with `npm install && npm run build:dashboard`, then starts the server.
   By default the backend also serves the built dashboard at `/`, so this one service
   covers both API + dashboard if you want the simplest setup.

Your live API will be something like `https://maruti-suzuki-api.onrender.com`.

> **Render free tier note:** free web services spin down after ~15 minutes of
> inactivity and cold-start (30–50s) on the next request. If Supabase isn't
> configured, that cold start wipes any in-memory data collected before the sleep —
> this is the #1 cause of "a customer/booking appeared, then vanished." Configuring
> Supabase (Section 2) fixes this permanently.

---

## 4. Deploy the frontends to Vercel

Each app deploys as its own Vercel project (a `vercel.json` is already in each folder):

- **Captive portal:** New Project → Root Directory: `captive-portal-app` → set env var
  `VITE_API_URL` to your Render URL → Deploy.
- **Dashboard** (optional, if you don't want to rely on the bundled copy from Render):
  New Project → Root Directory: `dashboard-app` → same `VITE_API_URL` → Deploy.

---

## Sales / Services & Test Drive booking

The captive portal has a **Sales / Services** tab switcher:

- **Sales** — new model showcase, "Explore Models" grid (Swift, Baleno, Brezza, Grand
  Vitara, Dzire, Ertiga, Jimny, Eeco, True Value pre-owned), and a **"Pre-book a Test
  Drive"** button that opens a booking modal (pick a model + time slot).
- **Services** — service center booking, insurance & warranty desk info.

Submitting a test drive booking `POST`s to `/api/testdrives`. The dashboard polls
that same endpoint every 10 seconds, and any newly-seen booking:
- appears in the **Test Drives** tab (in the sidebar, just above **Connectors**) with
  customer name/phone/email, vehicle model, date, time slot, and showroom
- triggers a notification-bell entry + chime, same as the existing "new customer
  checked in" popup

Staff can move a booking through **Requested → Confirmed → Completed** (or
**Cancelled**) from the Test Drives table.

---

## MCP server

`mcp-server/` wraps this same API as MCP tools — list/confirm test drives, look up
customers and orders, manage coupons, etc. in natural language instead of calling the
REST endpoints directly. Two ways to use it:

- **Remote connector (claude.ai, ChatGPT)** — a Streamable HTTP endpoint at `/mcp` is
  already mounted on this same `server/`, so once it's deployed to Render your
  connector URL is just `https://your-app.onrender.com/mcp`. No separate hosting.
- **Local (Claude Desktop, Claude Code)** — `mcp-server/index.js` runs as a stdio
  process via your MCP config.

See `mcp-server/README.md` for step-by-step setup for both, including exactly where
to click in claude.ai's and ChatGPT's current settings UI.

## API reference

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api/menu/:storeId` | Store info + offers |
| POST | `/api/customers` | Wi-Fi captive-portal check-in (creates/updates customer, redeems coupon) |
| GET | `/api/customers` | List customers |
| GET | `/api/activity` | Recent visit log |
| GET / POST | `/api/coupons` | List / create coupons |
| GET / POST | `/api/redemptions` | List / create coupon redemptions |
| POST | `/api/order` | Place an order (updates spend, VIP tier, redeems coupon if applicable) |
| GET | `/api/orders` | List orders |
| POST | `/api/feedback` | Submit customer feedback |
| GET | `/api/feedbacks` | List feedback |
| POST | `/api/testdrives` | Submit a "Pre-book a Test Drive" booking from the captive portal |
| GET | `/api/testdrives` | List test drive bookings (dashboard Test Drives tab) |
| PATCH | `/api/testdrives/:id` | Update a booking's status (Requested → Confirmed → Completed, or Cancelled) |
| GET | `/api/marketplace/:email` | A customer's Axionik Marketplace activity (movie bookings, restaurant reservations, retail orders) |
| POST | `/mcp` | Streamable HTTP MCP endpoint — use as your claude.ai / ChatGPT connector URL (see "MCP server" above) |

---

## Marketplace activity integration

The dashboard's customer detail modal and Connectors tab show a customer's retail
order activity pulled from a separate "Axionik-Marketplace" Supabase project —
matched by **email**. This is a genuinely different Supabase project from the one in
Section 2 (it has its own `retail_orders`, `app_users`, `products`, plus unrelated
tables like `movies`/`restaurants`/`bookings` from other apps sharing that project) —
don't merge them or point both sets of env vars at the same database.

Set these on the server (`server/.env`, or as Render env vars) to enable it:

```
MARKETPLACE_SUPABASE_URL=...
MARKETPLACE_SUPABASE_KEY=...
```

**Confirmed schema** (verified 2026-08-30 against the live project — see the comment
block at the top of `server/src/routes/marketplace.js` for the authoritative version):

| Table | Columns this integration reads |
|---|---|
| `retail_orders` | `id`, `user_id`, `line_items` (jsonb), `base_amount`, `discount_amount`, `final_amount`, `status`, `source`, `source_client`, `payment_ref`, `created_at`, `confirmed_at` |
| `app_users` | `id`, `full_name`, `phone`, `email`, `created_at` |
| `products` | `id`, `name`, `brand`, `base_price` |

If this project's schema changes again in the future, you'll see errors like `Could
not find the table 'public.retail_orders'` or `column retail_orders.user_id does not
exist` — re-run the diagnostic query below against the Marketplace project and update
`server/src/routes/marketplace.js` to match:

```sql
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in ('retail_orders', 'app_users', 'products')
order by table_name, ordinal_position;
```

`line_items` is `jsonb`, so that query can't show what's inside each line item —
`marketplace.js` tries a couple of likely key-name variants (`product_id`/`productId`,
`quantity`/`qty`) so small drift there doesn't silently blank out every order line. If
items still show as generic "1x Item" instead of a real product name, pull a sample
row's `line_items` value and update the candidate key lists in that file.

Also double-check the key type: if it's `sb_publishable_...`, that's a publishable
key subject to Row Level Security. If a table doesn't have a public-read RLS policy,
these queries return empty rather than erroring — check Authentication → Policies on
that table if the panel stays empty for a customer you know has activity.

**Don't have a real second project for this?** Simply don't set the two env vars
above (or remove them if set by mistake) — every route in `marketplace.js` already
has a clean fallback (`marketplace_ready: false`), so the Connectors tab and customer
modal just show a quiet "not configured" message instead of erroring.

---

## Troubleshooting

**Connectors tab shows `Could not find the table 'public.retail_orders'` or a
`column ... does not exist` error**
The Marketplace Supabase project's schema has drifted from what
`server/src/routes/marketplace.js` expects. Run the diagnostic query in "Marketplace
activity integration" above against that project's SQL Editor, compare the result to
the confirmed-schema table there, and update the query/column names in
`marketplace.js` to match. (If you don't actually have a separate Marketplace
project, the simpler fix is to remove `MARKETPLACE_SUPABASE_URL`/
`MARKETPLACE_SUPABASE_KEY` from Render entirely — see that section for details.)

**Marking a test drive "Confirmed" or "Mark Done" reverts back to "Requested" on refresh**
This was a real bug in an earlier version of the dashboard: status changes only updated
local React state and were never sent back to the server, so the next poll (or a page
refresh) overwrote them with whatever status was still stored in the database. Already
fixed — status changes now `PATCH /api/testdrives/:id`, which persists to Supabase (or
this process's in-memory store if Supabase isn't configured).

**Test drive bookings / customer check-ins don't reach the dashboard at all**
Almost always a `VITE_API_URL` problem. If the captive portal is deployed on a
different domain from the backend and `VITE_API_URL` wasn't set at build time, every
API call from the portal silently fails (the on-screen confirmation still shows,
since the UI doesn't block on the network call). Set `VITE_API_URL` in that
project's env vars and redeploy.

**Data appears once, then vanishes after ~15–20 seconds**
Supabase isn't configured (or the required table doesn't exist yet), so the server
is holding data only in memory. On Render's free tier, an idle instance sleeps and
cold-starts on the next request, wiping that memory. Follow Section 2 to set up
Supabase — once connected, data survives restarts.

**A test drive or order shows an ID starting with `RAY-` instead of `MS-`**
That was a leftover from an earlier version of this project's database trigger
(`docs/supabase_schema.sql`) generating `RAY-ORD-...` order IDs — already fixed in
this copy. If you ran an older version of that SQL script against your Supabase
project, re-run the current `docs/supabase_schema.sql` (the `CREATE TABLE IF NOT
EXISTS` / `CREATE OR REPLACE FUNCTION` statements are safe to re-run) to pick up the
fix.

**An old coupon code (`FESTIVE20`, `BEAUTYBUY2`, `ENDOFSEASON50`) shows up**
Those were the original template's seed coupons. If your `coupons` table already got
seeded with them before this fix, delete those four rows manually in Supabase's
Table Editor — the corrected codes (`ACCESSORIES20`, `SERVICEBUY2`, `TESTDRIVE50`,
`FIRSTCITIZEN15`) will populate on the next `/api/coupons` call.

**The ESP32 firmware still shows old branding/content**
`firmware/esp32_captive_portal/portal_html.h` embeds a frozen, pre-built copy of the
captive portal's compiled HTML for offline use. It needs to be regenerated from a
fresh `npm run build` of `captive-portal-app` and re-embedded — it isn't kept in
sync automatically.

---

## What changed from the original template

- Backend rewritten from Python/FastAPI (two overlapping Firebase + Supabase
  implementations) into one clean Express + Supabase service — no service-account
  JSON secrets to manage, matches a Supabase-first stack.
- Full rebrand from the original clothing-retail template to Maruti Suzuki
  automotive sales & service: mock catalog, inventory, orders, coupons, and
  dashboard copy all replaced; captive portal restructured into Sales / Services
  tabs with a Pre-book a Test Drive flow.
- Added the `testdrives` table/API/dashboard tab described above.
- Fixed a hardcoded `http://localhost:8000` fallback in the captive portal's API
  config that would silently break every request in a production deploy without
  `VITE_API_URL` set.
- Fixed a leftover `RAY-ORD-` prefix baked into a Supabase database trigger, and
  stale seed-coupon data left over from the original template.
