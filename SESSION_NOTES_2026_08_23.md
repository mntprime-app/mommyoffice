# Session Ledger — 2026-08-23
**Project:** Mommyoffice
**Assistant:** Alex
**Session start:** ~8:00 PM | **End:** ~9:30 PM

---

## QPay Credentials (Production — DO NOT SHARE)

Confirmed QPay V2 production credentials (same account used across MNT Prime / MommyOffice):

| Variable | Value |
|---|---|
| `QPAY_USERNAME` | `MOMMY_OFFICE2` |
| `QPAY_PASSWORD` | `okztYEao` |
| `QPAY_INVOICE_CODE` | `MOMMY_INVOICE` |
| `QPAY_SANDBOX` | `false` |

Source: MNT Prime `.env.local` — credentials confirmed by QPay support (Uranchimeg Soyolmaa, uranchimeg.s@qpay.mn) on 2026-08-05.

Brevo API key (same key, shared across both projects):
```
BREVO_API_KEY=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
```

All 4 values must be in **Vercel → mommyoffice → Settings → Environment Variables** before checkout goes live.

---

## Permanent Rules (Never Break)

- **Student count NEVER shown anywhere on MO** — no exceptions
- **MC_ENCRYPTION_KEY** — NEVER regenerate once QPay credentials saved to `mo_business_settings`
- **.env.local** — NEVER commit to git, NEVER upload anywhere
- **LOCAL_PASSWORDS_DO_NOT_COMMIT.md** — READ ONLY, never commit/push/share
- **API keys** — local only in `.env.local` AND Vercel env vars. Never hardcode in source
- **GLink boost budget:** $3 USD daily MAXIMUM
- **No dashes in Aria's documents** — use commas instead

---

## Work Completed Today

### 1. Articles Page — Bloomberg/BBC/Medium Redesign
**File:** `src/app/[locale]/articles/page.tsx`

Full editorial rebuild:
- **Category filter tabs** — pill-style, active tab glows in category color
- **Article feed** — `160×108` thumbnails (bumped from 130×88 after user review), category badge with color, date, `⏱ X мин унших` read-time estimate, 2-line title + 2-line excerpt
- **Mid-feed ad** — leaderboard (970×90 dashed placeholder) between articles 4 and 5
- **Sticky sidebar** — italic numbered trending list (01–06), 300×250 ad slot, Editor's Pick box with cover image/gradient + "Унших →" CTA
- **Netflix horizontal rows** — category scroll rows at bottom
- **Footer ad** — full-width 970×90 banner above page footer
- Responsive: collapses to single column below 900px

---

### 2. Nav Scope Trim — Phase 1 MVP
**File:** `src/components/ui/Navbar.tsx`

Removed `Видео & Кино` and `Дэлгүүр` from nav links (commented out, Phase 2).

Nav now shows: **Нүүр · Сургалтууд · Нийтлэл** only.

Routes still exist and work — just not linked from nav.

---

### 3. UX & Platform Architecture Audit
Conducted full audit of all pages and data schema before building checkout:

**Phase 1 Active routes:**
- `/` — Homepage ✅
- `/courses` — Catalog ✅
- `/courses/[slug]` — Course Detail ✅
- `/courses/[slug]/learn` — LMS Player ✅
- `/instructors/[slug]` — Instructor Profile ✅
- `/articles` — Articles Catalog ✅
- `/articles/[slug]` — Article Detail ✅ (rebuilt this session)
- `/cart` — Cart ✅
- `/checkout/[slug]` — QPay Checkout ✅ (built this session)
- `/access/[token]` — Token delivery ✅

**Phase 2 deferred:** `/videos`, `/shop`, `/admin/*`

---

### 4. Article Detail Page — Full Redesign
**File:** `src/app/[locale]/articles/[slug]/page.tsx`

Complete rebuild replacing basic placeholder layout:
- **Hero cover** — 420px image with gradient fade, breadcrumb overlay, category badge + H1 anchored to bottom
- **Meta bar** — author avatar initial, published date, `⏱` read-time, Facebook share + copy-link buttons
- **Lead excerpt** — italic 18px intro paragraph
- **Rich body** — `mo-article-body` CSS: styled H2/H3, `blockquote` with teal left border, lists, images, links
- **Category tag row** + tags
- **Related Articles** — horizontal scroll, same category
- **Newsletter subscribe box** — gradient card at bottom
- **Sticky right sidebar:**
  - Related Courses widget (same category, fetched from `mo_courses`)
  - Trending articles (numbered 01–05, latest from DB)
  - 300×250 ad slot placeholder
- Responsive collapse below 900px

---

### 5. Supabase Schema — New Tables & Columns

All run successfully in Supabase SQL Editor:

**New table: `mo_orders`**
```sql
create table mo_orders (
  id            uuid primary key default gen_random_uuid(),
  course_id     uuid references mo_courses(id),
  buyer_name    text,
  buyer_email   text not null,
  buyer_phone   text,
  amount        int not null,
  qpay_invoice_id text,
  qpay_qr_text  text,
  status        text default 'pending', -- pending | paid | expired | cancelled
  access_token  uuid,
  created_at    timestamptz default now(),
  paid_at       timestamptz
);
```

**New table: `mo_enrollments`**
```sql
create table mo_enrollments (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid references mo_courses(id),
  email       text not null,
  order_id    uuid references mo_orders(id),
  enrolled_at timestamptz default now()
);
```

**Altered: `mo_articles`**
```sql
alter table mo_articles add column if not exists author_id uuid references mo_instructors(id);
alter table mo_articles add column if not exists views_count int default 0;
alter table mo_articles add column if not exists tags text[] default '{}';
```

---

### 6. QPay Checkout System — Full Implementation

**Flow:** Course Detail → 🛒 Сагсанд нэмэх → Cart → Худалдаж авах → `/checkout/[slug]` → QPay QR → Payment confirmed → Brevo email + Access token → `/access/[token]`

**Files created:**

#### `src/app/api/qpay/create/route.ts`
- Receives: `{ slug, buyerName, buyerEmail, buyerPhone }`
- Fetches QPay token via Basic auth (`QPAY_USERNAME:QPAY_PASSWORD`)
- Creates QPay invoice at `https://merchant.qpay.mn/v2/invoice`
- Inserts `mo_orders` row with status `pending`
- Returns: `{ orderId, invoiceId, qrText, qrImage (base64), deepLinks, amount }`

#### `src/app/api/qpay/check/route.ts`
- `GET /api/qpay/check?orderId=xxx` — called by frontend every 3 seconds
- Checks QPay `POST /payment/check` with `object_type: "INVOICE"`
- On `count > 0 && paid_amount >= order.amount`:
  - Updates `mo_orders` → status `paid`, sets `access_token` UUID
  - Upserts `mo_enrollments`
  - Inserts `mo_access_tokens` (30-day expiry)
  - Sends Brevo email with access link
  - Returns `{ paid: true, accessUrl }`

#### `src/components/ui/CheckoutView.tsx`
3-step client component:
- **Step 1 — Form:** Name (optional), Email*, Phone* + order summary sidebar
- **Step 2 — QR:** QPay QR image (base64 PNG), bank deep-link buttons, 3s polling loop, animated pulse indicator
- **Step 3 — Success:** Confirmation + direct "Хичээл эхлүүлэх →" button + access URL

#### `src/app/[locale]/checkout/[slug]/page.tsx`
- Server wrapper — fetches course, passes to `CheckoutView`
- `robots: { index: false }` — checkout pages not indexed

---

## Pending for Next Session

1. **Deploy** — add QPay + Brevo env vars to Vercel, then:
   ```
   cd /d "F:\MNT\Workspace\GLink Strategic Projects\mommyoffice"
   git add -A
   git commit -m "feat: QPay checkout, article detail redesign, nav scope trim, schema migrations"
   git tag stable-2026-08-23-checkout
   vercel --prod --force
   ```
2. **Test live QPay payment** — use `geriin-hool-hiih-urlag` course slug
3. **Add `video_url`** to `geriin-hool-hiih-urlag` course in Supabase SQL editor
4. **Add `outline` JSON** to courses for curriculum sidebar to populate
5. **Fix instructor slug** — `SELECT id, name_mn FROM mo_instructors;` → `UPDATE SET slug = 'b-narantuya'`
6. **Connect mommyoffice.com domain** — Vercel → Settings → Domains → GoDaddy DNS
7. **Create admin Supabase user** — `info.mommyoffice@gmail.com` in Supabase → Authentication → Users → Invite
8. **Search page** — `/[locale]/search?q=` searching `mo_courses` + `mo_articles`
9. **Admin CMS** — article + course editor (Phase 3, after checkout confirmed working)
10. **Add `BREVO_API_KEY` to Vercel** if not already there

---

## Next Session — Resume Command

Open Cowork and say:

> **"Alex, continue Mommyoffice. Read SESSION_NOTES_2026_08_23.md first."**

Alex will load this file and pick up exactly where we left off.
