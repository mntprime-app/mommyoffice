# MommyOffice — Pre-Launch Audit Clearance Report
**Date:** 2026-08-26  
**Scope:** All public routes + Admin CMS forms  
**Auditor:** Alex (AI)

---

## PHASE 1 — Public Front-End UX Audit

### Home (`/mn`) ✅ PASS
- Hero section: cinematic gradient, CTA buttons — ✅ correct
- Featured courses row: 16:9 cards, price badge, category tag — ✅ correct
- Article editorial grid: featured + 3 stacked + scroll row — ✅ correct
- Videos row: labeled "УДАХГҮЙ" (coming soon) with placeholder data — ✅ intentional
- Shop row: placeholder data — ✅ intentional

**⚠️ Minor cosmetic fix needed:**
- Line 369 in `/app/[locale]/page.tsx`: `badge="ТУНУДАХГҮЙ"` — typo. Should be `badge="УДАХГҮЙ"`. Fix before launch.

### Courses Listing (`/mn/courses`) ✅ PASS
- Netflix-style hero with first published course — ✅
- Category filter pills — ✅
- Course grid: rating, price, original price strike-through, discount %, bestseller badge — ✅
- Student count: NOT shown anywhere — ✅ security constraint respected
- Placeholder fallback: ✅

### Articles Listing (`/mn/articles`) ✅ PASS
- Full editorial layout: hero, main feed, sidebar trending, editor's pick — ✅
- Category filter tabs — ✅
- Category horizontal scroll rows — ✅
- Ad banner placeholders — ✅ (dashed boxes, ready for real ads)
- Responsive: collapses 2-col → 1-col at 900px — ✅

### Article Detail (`/mn/articles/[slug]`) ✅ PASS
- Hero cover, breadcrumbs, author avatar/meta bar — ✅
- HTML body with full typography styles — ✅
- Related articles scroll row — ✅
- Related courses in sidebar — ✅
- Facebook share button — ✅

**⚠️ Minor UX note (non-blocking):**
- "🔗 Холбоос" button is an `<a href={shareUrl}>` — navigates instead of copying to clipboard. No JS clipboard handler. Post-launch fix: convert to client component with `navigator.clipboard.writeText()`.
- Newsletter form `onSubmit={() => false}` — placeholder, no Brevo integration. Post-launch.

### Course Detail (`/mn/courses/[slug]`) ✅ PASS
- Uses `createAdminClient` (bypasses RLS), `generateMetadata`, OG tags — ✅
- Fetches instructor via `mo_instructor_id` separately — ✅
- Imports: `ShareButton`, `CourseOutline`, `HeroMedia`, `AddToCartButton`, `InstructorBio` — all custom components

### Videos (`/mn/videos`) ✅ PASS
- ISR with 60s revalidate — ✅
- Full video list from `mo_videos` — ✅
- All fields fetched (upvotes, downvotes, super_likes) — ✅
- Delegates to `VideosClient` — ✅

**ℹ️ Code consistency note (non-blocking):**
- `videos/page.tsx` uses `createClient(URL, SERVICE_ROLE_KEY)` directly instead of shared `createAdminClient()`. Works correctly, just inconsistent. Post-launch refactor.

### Checkout (`/mn/checkout/[slug]`) ✅ PASS (from prior session)
- Scenario A (guest) and Scenario B (logged-in) both implemented — ✅
- `emailLocked` pattern, `userId` passed through — ✅

### User Profile (`/mn/user/profile`) ✅ PASS (from prior session)
- 3 tabs: Personal Info, My Courses, Wishlist — ✅
- Avatar upload with WebP compression — ✅
- Redirects to `/mn` if unauthenticated — ✅

---

## PHASE 2 — Admin CMS Field Parity Audit

### `/admin/videos/new` — ⚠️ MINOR GAP

| Field | Status |
|---|---|
| Video type toggle (YouTube / CF Stream) | ✅ |
| YouTube URL with auto-ID extract + thumbnail preview | ✅ |
| CF Stream Video ID | ✅ |
| Title MN + EN | ✅ |
| Slug (auto-generated) | ✅ |
| Category (5 options) | ✅ |
| Duration text | ✅ |
| Thumbnail URL | ✅ text input only |
| Description MN + EN | ✅ |
| Placement: Hero / Trending / Normal | ✅ |
| is_published + is_featured toggles | ✅ |

**❌ Missing: Thumbnail file upload button** — other forms (articles, courses) have a file picker with `compressImage`. Videos form only has a text URL field. Content managers must have a CDN URL ready to paste. Acceptable for launch, add upload post-launch.

---

### `/admin/courses/new` — ⚠️ MISSING FIELDS (non-blocking, edit-page workaround)

| Field | New Form | Edit Form |
|---|---|---|
| title_mn, title_en | ✅ | ✅ |
| slug | ✅ | ✅ |
| category, price | ✅ | ✅ |
| cover_image_url (file upload + compress) | ✅ | URL-only ⚠️ |
| description_mn, description_en | ✅ | ✅ |
| about_course_mn, about_course_en | ✅ | ✅ |
| trailer_url, cloudflare_stream_id | ✅ | ✅ |
| show_outline, is_published | ✅ | ✅ |
| **original_price** | ❌ MISSING | ✅ |
| **access_duration_days** | ❌ MISSING | ✅ |
| **Outline/Curriculum builder** | ❌ MISSING | ✅ Full editor |
| Instructor assignment | ❌ | ❌ (neither form) |

**Action for content entry:**
> Create course with new form → immediately open edit → add `original_price`, `access_duration_days`, and curriculum outline.

**Instructor note:** Neither form has an instructor selector. `mo_instructor_id` must be set directly via Supabase table editor or SQL. Run:
```sql
UPDATE mo_courses SET mo_instructor_id = '<uuid>' WHERE slug = '<slug>';
```
Use the instructor UUID from `mo_instructors` table (fix slug first: `UPDATE mo_instructors SET slug = 'b-narantuya' WHERE slug IS NULL`).

---

### `/admin/courses/[id]/edit` — ✅ PASS (full fields)
- All fields present: title, slug, category, price, original_price, access_duration_days — ✅
- Cover image: URL input + inline preview — ✅ (no file upload, use URL)
- Trailer + CF Stream ID — ✅
- Full curriculum editor (modules → lessons → CF Stream ID per lesson) — ✅
- is_published, show_outline — ✅
- Delete button — ✅
- "Хуудас харах ↗" preview link — ✅

---

### `/admin/articles/new` — ✅ PASS

| Field | Status |
|---|---|
| cover_image_url (file upload + compress, "1200×630px 16:9") | ✅ |
| title_mn, title_en | ✅ |
| slug, category, author_name | ✅ |
| Placement zone (Hero / Trending / Normal) | ✅ |
| is_pinned_trending + pin_rank (conditional) | ✅ |
| excerpt_mn, excerpt_en | ✅ |
| body_mn, body_en (HTML textarea) | ✅ |
| is_published | ✅ |
| read_time | N/A — computed from word count in front-end |
| view_count | N/A — auto-incremented, not a CMS field |
| emoji | ❌ not in form (used as cover fallback) |

**ℹ️ Emoji field:** Front-end uses `article.emoji` as fallback when no cover image. If you always provide a cover image, this is irrelevant. If you want emoji fallbacks, set them directly in the Supabase table editor.

---

### `/admin/articles/[id]/edit` — ✅ PASS
- All same fields as new form — ✅
- Image upload with compressImage — ✅
- Existing data pre-loaded on mount — ✅

---

## Remaining Fixes Needed Before Content Entry

### 🔴 Required (blocks clean UX)
| # | Fix | File | Effort |
|---|---|---|---|
| 1 | Fix typo `ТУНУДАХГҮЙ` → `УДАХГҮЙ` | `src/app/[locale]/page.tsx` line 369 | 2 min |
| 2 | Fix instructor slug: `UPDATE mo_instructors SET slug = 'b-narantuya' WHERE slug IS NULL` | Supabase SQL | 1 min |

### 🟡 Should-fix soon (affects content workflow)
| # | Fix | Notes |
|---|---|---|
| 3 | Add `original_price` + `access_duration_days` to courses/new form | Prevents two-step create→edit workflow |
| 4 | Add file upload to courses/edit cover image field | Inconsistency with new form |
| 5 | Add file upload to videos/new thumbnail field | Inconsistency with article/course forms |

### 🟢 Post-launch (non-blocking)
| # | Fix | Notes |
|---|---|---|
| 6 | "Copy link" button on article detail | navigator.clipboard.writeText() |
| 7 | Newsletter form on article detail | Brevo list integration |
| 8 | `videos/page.tsx`: use `createAdminClient()` | Code consistency |
| 9 | `/admin/videos/[id]/edit` page | Not yet built |
| 10 | Course player `/[locale]/courses/[slug]/learn` | CF Stream signed URLs |
| 11 | `/mn/access` route 404 | Investigation needed |
| 12 | Brevo SPF/DKIM for noreply@mommyoffice.com | Email deliverability |
| 13 | GoDaddy DNS: connect mommyoffice.com to Vercel | Custom domain |

---

## Content Entry Workflow (Approved Sequence)

### Articles
1. `/admin/articles/new` → fill all fields → upload cover (1200×630px) → publish
2. Done. No follow-up needed.

### Courses  
1. `/admin/courses/new` → fill title, slug, category, price, cover, description, about → create
2. Immediately open `/admin/courses/[id]/edit`
3. Add `original_price`, `access_duration_days`, curriculum outline
4. Set `is_published = true` when ready
5. Set instructor via Supabase SQL (until instructor selector is built)

### Videos
1. `/admin/videos/new` → select type (YouTube/CF), paste URL or ID, fill metadata
2. Upload thumbnail to Supabase Storage manually → copy public URL → paste in Thumbnail URL field
3. Set placement, publish

---

## ✅ Green-Light Confirmation

The Admin Panel is **ready for content entry** with the following acknowledged workflow:

- Course creation requires a two-step (new → edit) for full field coverage
- Video thumbnails must be pre-uploaded to get a URL to paste
- Fix the `ТУНУДАХГҮЙ` typo and instructor slug before going live

**Public front-end UX:** All active routes render correctly on the dark design system. No broken routes detected among audited pages. Checkout flow (Scenario A + B) operational.

**Security constraints verified:**
- ✅ Student count: not shown on any public page
- ✅ No API keys in source files
- ✅ `.env.local` not committed
