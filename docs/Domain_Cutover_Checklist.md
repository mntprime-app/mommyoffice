# MommyOffice — Domain Cutover Checklist
**Target:** `mommyoffice.com` → Vercel  
**Status:** ⏳ Waiting for content population to complete

---

## ✅ Pre-Cutover Code Audit — COMPLETED (2026-08-27)

All 3 hardcoded `mommyoffice-smoky.vercel.app` references fixed:
- `src/app/api/qpay/create/route.ts` — fallback updated to `mommyoffice.com`
- `src/app/api/qpay/check/route.ts` — fallback updated to `mommyoffice.com`
- `src/app/[locale]/courses/[slug]/page.tsx` — ShareButton URL now uses env var

Routing, metadata, canonical, auth redirects, DB slugs — all domain-ready. No migration needed.

---

## 🚀 Cutover Steps (when content is ready)

### Step 1 — Vercel Environment Variable
In Vercel Dashboard → Project → Settings → Environment Variables → **Production**:
```
NEXT_PUBLIC_SITE_URL = https://mommyoffice.com
```

### Step 2 — Connect Domain in Vercel
Vercel Dashboard → Project → Settings → Domains → Add `mommyoffice.com`

### Step 3 — GoDaddy DNS
Log into GoDaddy → DNS Manager for `mommyoffice.com`:
- **A record:** `@` → `76.76.21.21` (Vercel IP)
- **CNAME:** `www` → `cname.vercel-dns.com`
- TTL: 600 (10 min for fast propagation)

### Step 4 — Supabase Auth
Supabase Dashboard → Authentication → URL Configuration:
- Site URL: `https://mommyoffice.com`
- Redirect URLs: add `https://mommyoffice.com/mn/auth/callback`

### Step 5 — QPay (if live payments active)
Notify QPay support that callback domain has changed to `mommyoffice.com` (if required by their merchant agreement).

### Step 6 — Cloudflare Stream
Stream Dashboard → Videos → Allowed Origins:
- Keep `mommyoffice-smoky.vercel.app` (preview/staging)
- Add `mommyoffice.com`

### Step 7 — Brevo SPF/DKIM
- Verify `noreply@mommyoffice.com` DNS records in Brevo → Senders & Domains
- SPF: TXT record on `mommyoffice.com`
- DKIM: CNAME records from Brevo

### Step 8 — Verify
- [ ] `https://mommyoffice.com/mn` loads correctly
- [ ] Article slugs resolve
- [ ] QPay test payment completes
- [ ] Email magic link redirects to `mommyoffice.com`
- [ ] SSL certificate issued (Vercel auto-provisions)

---

## 📋 Remaining Content to Populate (before cutover)
- [ ] Money Talk article
- [ ] Mom Hacks article  
- [ ] Ээжүүдийн хобби article
- [ ] Шинэхэн ээжүүд article
- [ ] Дотно харилцаа article (postpartum intimacy — image in progress)

---

## ✅ Post-Cutover Task List
*Complete these IN ORDER immediately after DNS propagates and `mommyoffice.com` resolves.*

### 🔴 CRITICAL — Do first (blocking launch)

- [ ] **Cloudflare Stream — add allowed origin** `mommyoffice.com`
  → CF Dashboard → Stream → Settings → Allowed Origins → Add `mommyoffice.com`
  → ⚠️ Without this, ALL course videos will show "This video is restricted" on the live domain

- [ ] **Vercel — set env var + redeploy**
  → Settings → Environment Variables → Production:
  `NEXT_PUBLIC_SITE_URL = https://mommyoffice.com`
  → Trigger a new deployment after saving

- [ ] **Supabase Auth — add redirect URL**
  → Authentication → URL Configuration:
  - Site URL: `https://mommyoffice.com`
  - Add to Redirect URLs: `https://mommyoffice.com/mn/auth/callback`

- [ ] **Brevo — verify `noreply@mommyoffice.com` sender domain**
  → Brevo Dashboard → Senders & Domains → Add Domain → `mommyoffice.com`
  → Copy SPF TXT record + DKIM CNAME records → add to GoDaddy DNS
  → This also fixes the welcome email in the Access Grant admin panel (Option A)

### 🟡 IMPORTANT — Do same day

- [ ] **Fix missing Хичээл 2** in Module 1 of easyenglish course
  → `/mn/admin/courses/easyenglish` → add lesson to Module 1

- [ ] **Add instructor records** at `/mn/admin/instructors`
  → Add course instructor name, photo, bio

- [ ] **Delete sensitive .ps1 scripts** before any public exposure
  → Delete from repo root: `disable-signed-urls.ps1`, `generate-cf-key.ps1`,
    `verify-cf-body.ps1`, `clear-allowed-origins.ps1`, `set-allowed-origins.ps1`,
    `verify-frame-ancestors.ps1`
  → Also delete: `cf-key.txt`
  → Commit: `git rm *.ps1 cf-key.txt && git commit -m "cleanup: remove sensitive scripts before launch"`

### 🟢 SOON — Within first week

- [ ] **Populate 5 articles** at `/mn/admin/articles`
  (see "Remaining Content to Populate" above)

- [ ] **Mobile audit** — test `/mn`, `/mn/courses`, `/mn/videos` on real phone (KNOWN-003)

- [ ] **Upgrade plans**
  - Vercel Pro: $20/mo (removes 100GB bandwidth cap)
  - Supabase Pro: $25/mo (removes 500MB DB limit, enables daily backups)

- [ ] **QPay** — notify QPay support of domain change to `mommyoffice.com` if required

### 🔵 POST-LAUNCH — Phase 2 (not blocking)

- [ ] Restore CF Stream signed tokens (see Bug Registry — "Restoring signed tokens" SOP)
- [ ] Upload first ad at `/mn/admin/ads` once advertiser signed
- [ ] Build `/mn/instructor/login` page (KNOWN-004)
- [ ] GLink Task #8: Contact Danford College
- [ ] GLink Task #9: Rewrite SOP Section 3 for Danford College

---

## 🧪 Post-Cutover Smoke Tests

Run these after all CRITICAL steps above are done:

- [ ] `https://mommyoffice.com/mn` — home page loads, no broken images
- [ ] `https://mommyoffice.com/mn/courses/easyenglish` — course detail loads
- [ ] Course video plays (CF Stream allowed origins working)
- [ ] Magic link email login → redirects to `mommyoffice.com` ✓
- [ ] QPay: create test order → QR code → payment → access granted
- [ ] Admin access grant: grant email → grantee can log in and watch videos
- [ ] Welcome email from `noreply@mommyoffice.com` arrives in inbox (not spam)
- [ ] SSL padlock ✓ (Vercel auto-provisions, takes ~2 min)
