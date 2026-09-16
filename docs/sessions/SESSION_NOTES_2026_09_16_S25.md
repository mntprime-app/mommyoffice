# Session 25 — MommyOffice — 2026-09-16

**Session type:** Bug fix + launch preparation
**Status at close:** BUG-089 fully resolved. Course player playing. Registry hardened. Launch-ready.
**Next session:** This afternoon/evening — domain cutover and official launch.

---

## What Happened This Session

### Context
Session resumed from compaction (Session 24 ended with BUG-089 partially resolved). The course player at `/mn/courses/easyenglish/learn` was showing "This content is blocked" again on the CF Stream iframe. User had a firm launch deadline (same evening).

---

## BUG-089 Regression — Root Cause Chain

Three separate issues were stacking:

**Issue 1 — Wrong fallback URL in token route**
`/api/stream/token` fallback used `${token}` (the JWT variable) instead of `${videoId}`. `iframe.cloudflarestream.com` expects `/{videoId}` — passing a JWT caused CF to reject it. Fixed in commit `17c1139`.

**Issue 2 — Wrong Vercel env var (CF_STREAM_KEY_SECRET = sk_live_a12…)**
A Stripe-like key was accidentally pasted into the CF Stream signing key field during Session 24 Vercel edits. Corrected to proper `eyJ…` JWK. But this alone was insufficient because of Issue 3.

**Issue 3 — `crypto.subtle.sign()` never throws on a wrong key**
The root cause of all BUG-089 recurrences. `crypto.subtle.sign()` produces a structurally valid JWT even when signed with a wrong/corrupted key. CF's public-key check rejects it silently ("This content is blocked"). This is undetectable server-side without a round-trip to CF. The Vercel env var holding the 2KB JWK is fragile — any edit in the Vercel UI can corrupt it without warning. After two separate incidents confirming this pattern, CF JWT signing was removed from the production path entirely.

**Issue 4 — Wrong URL format after removing JWT signing**
After removing JWT signing, the new direct embed URL was written as `https://iframe.cloudflarestream.com/${videoId}/iframe` — the `/iframe` suffix is only valid for the signed customer-subdomain format (`customer-{sub}.cloudflarestream.com/{JWT}/iframe`). The unsigned host ignores the suffix and returns blocked/blank. Fixed in commit `0e11fc6`.

---

## Commits This Session

| Commit | Description |
|--------|-------------|
| `17c1139` | fix(BUG-089): harden token route — fallback URL was `${token}`, changed to `${videoId}` |
| `d42beaa` | fix(BUG-089-final): remove CF JWT signing entirely; direct embed + Supabase enrollment gate |
| `0e11fc6` | fix: correct CF Stream direct embed URL — remove erroneous /iframe suffix ← **PRODUCTION** |
| `4c67d6a` | docs: permanent CF Stream URL rules + BUG-089 invariants + Session 25 close |

---

## Final State of /api/stream/token

```typescript
// Enrollment confirmed. Return direct CF Stream embed URL.
// Unsigned direct embed. CF format: iframe.cloudflarestream.com/{videoId} — NO /iframe suffix.
const iframeUrl = `https://iframe.cloudflarestream.com/${videoId}`;

return NextResponse.json({ iframeUrl }, {
  headers: { 'Cache-Control': 'private, no-store' },
});
```

Full file: `src/app/api/stream/token/route.ts`

---

## Security Model (Without CF JWTs)

1. Returns 401 if no `mo_user_email` cookie
2. Returns 403 if user has no valid `mo_access_tokens` record covering the videoId
3. Video IDs (cloudflare_stream_id) never returned in student-facing responses
4. `requireSignedURLs=false` on all 12 CF videos (confirmed via `disable-signed-urls.ps1`)

**Known tradeoff:** A paying enrolled student could extract the videoId from browser network tab and share a direct CF URL. This requires technical knowledge. Acceptable for launch; closed by restoring signed tokens post-launch (see registry SOP).

---

## CF Video State Confirmed

`disable-signed-urls.ps1` ran successfully — all 12 videos confirmed `OK`:
- 40.1. Active voice, 3. Auxiliary verbs.mp4
- 11. 4-р шат. Үгсийн аймаг үүсдэг талаар.mp4
- 10. 3-р шат. Үгсийн аймаг өгүүлбэрт байрладаг талаар.mp4
- 8. 2-р шат. Adjective.mp4
- 9. 2-р шат. Conjuction, Adverb, Preposition, Determiners.mp4
- 7. 2-р шат. Noun, Pronoun, Verb.mp4
- 5. 1-р шат Үгийн төрөл ялгах - бүүу үгсийн аймаг.mp4
- 4. Хичээл 2 - Орон орны хэл (1).mp4
- 3. Хичээл 1 - Дүрэм чухал уу.mp4
- 1. Англи хэлний сургалтанд тавтай морил.mp4 (×2 — both versions)
- 2. Сурахуйд суралцах талаар.mp4

---

## Registry Updates This Session

1. **BUG-089 Regression entry** — root cause chain logged
2. **BUG-089 Final Resolution entry** — JWT signing removed, security model documented
3. **Fixed stale URL format** in Final Resolution (was showing `/iframe` suffix — corrected)
4. **PERMANENT RULE — CF Stream URL Format** — two formats documented, NEVER interchangeable
5. **PERMANENT RULE — CF Stream Token Route Invariants** — 5 invariants that must hold on every future edit
6. **Session 25 Close entry** — commits, CF state, pre-launch items

---

## Pre-Launch Checklist for Next Session

These must be completed before official domain launch:

- [ ] **Domain cutover** — GoDaddy DNS: `A @ 76.76.21.21`, `CNAME www → cname.vercel-dns.com`
- [ ] **Vercel env var** — set `NEXT_PUBLIC_SITE_URL=https://mommyoffice.com`, then redeploy
- [ ] **Supabase Auth** — add `https://mommyoffice.com` to allowed redirect URLs
- [ ] **Cloudflare Stream** — add `mommyoffice.com` to allowed origins (CRITICAL — videos will block on live domain without this)
- [ ] **Brevo** — SPF/DKIM for `noreply@mommyoffice.com`
- [ ] **Fix missing Хичээл 2** in Module 1
- [ ] **Add instructor records** at `/mn/admin/instructors`
- [ ] **Delete sensitive .ps1 scripts** before public launch: `disable-signed-urls.ps1`, `generate-cf-key.ps1`, `verify-cf-body.ps1`
- [ ] **Populate 5 articles** at `/mn/admin/articles`
- [ ] **Mobile audit** — `/mn/courses`, `/mn/videos`, `/mn` (KNOWN-003)
- [ ] **Vercel Pro** ($20/mo) + **Supabase Pro** ($25/mo)

---

## Post-Launch Priority (Not Blocking Launch)

- Restore CF signed token signing (see registry "Restoring signed tokens" SOP)
- Upload first ad at `/mn/admin/ads` once advertiser signed
- GLink Task #8: Contact Danford College — agency registration
- GLink Task #9: Rewrite SOP Section 3 for Danford College

---

## Security Constraints (Always Active)

- Student count: NEVER shown anywhere on MO
- MC_ENCRYPTION_KEY: NEVER regenerate once QPay credentials saved to mo_business_settings
- `.env.local`: NEVER commit to git
- CF Stream IDs: NEVER leave `/admin` — not in creator portal, not in API responses to students
- Enrollment gate: ALWAYS enforced in `/api/stream/token`
- Never create `src/middleware.ts` — all edge middleware lives in `src/proxy.ts`
- GLink boost budget: $3 USD daily MAXIMUM

---

# Session 26 Continuation — 2026-09-16 (same day)

**Session type:** Feature build + ad system fixes + launch preparation
**Status at close:** All features complete. Platform launch-ready. Amaraa went to gym.

---

## What Happened This Session

### Context
Resumed from Session 25 compaction. BUG-089 fully resolved. Focus shifted to: completing ad management system, fixing CSP regressions, and building the student review/rating submission system before tonight's launch.

---

## Bugs Fixed

### BUG-091 — CSP `connect-src` Missing (TUS Upload)
- **Commit:** `6826296`
- Admin course editor video upload failed with "Failed to fetch"
- `https://upload.cloudflarestream.com` was missing from `connect-src` in `next.config.ts`
- Browser blocked TUS PATCH before it left the client

### BUG-092/093 — Ad Form File Picker Never Opened / Same File Stuck
- **Commit:** `2ac682a`
- "Зураг" and "Видео" buttons triggered nothing — no hidden inputs existed
- Same file couldn't be re-selected (input value never reset)
- Fix: Added three hidden `<input type="file">` with React refs; buttons call `ref.current?.click()`; added `e.target.value = ''` reset in `handleMediaUpload`

### BUG-094 — Video Preview Black in Admin Ad Form
- **Commit:** `f27694e`
- Preview `<video>` had no `autoPlay` → stayed black
- Fix: Added `autoPlay muted loop controls playsInline` + `key={form.media_url}` for remount

### BUG-095 — Video Ads Silently Not Loading on Live Site
- **Commit:** `bdba7f6`
- `media-src` CSP missing `https://*.supabase.co` — browser blocked all Supabase-hosted video silently
- Fix: Added both Supabase domains to `media-src` in `next.config.ts`

### BUG-096 — `mo_reviews.user_id NOT NULL` Blocked Seeded Reviews
- **Supabase migration:** `ALTER TABLE mo_reviews ALTER COLUMN user_id DROP NOT NULL`
- Migrated Kajabi reviews have no MommyOffice user_id — constraint prevented insert

---

## Features Built

### Mobile Image Fallback for Video Ads (commit `b607fe2`)
- `mobile_image_url TEXT` column added to `mo_ads` via Supabase migration
- Admin form: teal upload section shown when `media_type === 'video'`
- `LiveAdBanner.tsx`: desktop → `<video>`, mobile → `<img src={mobile_image_url}>` or hide if no fallback
- API route + actions/admin updated to include `mobile_image_url`

### Student Review/Rating Submission System (commit `f505314`)
**Core feature shipped before launch.**

**New files:**
- `src/app/api/courses/[slug]/review/route.ts`
  - GET: returns current user's existing review (for form pre-fill)
  - POST: validates cookie → enrollment gate → upsert `mo_reviews` → recalculates `mo_courses.rating + rating_count`
  - Security: 401 no cookie, 403 not enrolled, one review per user per course
- `src/components/ui/CourseReviewForm.tsx`
  - `'use client'` component
  - Star picker 1–5 with hover labels ("Маш муу" → "Маш сайн")
  - Optional textarea 1000 char max
  - Pre-fills existing review on mount via GET
  - Edit flow: shows existing rating with "Засах" button → editable form → "Засварыг хадгалах"

**Modified file (surgical):**
- `src/app/[locale]/courses/[slug]/page.tsx`
  - Added `import { cookies } from 'next/headers'`
  - Added `import { CourseReviewForm } from '@/components/ui/CourseReviewForm'`
  - Added `checkEnrollment()` helper using `mo_access_tokens` gate
  - Added `isEnrolled` to `Promise.all` (parallel, no latency penalty)
  - Widened condition: `(rating > 0 || reviews.length > 0 || isEnrolled)`
  - `<CourseReviewForm slug={slug} isEnrolled={isEnrolled} />` inside SectionCard

**Supabase migrations:**
```sql
ALTER TABLE mo_reviews ADD COLUMN IF NOT EXISTS user_email TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS mo_reviews_user_course_unique
  ON mo_reviews (user_email, course_id) WHERE user_email IS NOT NULL;
ALTER TABLE mo_reviews ALTER COLUMN user_id DROP NOT NULL;
```

**Tested live:** Star hover confirmed working at `mommyoffice-smoky.vercel.app/mn/courses/easyenglish`

### Kajabi Reviews Seeded
3 authentic student reviews migrated from Kajabi. Timestamps spread 14/21/30 days ago. Course aggregate: 5.0 (3 reviews). Confirmed displaying correctly on live site.

---

## All Commits This Session (S25 + S26)

| Commit | Description |
|--------|-------------|
| `17c1139` | fix(BUG-089): harden token route fallback URL |
| `d42beaa` | fix(BUG-089-final): remove CF JWT signing; direct embed + enrollment gate |
| `0e11fc6` | fix: correct CF Stream direct embed URL (remove erroneous /iframe suffix) |
| `4c67d6a` | docs: CF Stream URL rules + BUG-089 invariants + S25 close |
| `6826296` | fix(BUG-091): add upload.cloudflarestream.com to CSP connect-src |
| `2ac682a` | fix(BUG-092/093): ad form file picker refs + input reset |
| `b607fe2` | feat: mobile image fallback for video ads + mo_ads.mobile_image_url |
| `f27694e` | fix(BUG-094): ad preview autoPlay + key remount |
| `bdba7f6` | fix(BUG-095): add Supabase domains to CSP media-src |
| `f505314` | feat: student review/rating submission system |

---

## Pre-Launch Checklist (Outstanding)

- [ ] **CF Stream allowed origins** — add `mommyoffice.com` in Cloudflare Stream dashboard ⚠️ CRITICAL
- [ ] **GoDaddy DNS** — `A @ 76.76.21.21`, `CNAME www → cname.vercel-dns.com`
- [ ] **Vercel env var** — `NEXT_PUBLIC_SITE_URL=https://mommyoffice.com` then redeploy
- [ ] **Supabase Auth** — add `https://mommyoffice.com` to allowed redirect URLs
- [ ] **Brevo SPF/DKIM** for `noreply@mommyoffice.com`
- [ ] Fix missing Хичээл 2 in Module 1
- [ ] Add instructor records at `/mn/admin/instructors`
- [ ] Delete `.ps1` scripts before public launch
- [ ] Populate 5 articles at `/mn/admin/articles`
- [ ] Mobile audit — KNOWN-003
- [ ] Vercel Pro ($20/mo) + Supabase Pro ($25/mo)

---

# Session 27 Continuation — 2026-09-16 (same day)

**Session type:** Feature build — Manual Course Access Grant
**Commit:** `0d82ccc`
**Status at close:** Feature complete and live on Vercel.

---

## What Happened This Session

Resumed from context compaction (S26 end). Built the Manual Course Access Grant admin feature as specified.

### Research basis
- Kajabi "Grant Product Access" pattern: email + product + lifetime/expiry + optional email
- Skool invite pattern: email + group + optional notification
- MommyOffice enrollment gate: `mo_access_tokens` table (email, course_id, token UUID, expires_at)
- Authoritative insert pattern from `src/app/api/qpay/check/route.ts`

### Architecture decision
Manual grant = admin-side insert into `mo_access_tokens`. Same table, same shape as QPay. No new table, no schema migration needed. The enrollment gate already reads this table for video, review, and course access.

---

## New Files

### `src/app/[locale]/admin/access/page.tsx` (NEW)
Full `'use client'` component. Two sections:

**Grant Form:**
- Email input (required, `type="email"`)
- Course dropdown (auto-loaded from `getAdminCourses()` on mount)
- Duration: "Насан туршийн" radio OR "Хязгаарлагдмал — [N] өдрөөр" radio + number input
- "Тавтай морил и-мэйл илгээх" checkbox (default checked)
- Submit calls `grantCourseAccess()` server action; shows success/error inline
- Dedup-aware: shows "шинэчлэгдлээ" vs "нэмэгдлээ" in success message

**Grants Table:**
- Loads from `listAccessGrants()` on mount; 300 rows max, sorted newest-first
- Columns: И-мэйл | Сургалт | Статус | Дуусах | (revoke button)
- Status badges: purple (Насан туршийн) / green (Идэвхтэй) / amber (≤7 days) / red (Дуусcан)
- Two-step inline revoke: first click → "Тийм / Үгүй" confirmation; confirm → `revokeAccessGrant()` → row removed from local state
- Expired rows rendered at 55% opacity

---

## Modified Files

### `src/app/actions/admin.ts` — 4 new functions appended after line 441

```typescript
getAdminCourses()         // SELECT id, title_mn, slug FROM mo_courses ORDER BY title_mn
listAccessGrants()        // SELECT from mo_access_tokens + course name join, 300 rows desc
grantCourseAccess(...)    // Check existing → update or insert; optional Brevo welcome email
revokeAccessGrant(id)     // DELETE from mo_access_tokens WHERE id = tokenId
```

**`grantCourseAccess` key behaviors:**
- `durationDays: null` → `expires_at: null` (lifetime)
- `durationDays: N` → `expires_at: now + N days`
- Existing token found → UPDATE (token refreshed, expiry updated)
- No existing token → INSERT
- `sendEmail: true` → fires Brevo API POST with branded HTML email

**Welcome email template:**
- Sender: `noreply@mommyoffice.com`
- Subject: `MommyOffice — "${courseTitle}" сургалтад тавтай морил!`
- Shows course title, expiry date (or "Насан туршийн"), CTA button to `/mn/courses`
- Email failure is non-fatal (wrapped in try/catch); access is already granted before email attempt

### `src/app/[locale]/admin/page.tsx` — 2-line change
- Added `🎫 Эрх олгох` to `quickActions` array with teal gradient styling
- Fixed border renderer: `a.border ?? (a.bg === '#2a2a2a' ? ...)` so gradient tiles use their own border

---

## Commits This Session

| Commit | Description |
|--------|-------------|
| `0d82ccc` | feat: manual course access grant admin panel |

---

## BUG-001 Pattern (recurring)
VS Code holds `.git/index.lock` open when repo is loaded. Fix: close VS Code, then:
```powershell
Remove-Item ".git\index.lock" -Force
```
(`-Force` is needed; `-ErrorAction SilentlyContinue` silently fails when the file is held.)

---

## Pre-Launch Checklist (Outstanding — unchanged from S26)

- [ ] **CF Stream allowed origins** — add `mommyoffice.com` in CF Stream dashboard ⚠️ CRITICAL
- [ ] **GoDaddy DNS** — `A @ 76.76.21.21`, `CNAME www → cname.vercel-dns.com`
- [ ] **Vercel env var** — `NEXT_PUBLIC_SITE_URL=https://mommyoffice.com` then redeploy
- [ ] **Supabase Auth** — add `https://mommyoffice.com` to allowed redirect URLs
- [ ] **Brevo SPF/DKIM** for `noreply@mommyoffice.com`
- [ ] Fix missing Хичээл 2 in Module 1
- [ ] Add instructor records at `/mn/admin/instructors`
- [ ] Delete `.ps1` scripts before public launch
- [ ] Populate 5 articles at `/mn/admin/articles`
- [ ] Mobile audit — KNOWN-003
- [ ] Vercel Pro ($20/mo) + Supabase Pro ($25/mo)
