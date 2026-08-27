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

## Session 2026-08-26 (Alex) — Prior Session Summary

- Initial Next.js + Supabase setup confirmed live on Vercel
- `mo_articles` schema established (no emoji column)
- Placement zones: hero, trending, editorial, normal
- `getHomeArticles()` data fetcher implemented
- `export const dynamic = 'force-dynamic'` added to home page
- Admin panel working for article upload
