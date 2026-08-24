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

## Next Session — Resume Command

Open Cowork and say:

> **"Alex, continue Mommyoffice. Read SESSION_NOTES_2026_08_24.md first."**

Alex will load this file and pick up exactly where we left off.
