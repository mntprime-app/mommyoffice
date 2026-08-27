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
