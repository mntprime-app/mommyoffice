# MommyOffice — Development Session Log

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

### Pending (carry to next session)

- [ ] **DEPLOY**: `git add -A && git commit -m "feat: 2-column admin course UI for new + edit pages" && git push`
- [ ] Test end-to-end: create course in admin, verify all fields render on public `/mn/courses/[slug]`
- [ ] Enter 5 remaining launch articles: Money Talk, Mom Hacks, Ээжүүдийн хобби, Шинэхэн ээжүүд, Дотно харилцаа
- [ ] Fix BUG-007: `/mn/access` returns 404
- [ ] Fix BUG-008: Brevo SPF/DKIM for noreply@mommyoffice.com
- [ ] Connect `mommyoffice.com` domain in Vercel (after content complete)
- [ ] Set `NEXT_PUBLIC_SITE_URL=https://mommyoffice.com` in Vercel Production
- [ ] Course player with Cloudflare Stream
- [ ] Mobile audit: `/mn/courses`, `/mn/videos`, `/mn` home
- [x] Marketplace Phase 1 DB migration — `mo_instructors` extended (qpay_password, qpay_invoice_code, subscription_status, subscription_expires_at, commission_rate, is_approved, approved_at, onboarding_completed) + user_id UUID FK to auth.users — all confirmed in Supabase
- [x] `/admin/instructors` approval panel built — filter tabs (pending/active/suspended), one-click approve/suspend/restore, detail sidebar with QPay status
- [x] Admin home page — "Багш нар" quick action link added
- [x] `admin.ts` — added listInstructors, approveInstructor, suspendInstructor, deleteInstructorById, getInstructorCourseCount server actions
- [x] Architecture decision: open self-registration model (like Udemy) with manual approval gate — teacher registers → MO reviews → approves with one click (qpay_password, qpay_invoice_code, subscription_status, subscription_expires_at, commission_rate, is_approved, approved_at, onboarding_completed) — "Success. No rows returned" confirmed in Supabase
- [x] Marketplace Phase 1 DB migration — `mo_user_roles` table created with unique index on (user_id, role, resource_id) — "Success. No rows returned" confirmed

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
