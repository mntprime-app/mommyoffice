# MommyOffice — Consolidated Registry
**Single source of truth for all bugs, known issues, and system state.**  
Replaces `Bug_Registry.md`. Do not create separate bug registry files.

---

## System Architecture State

### Domain & Hosting

| Item | Value |
|------|-------|
| Primary domain | `https://mommyoffice.com` (non-www, Production in Vercel) |
| www redirect | `www.mommyoffice.com` → 308 Permanent Redirect → `mommyoffice.com` |
| Hosting | Vercel (Hobby plan) |
| Database | Supabase (Free tier) |
| CDN / Video | Cloudflare Stream |
| Email | Brevo (`noreply@mommyoffice.com`) |
| Payments | QPay (Mongolia) |

### Environment Variables (Vercel Production)

| Var | Purpose |
|-----|---------|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-B90QQE5FH0` — GA4 Measurement ID |
| `NEXT_PUBLIC_GOOGLE_VERIFICATION` | GSC ownership verification tag |
| `NEXT_PUBLIC_SITE_URL` | `https://mommyoffice.com` — set at domain cutover |
| `MC_ENCRYPTION_KEY` | QPay credential encryption — NEVER regenerate once set |
| Supabase vars | Service role key, anon key, project URL |

**Security rules (permanent):**
- `MC_ENCRYPTION_KEY`: never regenerate once QPay credentials are saved to `mo_business_settings`
- `.env.local`: NEVER commit, never upload
- `*.key.txt`, `*-key.txt`, `*-secret.txt`, `*-credentials.txt`: permanently gitignored
- `src/middleware.ts`: NEVER create — all edge middleware lives in `src/proxy.ts`
- Enrollment gate: always enforced in `learn/page.tsx` via `mo_user_email` cookie
- `/api/admin/*` routes: all protected via `proxy.ts` + `assertAdmin()` double gate (since BUG-098 fix)

### Key Source Files

| File | Role |
|------|------|
| `src/lib/seo.ts` | Centralized SEO utility — `buildMetadata()`, `jsonLdWebSite()`, `jsonLdOrganization()`, `jsonLdArticle()` |
| `src/app/layout.tsx` | Root layout — GA4, Organization+WebSite JSON-LD, global metadata |
| `src/app/sitemap.ts` | XML sitemap — static pages + dynamic courses/articles/videos via `createAdminClient()` |
| `src/components/GoogleAnalytics.tsx` | GA4 gtag component |
| `next.config.ts` | CSP headers — all GA4/GTM domains whitelisted |
| `src/proxy.ts` | Edge middleware — auth gates for admin + API routes |

### Analytics & Search

| Item | Value / Status |
|------|---------------|
| GA4 Measurement ID | `G-B90QQE5FH0` |
| GA4 data collection | ✅ Active (CSP unblocked 2026-09-19, commit `d966e6c`) |
| GSC Property | `https://mommyoffice.com` (URL-prefix, verified) |
| GSC Sitemap | `https://mommyoffice.com/sitemap.xml` — Status: Success, 16 pages (2026-09-19) |
| Article JSON-LD | ✅ Live on all article pages (commit `d966e6c`) |
| Organization JSON-LD | ✅ Live on every page via root layout (commit `d966e6c`) |
| WebSite JSON-LD | ✅ Live on every page via root layout (commit `d966e6c`) |

---

## Bug Registry

### Status Key
- **FIXED** — Resolved, code/config change deployed
- **OPEN** — Not yet resolved
- **KNOWN** — Deferred by design / workaround in place
- **RESOLVED** — Confirmed closed, no further action needed

---

### BUG-001 — Git HEAD.lock blocks commits

**Status:** FIXED (workaround, recurring)  
**Symptom:** `git commit` fails with "fatal: Unable to create '.git/HEAD.lock': File exists"  
**Root cause:** Windows file lock on `.git/HEAD.lock` or `.git/index.lock`  
**Fix:** Run from PowerShell:
```powershell
Remove-Item "F:\MNT\Workspace\GLink Strategic Projects\mommyoffice\.git\HEAD.lock" -Force
Remove-Item "F:\MNT\Workspace\GLink Strategic Projects\mommyoffice\.git\index.lock" -Force
```
Then commit and push normally. Occurs intermittently.

---

### BUG-002 — Hardcoded `mommyoffice-smoky.vercel.app` in 3 files

**Status:** FIXED (2026-08-27)  
**Files fixed:** `api/qpay/create/route.ts`, `api/qpay/check/route.ts`, `courses/[slug]/page.tsx` ShareButton  
**Fix:** Changed to `process.env.NEXT_PUBLIC_SITE_URL || 'https://mommyoffice.com'`

---

### BUG-003 — Article hero gradient covering subject's face

**Status:** FIXED (2026-08-27)  
**Fix:** Removed all hero image gradients. Layout: stacked text header → pure photo → body.

---

### BUG-004 — Article detail: three misaligned width containers

**Status:** FIXED (2026-08-27)  
**Fix:** Wrapped all content in single `mo-detail-grid` (max-width 1200px).

---

### BUG-005 — Sidebar showing on mobile despite `display: none`

**Status:** FIXED (2026-08-27)  
**Root cause:** Inline `style={{ display: 'flex' }}` overrode stylesheet rule (inline wins specificity)  
**Fix:** `@media (max-width: 1024px) { .mo-detail-grid > aside { display: none !important; } }`

---

### BUG-006 — Python `zip` CLI fails on Windows-mounted paths

**Status:** FIXED (workaround)  
**Fix:** Use Python `zipfile` module instead of CLI for all docx repacking tasks.

---

### BUG-007 — `/mn/access` returns 404

**Status:** FIXED (2026-08-30)  
**Fix:** Created `src/app/[locale]/access/page.tsx` — unified two-tab hub (Сурагч + Багш).

---

### BUG-008 — Brevo SPF/DKIM not configured for noreply@mommyoffice.com

**Status:** FIXED (2026-09-17, S30)  
**Root cause chain:**
1. S29: GoDaddy SMS rate limit blocked DNS record saves mid-way — 6 of 7 records never saved
2. S30: DNS confirmed NXDOMAIN for 6 records; pre-existing GoDaddy DMARC `p=quarantine` gave false "match" in Brevo

**Fix:** All 13 DNS records added to GoDaddy — TXT `@`, CNAME `brevo1._domainkey`, CNAME `brevo2._domainkey`, TXT `_dmarc`, CNAME `mail`, CNAME `r.mail`, CNAME `img.mail`  
**Result:** Brevo shows ● Authenticated + ● Branded ✅

---

### BUG-009 — Trending section alignment (4-iteration loop)

**Status:** FIXED (2026-08-27, 4th attempt)  
**Root cause:** Uniform padding on bordered list items — first item needed `pt-0`, last needed `pb-0`  
**Fix:** `flex: 1` per item + `paddingTop: isFirst ? 0 : 10px, paddingBottom: isLast ? 0 : 10px`

---

### BUG-010 — Admin orders page silently showed 0 orders

**Status:** FIXED (2026-09-17, commit `2c1b5a0`)  
**Root cause:** SELECT included `product_type` column that doesn't exist in `mo_orders` → Supabase error → `data` null → 0 rows with no error check  
**Fix:** Removed `product_type` from SELECT. Added `console.error` on `ordersError`.  
**Lesson:** Always destructure `{ data, error }` and log the error. Silent null = silent failure.

---

### BUG-089 — CF Stream "This content is blocked" regression

**Status:** FIXED (2026-09-16, commits `17c1139` → `d42beaa` → `0e11fc6`)  
**Root cause chain (3 stacking issues):**
1. `/api/stream/token` fallback used `${token}` instead of `${videoId}`
2. Wrong Vercel env var pasted into `CF_STREAM_KEY_SECRET`
3. `crypto.subtle.sign()` produces valid-looking JWT that CF rejects — undetectable server-side
4. Post-JWT-removal URL used wrong iframe suffix format

**Fix:** Removed CF JWT signing entirely. Direct embed: `https://iframe.cloudflarestream.com/${videoId}`. Enrollment gate still enforced via cookie.  
**Lesson:** Never store 2KB JWK in Vercel env var UI — truncation creates structurally valid but broken key.

---

### BUG-091 — "Failed to fetch" on video TUS upload (CSP connect-src)

**Status:** FIXED (2026-09-16, commit `6826296`)  
**Root cause:** CSP `connect-src` missing `https://upload.cloudflarestream.com`  
**Fix:** Added to `connect-src` in `next.config.ts`

---

### BUG-092 — Ad form: "Зураг"/"Видео" buttons not opening file pickers

**Status:** FIXED (2026-09-16, commit `2ac682a`)  
**Root cause:** Buttons were type-label toggles only; no hidden `<input type="file">` refs attached  
**Fix:** Added three hidden file inputs with React refs. Buttons call `ref.current?.click()`.

---

### BUG-093 — Ad form: selecting same file twice did nothing

**Status:** FIXED (2026-09-16, commit `2ac682a`)  
**Root cause:** `<input type="file">` value never reset after upload → `onChange` didn't fire  
**Fix:** Added `e.target.value = ''` at start of `handleMediaUpload`

---

### BUG-094 — Video ad preview black / not playing

**Status:** FIXED (2026-09-16, commit `f27694e`)  
**Fix:** Added `autoPlay muted loop controls playsInline` + `key={form.media_url}` to preview `<video>`

---

### BUG-095 — Video ads not loading in browser (CSP media-src)

**Status:** FIXED (2026-09-16, commit `bdba7f6`)  
**Root cause:** CSP `media-src` missing `https://*.supabase.co` and `https://*.supabase.in`  
**Fix:** Added both to `media-src` in `next.config.ts`  
**Note:** `media-src` controls `<video>`/`<audio>` — distinct from `connect-src` and `img-src`.

---

### BUG-096 — `mo_reviews.user_id NOT NULL` blocked migrated reviews

**Status:** FIXED (2026-09-16, Supabase migration)  
**Fix:** `ALTER TABLE mo_reviews ALTER COLUMN user_id DROP NOT NULL;`

---

### BUG-097 — CourseOutline accordion crashes page on expand

**Status:** FIXED (2026-09-16, commit `e5ec523`)  
**Root cause chain:**
1. DB stores module name as `title` key; component read `section` → blank titles
2. DB stores lessons as objects; component rendered `{lesson}` directly → "Objects are not valid as a React child" → hard page crash
3. Cast `outline as { section: string; lessons: string[] }[]` hid both mismatches at compile time

**Fix:** Proper transform IIFE in `courses/[slug]/page.tsx` — maps `m.title ?? m.section` and `lesson.title || lesson`.

---

### BUG-098 — `/api/admin/*` routes had zero authentication

**Status:** FIXED (2026-09-16, commit `762ea69`)  
**Root cause:** `proxy.ts` matcher excluded all `api/` paths; admin auth only ran on page routes  
**Affected routes:** `/api/admin/delete-stream`, `/api/admin/approve-video`, `/api/admin/cf-video-meta`, `/api/admin/staging-preview`, `/api/video/request-upload`, `/api/course-staging/presign`  
**Fix:**
1. Extended `proxy.ts` matcher to include `/api/admin/:path*`, `/api/video/request-upload`, `/api/course-staging/presign`
2. Added `privilegedApiPattern` check returning 401 JSON for non-admin callers
3. Added `assertAdmin()` in every server action as second layer

---

### BUG-099 — cf-key.txt credential file left in working directory

**Status:** FIXED (2026-09-18, commit `54b2586`)  
**Root cause:** Prior session generated `cf-key.txt` as local note for CF Stream signing key setup. Never added to `.gitignore`.  
**Fix:** Added `cf-key.txt` + wildcards (`*-key.txt`, `*-secret.txt`, `*-credentials.txt`) to `.gitignore`. File deleted from disk.  
**Note:** Keys were already unused — JWT signing removed in BUG-089. No rotation required.

---

### BUG-100 — GA4 silently blocked by own CSP since launch (CRITICAL)

**Status:** FIXED (2026-09-19, commit `d966e6c`)  
**Symptom:** Zero analytics data collected since site launch — GA4 dashboard showed no users  
**Root cause:** CSP `script-src` did not include `https://www.googletagmanager.com`. Browser silently blocked the GA4 script load. No console error shown to end users.  
**Fix:** Added to `next.config.ts` CSP headers:

| Directive | Added |
|-----------|-------|
| `script-src` | `https://www.googletagmanager.com` |
| `connect-src` | `https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://stats.g.doubleclick.net` |
| `img-src` | `https://www.google-analytics.com https://www.googletagmanager.com` |

**Lesson:** Always test CSP with browser Network tab filtering for `analytics` / `googletagmanager` after any CSP change. Blocked scripts are silent — no visible error, no 4xx in user-facing console.

---

### BUG-101 — Sitemap dynamic pages missing (RLS blocked `createClient`)

**Status:** FIXED (2026-09-19, commit `4103ccd`)  
**Symptom:** GSC reported only 16 pages discovered; zero course/article/video URLs in sitemap  
**Root cause:** `sitemap.ts` used `createClient()` (public anon client, subject to RLS). The `mo_courses`, `mo_articles`, and `mo_videos` tables require authenticated/admin access. All three queries silently returned empty arrays.  
**Fix:** Replaced all three `createClient()` calls with `createAdminClient()` (service role, bypasses RLS) in `src/app/sitemap.ts`  
**Lesson:** Any server-side query that reads content tables must use `createAdminClient()`. `createClient()` in a server context uses the anon key — it still hits RLS and returns empty if policies require auth.

---

### BUG-102 — Canonical domain mismatch (www vs non-www)

**Status:** FIXED (2026-09-19 — Vercel Settings only, no code deploy)  
**Symptom:** `https://mommyoffice.com` did a 308 redirect to `https://www.mommyoffice.com`, but all code, GSC property, sitemap, and OG/canonical URLs used non-www. Canonical mismatch = Google may index the wrong version.  
**Root cause:** Vercel Domains was configured with `www.mommyoffice.com` as the Production domain and `mommyoffice.com` as the redirect target — backwards from code.  
**Fix (Vercel → Settings → Domains):**
- `mommyoffice.com` → **Production** (primary, serves directly)
- `www.mommyoffice.com` → **308 Permanent Redirect → `mommyoffice.com`**

**Lesson:** Primary Vercel domain must exactly match `metadataBase`, sitemap `BASE`, `og:url`, GSC property URL, and `alternates.canonical`. Check all five every time a domain is configured.

---

## Known Issues

### KNOWN-001 — `NEXT_PUBLIC_SITE_URL` Vercel env var

**Status:** RESOLVED (set at domain cutover S28)  
**Note:** `NEXT_PUBLIC_SITE_URL=https://mommyoffice.com` is set. All QPay and share URLs use it correctly.

---

### KNOWN-002 — Course player not implemented

**Status:** RESOLVED (CF Stream iframe embed live, enrollment gate active)  
**Note:** Videos stream from `iframe.cloudflarestream.com`. JWT signing removed (BUG-089). Direct embed with server-side enrollment check.

---

### KNOWN-003 — Mobile audit pending for core pages

**Status:** RESOLVED (2026-09-18, commit `a3125fe`)  
**Note:** Full mobile audit completed S34. CoursePlayer sidebar and post-purchase OTP friction both fixed. All main pages verified on 375px.

---

### KNOWN-004 — `/mn/instructor/login` page not yet built

**Status:** DEFERRED — Phase 2  
**Note:** `/access` Багш tab links to this page. 404 until built. Phase 2 work.

---

### KNOWN-005 — `qpay_username` column may be missing from `mo_instructors`

**Status:** NEEDS VERIFICATION  
**Note:** First Supabase migration screenshot had lines 2–3 cut off. `qpay_username` TEXT column may not have been added. Verify in Supabase table editor before implementing per-instructor QPay routing.

---

### KNOWN-006 — Cloudflare Stream Webhooks UI not visible in free plan

**Status:** KNOWN / WORKAROUND IN PLACE  
**Symptom:** CF dashboard → Stream → Webhooks shows blank; no Webhooks nav item on free plan  
**Root cause:** Webhooks UI only appears after paid Stream plan  
**Workaround:** Webhook registered via REST API (PUT /accounts/{id}/stream/webhook). Secret in env vars. Webhook fires correctly on video encoding completion. Not a blocker.

---

## SEO Architecture State (as of 2026-09-19)

| Component | Implementation | File |
|-----------|---------------|------|
| Centralized metadata | `buildMetadata()` utility | `src/lib/seo.ts` |
| Article structured data | `jsonLdArticle()` — JSON-LD per article page | `articles/[slug]/page.tsx` |
| Organization structured data | `jsonLdOrganization()` — global, every page | `src/app/layout.tsx` |
| WebSite structured data | `jsonLdWebSite()` — global, every page | `src/app/layout.tsx` |
| Course structured data | Not yet implemented | — |
| hreflang | `mn` / `en` alternates in `buildMetadata()` | `src/lib/seo.ts` |
| Canonical URLs | `metadataBase: https://mommyoffice.com`, `alternates.canonical` per page | all page.tsx files |
| Sitemap | Dynamic — courses + articles + videos via admin client | `src/app/sitemap.ts` |
| GSC | Verified, sitemap submitted ✅ | — |
| GA4 | Active, CSP unblocked ✅ | `src/components/GoogleAnalytics.tsx` |
| robots.txt | Default Next.js (allow all) | — |

---

## Pending / Future Work

| Item | Priority | Notes |
|------|----------|-------|
| Check GA4 Realtime | Next session | Confirm data flowing post-CSP fix |
| Validate rich results | Next session | `search.google.com/test/rich-results` on article URL |
| Check GSC pages | 24–48h | Dynamic course/article URLs should appear after re-crawl |
| `/mn/instructor/login` | Phase 2 | Full instructor portal |
| `generateStaticParams` + ISR | Medium | Improve LCP for course/article pages — be careful with enrollment gate |
| Course JSON-LD | Medium | Add Schema.org Course structured data |
| Vercel Pro | When traffic warrants | $20/mo |
| Supabase Pro | When traffic warrants | $25/mo |
| QPay subscription / recurring billing | Future | — |
| SQL migrations for video episodes/series | Future | Docs in `MommyOffice_SQL_Migrations.pdf` |
| Facebook cover banner | Ready | `xplore (1).png` ready for upload |
| Comment section under videos | Future | — |
| Customer profile / My Account | Future | — |
