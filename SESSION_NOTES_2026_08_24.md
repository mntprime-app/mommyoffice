# Session Ledger — 2026-08-24
**Project:** Mommyoffice
**Assistant:** Alex
**Session start:** ~12:00 PM | **End:** ongoing

---

## QPay Credentials (Production — DO NOT SHARE)

| Variable | Value |
|---|---|
| `QPAY_USERNAME` | `MOMMY_OFFICE2` |
| `QPAY_PASSWORD` | `okztYEao` |
| `QPAY_INVOICE_CODE` | `MOMMY_INVOICE` |
| `QPAY_SANDBOX` | `false` |
| `BREVO_API_KEY` | `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` |

All 5 now live in **Vercel → mommyoffice → Settings → Environment Variables (Production)**.

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

## Work Completed This Session

### 1. UX Mockups — Article Detail + Checkout
Created two interactive visual mockups in Cowork:
- **Article detail** (`/articles/[slug]`): hero gradient, meta bar, blockquote body, sidebar (related course + trending + ad), related articles scroll, newsletter box
- **Checkout** (3-step interactive): Step 1 form → Step 2 QPay QR with pulse animation + bank deep-links + polling indicator → Step 3 success with access link

### 2. Vercel Env Vars — All 5 Added
Added to Production environment via `vercel env add`:
- `QPAY_USERNAME`, `QPAY_PASSWORD`, `QPAY_INVOICE_CODE`, `QPAY_SANDBOX`, `BREVO_API_KEY`

### 3. Git Commit + Deploy
```
commit 51ad26f — feat: QPay checkout, article detail redesign, nav scope trim, schema migrations
tag: stable-2026-08-24-checkout
```
- 9 files changed, 1281 insertions, 184 deletions
- **Deployed:** https://mommyoffice-smoky.vercel.app ✅ Ready in 30s

### 4. Live Verification
Checkout page confirmed live and rendering correctly:
- URL: `https://mommyoffice-smoky.vercel.app/mn/checkout/geriin-hool-hiih-urlag`
- Price: ₮19,900 (33% off), noindex set, nav trimmed ✅

---

## QPay Live Test — Results

- ✅ QR generated correctly at ₮1,000 test price
- ✅ Payment confirmed by QPay
- ✅ Success page rendered: "Төлбөр амжилттай!"
- ✅ mo_orders + mo_enrollments + mo_access_tokens rows created in DB
- ❌ Brevo email NOT received — likely sender not verified

**Email root cause found:**
- Brevo only has ONE verified sender: `mntprime.marketing@gmail.com`
- `info.mommyoffice@gmail.com` is NOT a verified sender → Brevo logs show Error on every attempt
- Gmail also blocks @gmail.com senders via third-party SMTP (DMARC)

**Quick fix (temporary):** Change `FROM_EMAIL` in Vercel to `mntprime.marketing@gmail.com` → Redeploy
**Proper fix (do when mommyoffice.com domain is connected):**
1. Connect mommyoffice.com domain in Vercel
2. Brevo → Senders → Add sender `noreply@mommyoffice.com`
3. Verify domain DNS (Brevo gives TXT/CNAME records to add in GoDaddy)
4. Update `FROM_EMAIL` in Vercel to `noreply@mommyoffice.com`
5. Update `FROM_NAME` to `Mommyoffice`
6. Redeploy

**IMPORTANT:** Revert test price before going live:
```sql
UPDATE mo_courses SET price = 19900 WHERE slug = 'geriin-hool-hiih-urlag';
```

---

## Work Completed — Session Continuation (2026-08-24 afternoon)

### 5. User Account & Student Dashboard Architecture

**Files changed:**
- `src/app/api/qpay/check/route.ts` — full rewrite:
  - Fetches `access_duration_days` from `mo_courses`
  - `expires_at = null` for lifetime courses (NULL or 0 days)
  - `supabase.auth.admin.createUser()` on payment (idempotent)
  - `supabase.auth.admin.generateLink({ type: 'magiclink', redirectTo: siteUrl + '/mn/welcome' })`
  - Magic link used as email CTA button URL
  - Email copy: "Насан туршийн хандалт" vs "Хандалтын хугацаа: [date] хүртэл"
  - Fixed siteUrl fallback → `https://mommyoffice-smoky.vercel.app`
- `src/app/api/qpay/create/route.ts` — fixed siteUrl fallback
- `src/app/[locale]/access/[token]/page.tsx` — fixed null expires_at bug (line 16)
- `src/app/[locale]/welcome/page.tsx` — NEW: magic link handler, optional password setup, redirect to /my-courses
- `src/app/[locale]/my-courses/page.tsx` — NEW: student dashboard, course cards with progress bars, lifetime/expiry badge, "Үргэлжлүүлэх →" / "Эхлүүлэх →" / "✅ Дуусгасан" CTAs

**Vercel env vars added:**
- `NEXT_PUBLIC_SITE_URL=https://mommyoffice-smoky.vercel.app`

**Supabase Auth URL Configuration:**
- Redirect URLs: added `https://mommyoffice-smoky.vercel.app/**` (MNT Prime URL untouched)

**Deployed:** commit `735dd74` → redeployed, ✅ Ready in 26s

---

## Pending for Next Session

1. **Fix Brevo email (proper)** — connect mommyoffice.com domain first, then add `noreply@mommyoffice.com` as verified sender in Brevo, update FROM_EMAIL in Vercel, redeploy. See root cause notes above.
2. **Revert price** — `UPDATE mo_courses SET price = 19900 WHERE slug = 'geriin-hool-hiih-urlag';`
3. **Add `video_url`** to `geriin-hool-hiih-urlag` course in Supabase SQL editor
4. **Add `outline` JSON** to courses for curriculum sidebar
5. **Fix instructor slug** — `UPDATE mo_instructors SET slug = 'b-narantuya' WHERE ...`
6. **Connect mommyoffice.com domain** — Vercel → Settings → Domains → GoDaddy DNS
7. **Create admin Supabase user** — `info.mommyoffice@gmail.com` → Supabase → Authentication → Users → Invite
8. **Search page** — `/[locale]/search?q=` searching `mo_courses` + `mo_articles`
9. **Admin CMS** — article + course editor (Phase 3, after email confirmed working)

---

---

## MO Bug Registry — Never Repeat These

### BUG-001 — mo_access_tokens insert silently failed (root cause of empty /my-courses)
- **Symptom:** `/my-courses` always showed empty state despite successful payments
- **Root cause:** Insert included `used: false` but `mo_access_tokens` has NO `used` column. Supabase rejects the entire insert silently (no error thrown, no row created).
- **Fix:** Removed `used: false` from insert in `src/app/api/qpay/check/route.ts`
- **Rule going forward:** Always check `mo_access_tokens` column list before inserting. Current columns: `id (uuid), token (uuid), email (text NOT NULL), course_id (uuid), expires_at (timestamptz), created_at (timestamptz)`

### BUG-002 — mo_access_tokens had no `email` column
- **Symptom:** `/api/my-enrollments` query `.eq('email', email)` returned 0 rows
- **Root cause:** Original schema had no `email` column (table was designed for token-URL access only). Added via `ALTER TABLE`.
- **Fix:** Added `email TEXT NOT NULL` column + index + backfill SQL (run 2026-08-24)

### BUG-003 — Magic link not working (PKCE flow)
- **Symptom:** `/welcome` page spun forever after clicking magic link email
- **Root cause:** `@supabase/ssr` createBrowserClient uses PKCE flow — ignores hash-based `#access_token=...` tokens automatically
- **Fix:** Manually parse `window.location.hash` → `URLSearchParams` → `supabase.auth.setSession({ access_token, refresh_token })`

### BUG-004 — Welcome page race condition (auth state)
- **Symptom:** Even after PKCE fix, sometimes showed spinner forever
- **Root cause:** `SIGNED_IN` event fired before `onAuthStateChange` listener was registered
- **Fix:** Call `getSession()` first (sync check), THEN register `onAuthStateChange` as fallback, THEN parse hash manually

### BUG-005 — NEXT_PUBLIC_SITE_URL wrong domain
- **Symptom:** Magic links pointed to `mommyoffice.com` (unconnected domain)
- **Root cause:** `siteUrl` fallback hardcoded as `https://mommyoffice.com`
- **Fix:** Added `NEXT_PUBLIC_SITE_URL=https://mommyoffice-smoky.vercel.app` to Vercel env + .env.local. Also added `https://mommyoffice-smoky.vercel.app/**` to Supabase Auth redirect URLs.

### BUG-006 — Supabase FK join silent null (mo_courses data missing)
- **Symptom:** `mo_courses` field null in enrollment results
- **Root cause:** Supabase FK join fails silently when FK not properly set up in schema
- **Fix:** Switched to two separate queries — fetch tokens, fetch courses by ID array, merge in memory

### BUG-007 — Brevo email failing (wrong FROM sender)
- **Symptom:** No welcome email received after payment
- **Root cause:** `info.mommyoffice@gmail.com` not a verified Brevo sender. Only `mntprime.marketing@gmail.com` is verified. Gmail also blocks @gmail.com as third-party sender (DMARC).
- **Fix (temporary):** FROM_EMAIL → `mntprime.marketing@gmail.com`
- **Fix (proper):** Connect `mommyoffice.com` domain → add `noreply@mommyoffice.com` as Brevo sender → verify DNS → update FROM_EMAIL in Vercel

### BUG-008 — Git HEAD.lock / index.lock recurring
- **Symptom:** `fatal: cannot lock ref 'HEAD'` on every sandbox git commit
- **Root cause:** Sandbox can't delete Windows-owned git lock files (permission denied)
- **Fix:** User runs `del "F:\MNT\Workspace\GLink Strategic Projects\mommyoffice\.git\HEAD.lock"` in CMD before each deploy command

### BUG-009 — Shared Supabase project — NEVER change Site URL
- **Rule:** Supabase project `madhsuvuoxrlywykktvz` is shared between MNT Prime and MommyOffice. Site URL must stay as `https://mntprime-app.vercel.app`. Only add MO URLs to the Redirect URLs list, never touch Site URL.

---

## Pending for Next Session

1. **Fix Brevo email (proper)** — connect mommyoffice.com domain first, then add `noreply@mommyoffice.com` as verified sender in Brevo, update FROM_EMAIL in Vercel, redeploy. See BUG-007.
2. **Revert price** — `UPDATE mo_courses SET price = 19900 WHERE slug = 'geriin-hool-hiih-urlag';`
3. **Add `video_url`** to `geriin-hool-hiih-urlag` course in Supabase SQL editor
4. **Add `outline` JSON** to courses for curriculum sidebar
5. **Fix instructor slug** — `UPDATE mo_instructors SET slug = 'b-narantuya' WHERE ...`
6. **Connect mommyoffice.com domain** — Vercel → Settings → Domains → GoDaddy DNS
7. **Create admin Supabase user** — `info.mommyoffice@gmail.com` → Supabase → Authentication → Users → Invite
8. **Search page** — `/[locale]/search?q=` searching `mo_courses` + `mo_articles`
9. **Admin CMS** — article + course editor (Phase 3, after email confirmed working)

---

## Next Session — Resume Command

Open Cowork and say:

> **"Alex, continue Mommyoffice. Read SESSION_NOTES_2026_08_24.md first."**

Alex will load this file and pick up exactly where we left off.
