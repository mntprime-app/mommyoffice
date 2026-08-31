# MommyOffice — Development Session Log

---

## Session 2026-08-31 (Alex) — Video Upload Pipeline Launch + Cloudflare Setup

### Completed Work

#### 1. White-Labeled Video Upload Pipeline — 4 Files Shipped

Built complete video upload infrastructure. Teachers upload to MommyOffice; Cloudflare is invisible in the UI.

**`src/app/api/video/request-upload/route.ts`** (NEW)
- POST endpoint: calls Cloudflare Direct Creator Upload API
- Returns one-time TUS upload URL + video UID to frontend
- `requireSignedURLs: true` — all videos are DRM-protected
- `allowedOrigins`: mommyoffice.com, www.mommyoffice.com, mommyoffice-smoky.vercel.app
- Uses `CF_ACCOUNT_ID` + `CF_STREAM_API_TOKEN` env vars

**`src/app/api/video/webhook/route.ts`** (NEW)
- Receives Cloudflare Stream webhook when encoding completes
- Verifies HMAC signature with `CF_WEBHOOK_SECRET`
- Quality gate: MIN 720p resolution + MIN 3 minutes duration
- PASS → `mo_video_uploads.status = 'ready'`
- FAIL → auto-deletes video from CF Stream (zero storage cost) + records Mongolian rejection message

**`src/components/ui/VideoUploader.tsx`** (NEW)
- Branded drag-and-drop component — zero Cloudflare branding
- Client-side pre-check before upload (resolution, duration, format, size)
- Native TUS chunked upload (50MB chunks) — no external npm package
- Status states: idle / checking / uploading / processing / done / error
- All UI text in Mongolian

**`src/app/[locale]/admin/videos/new/page.tsx`** (MODIFIED)
- Replaced plain CF Stream ID text input with `<VideoUploader>` component
- Commit: `36ba11e` — pushed to GitHub

#### 2. `mo_video_uploads` Table Created in Supabase

```sql
CREATE TABLE mo_video_uploads (
  id UUID, cloudflare_uid TEXT, status TEXT DEFAULT 'pending',
  rejection_reason TEXT, rejection_message TEXT,
  duration_seconds INTEGER, resolution_height INTEGER,
  processed_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_mo_video_uploads_cloudflare_uid ON mo_video_uploads (cloudflare_uid);
```

### Cloudflare Account Setup — Completed

- **Account ID:** `642ba259ca6ae24cd02dc58ef37bf84e` (Mntprime.marketing account)
- **Customer subdomain:** `customer-ivpigj2fofxpnwyw.cloudflarestream.com`
- **API Token:** Created via "Read and write to Cloudflare Stream and Images" template
- **Stream plan:** Activated free Images & Stream plan ($0/month base, pay-as-you-go)
- **Webhook:** Registered via API (PUT /stream/webhook) — URL: `https://mommyoffice-smoky.vercel.app/api/video/webhook`
- **Webhook secret:** Retrieved from API response and saved to `.env.local`

All 4 CF env vars saved to `.env.local` AND Vercel (Production). Deployment `36ba11e` redeployed and confirmed **Ready** (33s build).

### End State — Fully Live ✅

The complete video upload pipeline is deployed and accessible at `/mn/admin/videos/new`. The VideoUploader component renders correctly with drag-drop zone and "Файл сонгох" button. Ready for end-to-end video upload testing.

### Files Modified This Session

| File | Change |
|---|---|
| `src/app/api/video/request-upload/route.ts` | NEW — CF Direct Creator Upload endpoint |
| `src/app/api/video/webhook/route.ts` | NEW — Quality gate webhook handler |
| `src/components/ui/VideoUploader.tsx` | NEW — Branded drag-drop TUS uploader |
| `src/app/[locale]/admin/videos/new/page.tsx` | MODIFIED — VideoUploader replaces text input |

### Pending (carry to next session)

- [x] Cloudflare account setup — Account ID, API token, webhook, all env vars ✅
- [ ] Upload 3 test videos from `/mn/admin/videos/new` — end-to-end UX test (NEXT)
- [ ] Connect Cloudflare DNS for mommyoffice.com (IP protection + CDN proxy)
- [ ] KNOWN-004: Build `/mn/instructor/login` page (Phase 2)
- [ ] KNOWN-005: Verify `qpay_username` column in mo_instructors
- [ ] Fix BUG-008: Brevo SPF/DKIM for noreply@mommyoffice.com
- [ ] Domain cutover: connect mommyoffice.com in Vercel
- [ ] Set `NEXT_PUBLIC_SITE_URL=https://mommyoffice.com` in Vercel Production
- [ ] Mobile audit: /courses, /videos, /home
- [ ] Course player with Cloudflare Stream
- [ ] Google Drive upload option (backlog)

---

## Session 2026-08-27 (Alex)

### Completed Work

#### 1. MommyOffice_Gemini_Prompt.docx — Part 4 Added
Added PART 4: НИЙТЛЭЛ ОРУУЛАХ ФОРМАТ to the Gemini prompt document.
- 4 required fields: ГАРЧИГ (60 chars), ТОВЧ ТАЙЛБАР (135 chars), SLUG (Latin+dash), HTML ФОРМАТ
- HTML rules: h2, strong, em, p only
- 5-step admin panel upload sequence documented

#### 2. Domain Readiness Audit
Audited codebase for hardcoded `mommyoffice-smoky.vercel.app` references. Found and fixed 3:
- `src/app/api/qpay/create/route.ts` — fallback updated
- `src/app/api/qpay/check/route.ts` — fallback updated
- `src/app/[locale]/courses/[slug]/page.tsx` — ShareButton URL uses env var
Created `docs/Domain_Cutover_Checklist.md` with 8-step cutover procedure.
Status: Waiting for content population to complete before domain switch.

#### 3. Home Page (`/mn`) — Editorial Layout Refactor
- Removed heavy gradient masks from trending section
- Left card (65%): 16:9 aspect-ratio image + text below, no overlay
- Right column (35%): 3 horizontal thumbnail (90×90px) + title list items
- CSS class `mo-editorial-grid`: `grid-template-columns: 1.6fr 1fr`

#### 4. Article Listing Page (`/mn/articles`) — Hero Gradient Fix
- Lightened hero overlay from `rgba(0,0,0,0.95)` to `rgba(0,0,0,0.82)`
- Subject's face now visible through gradient

#### 5. Article Detail Page (`/mn/articles/[slug]`) — Full Stacked Layout
Removed all text overlays from hero image. New vertical structure:
- Breadcrumb → Category pill → H1 → Meta bar → 16:9 photo → Excerpt → Body

#### 6. Article Detail Page — Unified 2-Column Grid
Wrapped all content inside one `mo-detail-grid` parent:
- Left: full article column (breadcrumb through newsletter)
- Right: 300px sticky sidebar
- All elements share one 1200px max-width container, matching ikon.mn alignment

#### 7. Article Detail Page — Sidebar Restructure
Moved ТӨСТЭЙ НИЙТЛЭЛҮҮД and Ad Banner into the right sidebar.
New sidebar order (desktop):
1. Ad Banner 300×250 (top)
2. ИХ УНШИГДСАН — trending list (numbered 01–05)
3. ТӨСТЭЙ НИЙТЛЭЛҮҮД — compact vertical cards (thumbnail + category + title)
4. Related Courses
Added new `SidebarRelated` component (62×62px thumbnails, 3 articles max).
Mobile fallback sections in left column: `mo-mobile-ad` + `mo-mobile-related` (horizontal carousel).

#### 8. Article Detail Page — Compact Mobile Meta Bar
Refactored author/date/read-time bar from tall stacked layout to 2-line compact:
- Line 1: Avatar (28px) + Name + • + Date + • + X мин (all inline)
- Line 2: [f Хуваалцах] [🔗 Холбоос] small buttons, left-aligned

#### 9. Mobile Breakpoint Fix
Changed sidebar collapse breakpoint from 900px to 1024px.
Added `!important` to `display: none` on aside to override inline `display: flex`.

---

### Files Modified This Session

| File | Change |
|---|---|
| `src/app/[locale]/page.tsx` | Trending section editorial refactor |
| `src/app/[locale]/articles/page.tsx` | Hero gradient lightened |
| `src/app/[locale]/articles/[slug]/page.tsx` | Full stacked layout, unified grid, sidebar restructure, compact meta bar, mobile fixes |
| `src/app/api/qpay/create/route.ts` | Domain fallback fix |
| `src/app/api/qpay/check/route.ts` | Domain fallback fix |
| `src/app/[locale]/courses/[slug]/page.tsx` | ShareButton env var fix |
| `src/app/globals.css` | `mo-editorial-grid` updated |
| `docs/MommyOffice_Gemini_Prompt.docx` | Part 4 added |
| `docs/Domain_Cutover_Checklist.md` | Created |

---

### Pending (carry to next session)

- [ ] Enter 5 remaining launch articles: Money Talk, Mom Hacks, Ээжүүдийн хобби, Шинэхэн ээжүүд, Дотно харилцаа
- [ ] Connect `mommyoffice.com` domain in Vercel (after content complete — see Domain_Cutover_Checklist.md)
- [ ] Set `NEXT_PUBLIC_SITE_URL=https://mommyoffice.com` in Vercel Production env vars
- [ ] Fix Brevo SPF/DKIM for noreply@mommyoffice.com
- [ ] Fix `/mn/access` returning 404
- [ ] Course player with Cloudflare Stream
- [ ] Mobile audit: `/mn/courses`, `/mn/videos`, `/mn` (home)

---

## Session 2026-08-27 Part 2 (Alex) — Trending Alignment + Limit Fix

### Completed Work

#### 10. Home Page Trending — Increased Limit 3 → 5
- Supabase query `.limit(3)` changed to `.limit(5)`
- Fallback `.slice(0, 3)` changed to `.slice(0, 5)`
- All 5 trending articles now show when set in admin

#### 11. Home Page Trending — Editorial Grid Alignment (BUG-009, 4 iterations)
Multi-iteration alignment fix between left hero card and right 5-item column.

**Root cause:** Text block below the image made the left card taller than the pure image, causing right column misalignment.

**Final structure (SHIPPED):**
- Left card: `aspectRatio: 16/9` image div + fixed `height: 80px` text box below on `#1a1a1a` dark background. Badge has `alignSelf: flex-start` to prevent stretching.
- Right column parent: `display: flex, flexDirection: column, height: 100%`
- Each of the 5 items: `flex: 1, display: flex, alignItems: center`
  - First item: `paddingTop: 0` — thumbnail flush with top of image
  - Last item: `paddingBottom: 0` — last item flush with bottom of text box
  - Middle items: `paddingTop: 10px, paddingBottom: 10px` — dividers visually centered
- Result: outer top/bottom edges pixel-aligned, divider lines centered between cards

**Lessons logged in BUG-009:**
- Never use uniform `py` on all items in a bordered list — first needs `pt-0`, last needs `pb-0`
- Always reason from slot height math before coding
- Do not switch layout approach without user request

### Files Modified This Session (Part 2)

| File | Change |
|---|---|
| `src/app/[locale]/page.tsx` | Trending limit 3→5, full alignment fix (4 iterations) |
| `docs/Bug_Registry.md` | BUG-009 added with failure chain and fix |

---

---

## Session 2026-08-30 Part 2 (Alex) — Admin UI 2-Column Refactor

### Completed Work

#### 14. Admin Course Forms — 2-Column Layout Redesign

Both `/admin/courses/new` and `/admin/courses/[id]/edit` fully rewritten with:

- **Outer container:** max-width 1180px, padding 2rem
- **Left column (flex: 1):** `Card` components — Нэр ба URL, Ангилал ба Түвшин, Тайлбар, Сургалтын тухай, Юу сурах вэ?, Шаардлага, Хичээлийн тоо баримт, Багш, Curriculum builder
- **Right sticky sidebar (300px):** `SideCard` components — Нийтлэх тохиргоо, Байршил, Үнэ, Cover Image, Видео; `position: sticky, top: 2rem`
- **Grid system:** `grid2` (1fr 1fr), `grid3` (1fr 1fr 1fr), `grid4` (1fr 1fr 1fr 1fr) for inline field alignment
- **Shared sub-components:** `Card`, `SideCard`, `Field`, `Toggle` — defined at bottom of each file
- **Edit page extras:** header row with breadcrumb + "↗ Хуудас харах" link + red delete button; success toast with 3-second auto-dismiss

### Files Modified This Session (Part 2)

| File | Change |
|---|---|
| `src/app/[locale]/admin/courses/new/page.tsx` | Full 2-column rewrite |
| `src/app/[locale]/admin/courses/[id]/edit/page.tsx` | Full 2-column rewrite |

---

## Session 2026-08-30 Part 3 (Alex) — Marketplace Phase 1 Launch

### Completed Work

#### 15. Marketplace Phase 1 — Full DB Schema

All `mo_instructors` marketplace columns confirmed in Supabase:
- `qpay_password TEXT, qpay_invoice_code TEXT` — encrypted QPay credentials
- `subscription_status TEXT DEFAULT 'trial'` — trial/active/suspended
- `subscription_expires_at TIMESTAMPTZ, commission_rate NUMERIC(5,2)`
- `is_approved BOOLEAN DEFAULT FALSE, approved_at TIMESTAMPTZ`
- `onboarding_completed BOOLEAN DEFAULT FALSE`
- `user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL`
- `email TEXT, social_url TEXT`

`mo_user_roles` table created with unique index on `(user_id, role, resource_id)`.

> Note: `qpay_username` was not visible in the first migration screenshot (lines 2-3 cut off). Verify this column exists in Supabase before implementing QPay per-instructor routing.

#### 16. BUG-007 Fixed — `/mn/access` 404

Created `/src/app/[locale]/access/page.tsx` — unified two-tab hub:

- **Сурагч tab** (teal): token entry form → `/access/{token}` + ActionCard grid (Сургалтууд, Видео) + support email
- **Багш tab** (indigo #6366f1): "Нэвтрэх →" → `/instructor/login` (for approved teachers) + divider + "Багш болох →" CTA → `/become-instructor` with 4-step process preview

Architecture matches Udemy's "My Learning + Teach on Udemy" pattern — everything centered at one Нэвтрэх section.

#### 17. `/become-instructor` — 4-Step Self-Registration Wizard

`/src/app/[locale]/become-instructor/page.tsx` — NEW FILE:

- **Step 0 (Intro):** 4 value prop cards (income, audience, tools, partnership) + time estimate
- **Step 1 (Profile):** name_mn, name_en, email, title_mn, title_en, profile_image_url (live preview), social_url
- **Step 2 (Bio):** bio_mn (50-char min with live counter), bio_en (optional)
- **Step 3 (Submit):** summary card, 4-step process list, agreement checkbox, calls `createInstructorApplication()`
- `SuccessScreen` component after submission; per-step validation before advancing

#### 18. `/admin/instructors` — Approval Panel

`/src/app/[locale]/admin/instructors/page.tsx` — NEW FILE:

- Filter tabs: all/pending/active/suspended with live counts
- List: avatar, name, email, status badge, Approve/Suspend/Restore buttons
- Sticky right sidebar (320px): photo, bio, QPay status, login status, approval date, delete
- Admin home page: "👩‍🏫 Багш нар" quick action added

#### 19. `admin.ts` — 6 New Server Actions

`createInstructorApplication`, `listInstructors`, `approveInstructor`, `suspendInstructor`, `deleteInstructorById`, `getInstructorCourseCount` — all confirmed working.

#### 20. Navbar — "Багш болох" Link Added

`Navbar.tsx`: `{ href: lp('/become-instructor'), label: 'Багш болох', soon: false }` added to `navLinks`.

### Files Modified This Session (Part 3)

| File | Change |
|---|---|
| `src/app/[locale]/access/page.tsx` | NEW — unified two-tab hub (198 lines) |
| `src/app/[locale]/become-instructor/page.tsx` | NEW — 4-step wizard (372 lines) |
| `src/app/[locale]/admin/instructors/page.tsx` | NEW — instructor approval panel |
| `src/app/[locale]/admin/page.tsx` | Added "Багш нар" quick action |
| `src/app/actions/admin.ts` | 6 new instructor server actions |
| `src/components/ui/Navbar.tsx` | "Багш болох" nav link added |

### Pending (carry to next session)

- [ ] **⚠️ NEXT: `/mn/instructor/login` page** — linked from /access Багш tab but not yet built (would 404)
- [ ] **DB CHECK: `qpay_username` column** — was not visible in first migration screenshot; verify in Supabase
- [ ] Instructor dashboard `/mn/instructor/*` — Phase 2 (QPay connect, course management)
- [ ] Test end-to-end: create course in admin, verify all fields render on public `/mn/courses/[slug]`
- [x] Launch articles — 5+ already entered ✅
- [ ] Fix BUG-008: Brevo SPF/DKIM for noreply@mommyoffice.com
- [ ] Connect `mommyoffice.com` domain in Vercel (after content complete)
- [ ] Set `NEXT_PUBLIC_SITE_URL=https://mommyoffice.com` in Vercel Production
- [ ] Course player with Cloudflare Stream
- [ ] Mobile audit: `/mn/courses`, `/mn/videos`, `/mn` home

---

## Session 2026-08-30 Part 4 (Alex) — Platform Research + Video Infrastructure Decision

### Summary
Research and architecture planning session. No code changes.

### Decisions Made

#### Video Hosting — Confirmed: Cloudflare Stream (stay)
Benchmarked 5 providers: Cloudflare Stream, Bunny.net, Mux, VdoCipher, Wistia.

**Key findings:**
- Wistia (what Kajabi uses) has zero DRM, weak download protection, poor Asia CDN. Wrong product for a course platform.
- Cloudflare Stream: best CDN for Mongolia (300+ PoPs), DRM built in, already integrated. Charges per minute delivered — cost-efficient at small scale.
- Bunny.net: 12× cheaper at high volume (charges per GB not per minute). Better for 1,000+ daily viewers.
- VdoCipher: only platform with dynamic viewer watermark. Purpose-built for e-learning DRM.
- Mux: best analytics + auto-captions, most expensive at scale.

**Decision:** Keep Cloudflare Stream for now. When monthly costs exceed ~$500 (roughly 500+ daily active viewers), evaluate migrating to Bunny.net for storage/delivery while keeping Cloudflare as DNS/proxy/WAF.

#### Cost Scenarios Calculated
| Scenario | Cloudflare Stream | Bunny.net |
|---|---|---|
| Early stage (~100 users) | $10–50/month | $5–20/month |
| 5,000 viewers × 2hr × 20 days (200TB) | ~$12,018/month | ~$1,002/month |

#### Upload UX (like Kajabi/Wistia)
Wistia/Kajabi's upload ease comes from supporting Google Drive + Dropbox + direct file. Cloudflare Stream supports URL-based upload via API — we can add Drive/Dropbox upload to the MO admin panel using their public file URL. Added to backlog.

### Pending (carry to next session)

- [ ] Upload 3 test videos from MommyOffice admin — check UX end-to-end
- [ ] Connect Cloudflare DNS for mommyoffice.com (IP protection + CDN)
- [ ] Add Google Drive upload option to admin video/course forms (backlog)
- [ ] **⚠️ KNOWN-004:** Build `/mn/instructor/login` page (Phase 2)
- [ ] **⚠️ KNOWN-005:** Verify `qpay_username` column in Supabase mo_instructors
- [ ] Fix BUG-008: Brevo SPF/DKIM
- [ ] Domain cutover: mommyoffice.com in Vercel
- [ ] Mobile audit: /courses, /videos, /home

---

## Session 2026-08-30 (Alex) — Course Admin/Public Gap Audit + Full Fix

### Completed Work

#### 12. Data Schema & UX Gap Audit — Course Admin vs Public Page

Audited 3 files: `admin/courses/new/page.tsx`, `admin/courses/[id]/edit/page.tsx`, `courses/[slug]/page.tsx`, and `actions/admin.ts`.

**Critical gap found:** Admin saved curriculum to `outline` column, but public page reads `course_outline_mn` / `course_outline_en`. Curriculum entered in admin was never visible on the public course page.

**Fields missing from admin (now added):**
- `level_mn` — dropdown: Анхан шат / Дунд шат / Ахисан шат (shows as badge on public page)
- `what_you_learn_mn` / `what_you_learn_en` — newline-separated textarea (public "Юу сурах вэ?" section)
- `requirements_mn` / `requirements_en` — newline-separated textarea (public "Шаардлага" section)
- `duration_minutes` — number (public sidebar shows "X цаг Y мин")
- `lecture_count` — number (public sidebar + "Сургалтад багтсан зүйлс")
- `download_count` — number (public "Сургалтад багтсан зүйлс")
- `exercise_count` — number (public "Сургалтад багтсан зүйлс")
- `has_certificate` — toggle (public "Сургалтад багтсан зүйлс")
- `is_bestseller` — toggle (public header badge)
- `mo_instructor_id` — instructor selector dropdown (public "Багшийн тухай" section)
- Curriculum builder added to `new/page.tsx` (previously only in edit)

#### 13. Fixes Applied

**`src/app/actions/admin.ts`:**
- Added `getInstructors()` server action (returns id, name_mn, name_en, title_mn)
- `createCourse`: added all 13 missing fields, renamed `outline` → `course_outline_mn`
- `updateCourse`: added all 13 missing fields, renamed `outline` → `course_outline_mn`

**`src/app/[locale]/admin/courses/[id]/edit/page.tsx`:**
- Added all missing form fields with proper UI (selectors, toggles, number inputs, textareas)
- Instructor dropdown loads from `getInstructors()` server action
- Curriculum now loads from `course_outline_mn` (with fallback to old `outline` for existing data)
- Curriculum saves to `course_outline_mn` (fixes the public page display bug)
- New sections added: Course Stats, Instructor, What You'll Learn, Requirements

**`src/app/[locale]/admin/courses/new/page.tsx`:**
- Curriculum builder ported from edit page (was completely missing)
- All missing fields added (same as edit page)
- `useEffect` added to load instructor list on mount

### Files Modified This Session

| File | Change |
|---|---|
| `src/app/actions/admin.ts` | Added getInstructors(), expanded createCourse + updateCourse with 13 missing fields, outline→course_outline_mn |
| `src/app/[locale]/admin/courses/[id]/edit/page.tsx` | All missing fields, instructor selector, outline column fix |
| `src/app/[locale]/admin/courses/new/page.tsx` | All missing fields, curriculum builder, instructor selector |

### Pending (carry to next session)

- [ ] **DEPLOY**: `git add -A && git commit -m "feat: complete course admin gap audit — add 13 missing fields, fix outline column, curriculum in new form" && git push`
- [ ] **DB CHECK**: Verify `mo_courses` table has all new columns (`what_you_learn_mn/en`, `requirements_mn/en`, `duration_minutes`, `lecture_count`, `download_count`, `exercise_count`, `has_certificate`, `is_bestseller`, `level_mn`, `course_outline_mn`, `mo_instructor_id`). Run Supabase migration if any are missing.
- [ ] Test: Create a demo course end-to-end in admin and verify all fields show on public `/mn/courses/[slug]`
- [ ] Enter 5 remaining launch articles: Money Talk, Mom Hacks, Ээжүүдийн хобби, Шинэхэн ээжүүд, Дотно харилцаа
- [ ] Fix BUG-007: `/mn/access` returns 404
- [ ] Fix BUG-008: Brevo SPF/DKIM for noreply@mommyoffice.com
- [ ] Connect `mommyoffice.com` domain in Vercel (after content complete)
- [ ] Set `NEXT_PUBLIC_SITE_URL=https://mommyoffice.com` in Vercel Production
- [ ] Course player with Cloudflare Stream
- [ ] Mobile audit: `/mn/courses`, `/mn/videos`, `/mn` home

---

## Session 2026-08-26 (Alex) — Prior Session Summary

- Initial Next.js + Supabase setup confirmed live on Vercel
- `mo_articles` schema established (no emoji column)
- Placement zones: hero, trending, editorial, normal
- `getHomeArticles()` data fetcher implemented
- `export const dynamic = 'force-dynamic'` added to home page
- Admin panel working for article upload
