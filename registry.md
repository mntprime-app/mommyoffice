# MommyOffice Layout Registry

## GRID STANDARD — Unified Horizontal Container

**Every section on every page** must use the same container wrapper so that
the hero card's left edge, the navbar logo, and all section content share
one consistent X-axis grid line.

```tsx
// Correct — matches nav and hero card exactly
<div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem' }}>
  {/* section content */}
</div>
```

**Never use `padding: '0 4%'`** — percentage padding scales with viewport and
drifts away from the fixed nav/hero alignment at any width other than ~800px.

---

## HERO CARD STANDARD

All four hero pages (Нүүр, Нийтлэл, Сургалт, Кино & Видео) share the same component:
`src/components/shared/UniversalHero.tsx` — import and use this. Do NOT write inline hero sections.

```tsx
{/* Outer — full-width background color */}
<div style={{ background: '#141414' }}>
  {/* Inner — aligned to grid standard */}
  <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '12px 2rem 0' }}>
    <section style={{
      position: 'relative', width: '100%',
      height: 'clamp(580px, 68vh, 780px)',   /* min 580px · scales with viewport · max 780px */
      overflow: 'hidden', background: '#0a0a0a', borderRadius: '24px',
    }}>
      {/* content */}
    </section>
  </div>
</div>
```

---

## HERO VIDEO ARCHITECTURE — Poster Cover Mode (MANDATORY)

**The hero section is ALWAYS a static cover image. Never embed a YouTube iframe
directly inside the hero card.** This is the Netflix / Disney+ / industry standard.

### Why iframes in the hero always break

There is no CSS-only way to make a YouTube `<iframe>` behave like `objectFit: cover`.
Every approach that has been tried and rejected:

| Approach | What breaks |
|---|---|
| `width: 177.78vh` oversized trick | Over-zooms ~20% on wide screens, crops human heads/hair |
| `aspectRatio: 16/9` + `maxHeight` on section | maxHeight clamps height but NOT width → container becomes wider than 16:9 → YouTube pillarboxes (black side bars) |
| `width: 100%, height: 100%` iframe in above container | Same pillarbox result — YouTube renders its own 16:9 box inside the wider container |

**None of these can be fixed by tweaking values. The constraint is YouTube's renderer,
not CSS. Do not attempt any of these again.**

### Correct pattern

```tsx
{/* Hero: static poster image — objectFit:cover fills 100% with zero black bars */}
<section style={{ position:'relative', width:'100%', height:'65vh', minHeight:'420px', overflow:'hidden', borderRadius:'24px' }}>

  {/* Cover image — objectPosition:'center top' keeps faces in frame */}
  <img
    src={heroVideo.thumbnail_url ?? `https://img.youtube.com/vi/${heroVideo.youtube_id}/maxresdefault.jpg`}
    alt={heroVideo.title}
    style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top' }}
  />

  {/* Asymmetric vignette + text + CTA buttons (see ASYMMETRIC GRADIENT MASK below) */}
  ...

  {/* ҮЗЭХ button → openPlayer() which opens the modal, NOT an inline iframe */}
</section>

{/* Modal: proper 16:9 iframe with paddingBottom trick — black bars impossible here */}
<div style={{ position:'relative', paddingBottom:'56.25%', background:'#000' }}>
  <iframe style={{ position:'absolute', inset:0, width:'100%', height:'100%', border:'none' }} ... />
</div>
```

### Hybrid hero pattern (poster + delayed autoplay)

When a youtube_id exists, iframe CAN be layered on top of the poster image using
`scale(1.35) + overflow:hidden` to push YouTube's pillarbox bars outside the visible area:

```tsx
{/* Layer 1: static poster — always visible, objectFit:cover, zero bars */}
<img style={{ position:'absolute', inset:0, width:'100%', height:'100%',
  objectFit:'cover', objectPosition:'center top' }} />

{/* Layer 2: autoplay iframe — fades in after 2.5s, scale pushes bars out */}
{/* Math: scale ≥ 1336/(1336-2*148) = 1.285 for typical 1336×585 hero.    */}
{/* Using 1.35 gives a safe margin. NEVER use less than 1.29.               */}
{/* transformOrigin:'top center' — scale anchors to top edge so subjects'   */}
{/* heads are NEVER cropped. NEVER use center or translate(-50%,-50%).      */}
<div style={{ position:'absolute', inset:0, overflow:'hidden',
  opacity: heroVideoActive ? 1 : 0, transition:'opacity 1s ease' }}>
  <iframe style={{
    position:'absolute', top:0, left:'50%',
    transform:'translateX(-50%) scale(1.35)',
    transformOrigin:'top center',
    width:'100%', height:'100%', border:'none',
    pointerEvents:'none',
  }} />
</div>
```

### Rules

- **Never** use `aspectRatio` + `maxHeight` together on any container that holds an iframe.
- **Never** reduce scale below 1.29 — black bars will reappear at typical viewport widths.
- **Never** give the iframe `pointerEvents:auto` in the hero — it would swallow all clicks.
- The modal's `paddingBottom: 56.25%` pattern is the ONLY safe container for a clickable player.
- Mute toggle shows ONLY after `heroVideoActive` is true (otherwise the button is orphaned).

---

## ASYMMETRIC GRADIENT MASK (light-background hero images)

```tsx
{/* Left zone darkens for text legibility — right stays bright for faces */}
<div style={{ position: 'absolute', inset: 0,
  background: 'linear-gradient(to right, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.5) 35%, rgba(0,0,0,0.15) 55%, transparent 72%)'
}} />
{/* Thin bottom vignette */}
<div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '18%',
  background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 100%)'
}} />
```

---

## NEGATIVE MARGIN RULE

`marginTop: '-Xrem'` on sections below a floating hero card causes content to
bleed into the hero. **Do not use negative top margins on any section that
follows the floating hero card.**

---

## MOBILE RESPONSIVENESS — MOBILE-001 (RESOLVED 2026-09-05, Session 11)
## BUG-046 (RESOLVED 2026-09-05, Session 11 continuation) — 4:5 portrait too tall

**Root causes identified from real-device screenshots:**
1. `Шинээр нэмэгдсэн` badge (position:absolute bottom-right) collided with secondary CTA button
2. Title/description text overlaid on hero photo covered faces and blocked button area
3. Autoplay iframe caused choppy performance + cellular data drain on mobile

**BUG-046:** Session 11's first fix used `aspect-ratio: 4/5` on mobile hero. At 375px width → 468px height, filling entire viewport with just the cover photo — no title or buttons visible. Fixed by switching to Option A overlay with `height: 260px`.

**Solution implemented: Option A Overlay Mobile Hero (260px)**

Both `UniversalHero.tsx` and `VideosClient.tsx` now use CSS-class-based dual layout:
- `mo-hero-mobile` — shown on `<768px`, hidden on desktop
- `mo-hero-desktop` — shown on `≥768px`, hidden on mobile

**Mobile hero rules (must never be violated):**
```
1. Category badge:  text label ABOVE the card — never a floating chip inside the photo
2. Hero card:       h-[260px] fixed height, static poster ONLY — NO autoplay iframe
3. Strong vignette: rgba(0,0,0,0) 0% → rgba(0,0,0,0.92) 100% covering 70% of card
4. Title overlay:   15px, weight 800, 2-line clamp — INSIDE card at bottom
5. CTA buttons:     8px 12px padding — INSIDE card below title, overlaid in card
6. Corner badge:    top-right INSIDE card — never bottom, never near buttons
7. One-line meta:   below card, 11px #666 — category + duration + free/paid
```

**NEVER USE aspect-ratio on mobile hero.** 4:5 = 468px at 375px viewport. Use `height: '300px'` always (upgraded from 260px in Session 12 for Netflix-standard stacked buttons + description).

**CSS classes used (add to any new hero component):**
```tsx
<style>{`
  .mo-hero-mobile  { display: none;  }
  .mo-hero-desktop { display: block; }
  @media (max-width: 767px) {
    .mo-hero-mobile  { display: block; }
    .mo-hero-desktop { display: none;  }
  }
`}</style>
```

**Video card mobile sizing:**
```css
@media (max-width: 767px) {
  .mo-video-card       { width: calc(45vw) !important; min-width: 130px !important; }
  .mo-video-card-thumb { width: 100% !important; height: auto !important; aspect-ratio: 16/9; }
}
```

**Mobile fixes applied (Session 11 continuation):**

| Area | Fix | Status |
|---|---|---|
| `UniversalHero.tsx` mobile | 260px + overlay Option A | ✅ DONE |
| `VideosClient.tsx` mobile | 260px + overlay Option A | ✅ DONE |
| `courses/page.tsx` grid | `mo-card-grid` 2-col on `<768px` | ✅ DONE |
| Home carousel rows | `mo-row-wrap` right-fade scroll hint | ✅ DONE |
| Home course cards | `mo-home-course-card` 45vw on mobile | ✅ DONE |

**Mobile CSS classes (platform standard):**
```css
/* Scroll hint wrapper — add to any horizontal scroll row container */
.mo-row-wrap { position: relative; overflow: hidden; }
.mo-row-wrap::after {
  content: ''; position: absolute;
  top: 0; right: 0; bottom: 0; width: 56px;
  background: linear-gradient(to right, transparent, #141414);
  pointer-events: none; z-index: 2;
}
@media (min-width: 768px) { .mo-row-wrap::after { display: none; } }

/* 2-col card grid on mobile */
@media (max-width: 767px) {
  .mo-card-grid { grid-template-columns: repeat(2, 1fr) !important; }
}
```

**Remaining mobile work:**

| Area | Problem | Fix approach |
|---|---|---|
| `Navbar.tsx` | Hamburger menu — verify opens/closes cleanly | Already has mobile CSS toggle; verify on device |
| `articles/page.tsx` | CategoryRow cards 220px — check visibility on 375px | Scroll hint already on articles page via .mo-editorial-grid CSS |
| `CoverImagePicker.tsx` | 2-column layout breaks on narrow screens | Switch to `gridTemplateColumns: '1fr'` below 600px |
| Admin pages | Low priority for mobile | Skip |

---

## BUG-060 — Auto-Approval Pipeline & 4 GB Kajabi File Validation (RESOLVED 2026-09-09)

**Pages affected:** `/admin/courses/[id]/edit`, `/admin/courses/new`
**Component:** `VideoTUSUploader.tsx`

**Problem / Trigger:** Stage 1 course creation needed zero-friction video publishing — no manual approval gate required. Additionally, the 10 GB file size limit was non-standard; Kajabi enforces 4 GB.

**Root cause:** `VideoTUSUploader` set `video_status = 'pending'` after upload, requiring an admin to click ✅ Батлах before students could watch. The amber "Хянагдаж байна (Pending)" STATE B card was a friction point with no real security benefit at this stage.

**Resolution:**
- `VideoTUSUploader.tsx`: `MAX_FILE_BYTES` changed from 10 GB → **4 GB**. Error message for oversized files: `⚠️ Файлын хэмжээ хэтэрсэн байна. Дээд хэмжээ 4GB (Kajabi стандарт).` Enforced client-side before upload starts.
- `onUploaded` callback in both `edit/page.tsx` and `new/page.tsx`: now sets `video_status: 'approved'` immediately (was `'pending'`).
- STATE B (amber pending card) removed from both pages. The only states are now **STATE A** (no video → uploader) and **STATE C** (has video → green ✓ Бэлэн card with 👁️ Үзэх, 🔄 Видео солих, 🗑️ Устгах).
- `admin.ts`: Added `saveCourseOutlinePatch(courseId, outline)` — a targeted server action that updates only `course_outline_mn` (avoids passing all fields to `updateCourse`). Used for auto-save after upload.
- `cleanOutline` logic updated in both pages to preserve lessons with `stream_id` even when titles are blank (prevents orphaned stream IDs).
- `approve-video` and `reject-video` API routes: switched from fragile `moduleIdx`/`lessonIdx` index lookup to robust `stream_id`-based search (prevents "Lesson not found" errors when DB outline indices diverge from client state).

**Files changed:**
- `src/components/ui/VideoTUSUploader.tsx`
- `src/app/[locale]/admin/courses/[id]/edit/page.tsx`
- `src/app/[locale]/admin/courses/new/page.tsx`
- `src/app/actions/admin.ts`
- `src/app/api/admin/approve-video/route.ts`
- `src/app/api/admin/reject-video/route.ts`

---

## BUG-066 — Direct CF Stream TUS Architecture: Drop Supabase Staging Bucket (RESOLVED 2026-09-09)

**Pages affected:** `/admin/courses/[id]/edit`, `/admin/courses/new`

**Root cause:** Supabase free tier enforces 50 MB max per file. Real course videos (200 MB–2 GB) hit "The object exceeded the maximum allowed size" immediately. Staging bucket architecture is fundamentally broken for video.

**Architecture pivot (approved):** Drop Supabase staging entirely. Upload directly to Cloudflare Stream via TUS. Gate student access via DB `video_status` field (CoursePlayer already checks this).

**New workflow:**
1. Instructor uploads → `VideoTUSUploader` → TUS PATCH to CF Stream → `stream_id` + `video_status: 'pending'` saved in `course_outline_mn`
2. Admin previews via `https://iframe.cloudflarestream.com/{stream_id}` link in lesson card
3. Admin clicks ✅ Батлах → `POST /api/admin/approve-video` (DB-only: `video_status = 'approved'`)
4. Admin clicks 🗑️ Устгах / 🔄 Солих → `POST /api/admin/reject-video` (CF Stream DELETE API + DB clear)
5. New course page uses `POST /api/admin/delete-stream` (CF delete only, no DB — course not saved yet)

**Files changed:**
- NEW `src/components/ui/VideoTUSUploader.tsx` — compact inline TUS uploader; `onUploaded(streamId)` callback; no Supabase dependency
- REWRITE `src/app/api/admin/approve-video/route.ts` — DB-only update (`video_status = 'approved'`); no CF Stream copy, no Supabase Storage
- NEW `src/app/api/admin/reject-video/route.ts` — CF Stream DELETE + DB clear `stream_id`/`video_status`
- NEW `src/app/api/admin/delete-stream/route.ts` — CF Stream DELETE only (for new-course page without a courseId)
- UPDATED `edit/page.tsx` + `new/page.tsx` — `OutlineLesson` drops `r2_key`/`r2_filename`/`r2_size`; replaces `VideoStagingUploader` with `VideoTUSUploader`; 3-state video row uses `stream_id` presence (not `r2_key`)

**Benchmark that drove the decision:** Kajabi allows 4 GB uploads; Skool multi-GB practical. 50 MB is unusable for real video.

---

## BUG-065 — Lesson Video Management: No File Info, No Delete, Silent Errors (RESOLVED 2026-09-09)

**Pages affected:** `/admin/courses/[id]/edit`, `/admin/courses/new`

**Symptom:** After upload, the lesson row showed `"📄 видео файл"` with no filename display, no file size. `🗑️ Устгах` only cleared local React state without deleting from Supabase Storage. Storage errors surfaced as a global form error. No `🔄 Солих` in pending state.

**Root cause:** `VideoStagingUploader.onStaged` callback returned only `(storagePath, filename)` — file size never tracked. `rejectLesson` did `setLessonField` only (no Storage delete call). Errors routed to global `setError`.

**Fix (4-part):**
1. `VideoStagingUploader.tsx` — added `fileBytes: number` to `onStaged`; improved bucket-not-found error → `⚠️ Сүлжээний алдаа: Supabase Storage bucket тохируулаагүй байна.`
2. New `POST /api/admin/delete-staged-video` — deletes from `course-staging` by path; path-traversal guard.
3. `OutlineLesson` type — added `r2_size?: number`; hydrated on load, persisted on save.
4. Lesson video row redesigned into 3 states: **None** (uploader + per-lesson inline error), **Pending** (Connected Media Card: `🎬 filename • 42.5 MB • ⏳` + 👁️ ✅ 🔄 🗑️ actions that actually call Storage delete), **Approved** (green card + 🔄 replace).

**Note:** BUG-059 already taken (duplicate slug). This is BUG-065.

---

## BUG-064 — Enterprise Staging Pipeline: Zero-Cost Supabase→CF Stream + Zero ID Exposure (RESOLVED 2026-09-09)

**Symptom:** Instructors could see raw Cloudflare Stream IDs in admin UI; no approval gate before video went live; no cost control on CF Stream encoding.

**Root cause:** VideoUploader uploaded directly to CF Stream with immediate stream_id visible in text input. No staging, no approval workflow.

**Fix (3-layer architecture):**
1. `VideoStagingUploader` component: file picker → `POST /api/course-staging/presign` → Supabase Storage direct upload (signed URL, no Vercel body limit). Lesson status = `pending`.
2. Admin approval bar (lesson row): `👁️ Урьдчилан үзэх` (opens signed preview URL), `✅ БАТАЛГААЖУУЛАХ` (calls `/api/admin/approve-video`), `🗑️ Устгах`.
3. `/api/admin/approve-video`: loads r2_key from DB → generates signed GET URL → calls CF Stream `/stream/copy` → saves stream_id → deletes staging file immediately (Supabase storage stays at ~0 MB). Lesson status = `approved`.

**Also fixed:** `CoursePlayer` iframe URL changed from `videodelivery.net` to `cloudflarestream.com`. `request-upload` route: removed `requiresignedurls` flag that was blocking all video playback.

**Requires:** Supabase Storage bucket `course-staging` (private) must be created manually in Supabase dashboard.

**Commits:** `9e4fb70`

---

## BUG-063 — Admin Lesson Video Row Invisible + Wrong Button (RESOLVED 2026-09-09)

**Symptom:** In `/admin/courses/[id]/edit` and `/admin/courses/new`, the video upload row per lesson was a tiny 🎬 icon (11px gray) with a small teal-outline "📤 Upload" button — easy to miss, no status indicator.

**Root cause:** Visual hierarchy too low; no indication whether a lesson already had a video attached.

**Fix:** Added a visible `🎬 Видео:` label + "✓ Видео холбогдсон" (green) / "Видео байхгүй" (gray) status + solid teal `📤 Видео оруулах` button with `borderTop` separator. Applied to both `edit/page.tsx` and `new/page.tsx`.

**Commits:** `3456e2a`

---

## BUG-062 — CoursePlayer Plays YouTube Instead of Cloudflare Stream (RESOLVED 2026-09-09)

**Symptom:** Clicking a lesson in the course player showed a YouTube embed (broken, wrong video) instead of the CF Stream video.

**Root cause:** `CoursePlayer` used `videoId` prop and `https://www.youtube.com/embed/${videoId}` iframe. `Section.lessons` was typed as `string[]` with no per-lesson stream_id.

**Fix:** Rewrote `CoursePlayer` — `courseStreamId` prop replaces `videoId`, per-lesson `stream_id` in `OutlineLesson`, iframe src = `https://iframe.videodelivery.net/${currentStreamId}` with fallback to course-level stream.

**Commits:** `3456e2a`

---

## BUG-061 — learn/page.tsx Reads Non-Existent DB Fields (RESOLVED 2026-09-09)

**Symptom:** Course player page loaded but showed blank video and no curriculum — paid users saw nothing after QPay payment.

**Root cause:** `learn/page.tsx` read `course.video_url` (column doesn't exist) and `course.outline` (wrong name). Correct columns are `cloudflare_stream_id` and `course_outline_mn`.

**Fix:** Rewrote `learn/page.tsx` with correct field names; parses `course_outline_mn` JSON into `sections[]` with per-lesson `stream_id`; passes `courseStreamId` to `CoursePlayer`.

**Commits:** `3456e2a`

---

## BUG-056b — Admin Section Parity: Courses + Videos Missing Нуух/Устгах (RESOLVED 2026-09-09)

**Symptom:** Admin courses list had only a Засах link (no Нуух/Нийтлэх, no Устгах). Admin videos list had toggle text "✓ Нийтлэгдсэн" and 🗑 icon — inconsistent with articles list.

**Root cause:** Courses list was a server component with no actions. Videos list predated the admin UI standard.

**Fix:** Rewrote courses list as `'use client'` with `actions.ts` (listCourses/toggleCoursePublish/deleteCourse). Videos list buttons standardized to Нуух/Нийтлэх + Засах + Устгах text buttons matching articles.

**Commits:** `92383b3` (courses), `970ecaa` (videos)

---

## BUG-060 — mo_courses Missing updated_at Column Crashes Course Save (RESOLVED 2026-09-08)

**Pages affected:** `/admin/courses/[id]/edit`

**Symptom:** Saving an edited course returned `Could not find the 'updated_at' column of 'mo_courses' in the schema cache` — the edit page appeared to save but the record was never updated.

**Root cause:** `updateCourse` server action included `updated_at: new Date().toISOString()` in its Supabase `.update()` payload, but the `mo_courses` table was never given an `updated_at` column. The column existed in the TypeScript payload but not in the DB schema.

**Fix:** Run in Supabase SQL Editor:
```sql
ALTER TABLE mo_courses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
```
No code change required — `updateCourse` was already correct; the DB schema was simply missing the column.

**Commits:** n/a (SQL run directly; no migration file)

**Regression standard:** Any server action that writes `updated_at` to a table must have a corresponding DB column. When adding `updated_at` to a server action payload, always check that the column exists first, or add the migration in the same commit.

---

## BUG-059 — Duplicate Course Slug Shows Raw Postgres Error to Admin (RESOLVED 2026-09-08)

**Pages affected:** `/admin/courses/new`

**Symptom:** Saving a course whose slug already exists in `mo_courses` shows the raw DB error `duplicate key value violates unique constraint "mo_courses_slug_key"` in the form error banner — no actionable guidance.

**Root cause:** `createCourse` server action returned `error.message` verbatim. Postgres unique-violation code `23505` was never intercepted.

**Fix:** In `src/app/actions/admin.ts` → `createCourse`, check `error.code === '23505'` and return `"${slug}" slug аль хэдийн ашиглагдаж байна. Өөр slug оруулна уу.` instead.

**Commits:** `8e7982d`

**Regression standard:** Any DB insert/upsert that has a unique constraint must catch `23505` and return a Mongolian user-friendly message, never raw Postgres text.

---

## BUG-058 — Cloudflare Stream TUS Upload: Wrong Endpoint (direct_upload vs TUS creation) (RESOLVED 2026-09-08)

**Pages affected:** All pages using `VideoUploader.tsx`

**Symptom:** Video upload immediately failed with `Upload chunk failed (HTTP 400: Basic uploads must be made using POST method)` — appeared as `Байршуулах явцад алдаа гарлаа. Дахин оролдоно уу.` (generic, before error-surfacing fix in BUG-058a).

**Root cause (two-layer):**
1. `/api/video/request-upload` called `POST /accounts/{id}/stream/direct_upload` which returns a **basic one-shot POST URL** — not a TUS endpoint. The browser then sent TUS `PATCH` to it, which Cloudflare rejected.
2. The `catch {}` block in `VideoUploader.handleFile` discarded the real error and replaced it with the generic Mongolian string, hiding the diagnosis entirely.

**Fix:**
- Changed API route to `POST /accounts/{id}/stream?direct_user=true` with TUS creation headers (`Tus-Resumable: 1.0.0`, `Upload-Length: {fileSize}`, `Upload-Metadata`). CF responds with `Location` (TUS upload URL) + `Stream-Media-Id` (video UID).
- Client now sends `fileSize` in the request-upload body so the server knows `Upload-Length` at creation time.
- Changed `catch {}` → `catch (err)` and surfaces `err.message` so future errors are visible.
- Removed unnecessary `HEAD` request before first PATCH (fresh URLs always start at offset 0).

**Commits:** `a2d8f43` (error surfacing), `de951a1` (TUS endpoint fix)

**Regression standard:**
- Never use `stream/direct_upload` for chunked TUS uploads — that endpoint is for simple single-POST browser uploads (≤200 MB). Use `/stream?direct_user=true` for TUS.
- Always send `fileSize` from the client before requesting an upload URL.
- Never use bare `catch {}` in upload flows — always surface the error for diagnosis.

---

## BUG-057 — CoverImagePicker: Dual Upload Complexity + Broken Live Preview (RESOLVED 2026-09-08)

**Pages affected:** All admin forms using `CoverImagePicker` (`/admin/courses/new`, `/admin/courses/[id]/edit`, `/admin/videos/new`, `/admin/videos/[id]/edit`, `/admin/articles/new`, `/admin/articles/[id]/edit`)

**Root cause:** `CoverImagePicker` had two upload zones ("Desktop" and "Mobile") despite the front-end using a single `cover_image_url` with `object-cover` CSS for responsive rendering. The "Mobile" zone was vestigial and added unnecessary cognitive load. The live `DualPreview` component had overlapping text on the desktop hero card due to z-index/positioning issues on the blacked-out state before image loads.

**Fix:** Simplified to a single upload zone labeled "Үндсэн нүүр зураг (16:9)". Rewrote `DualPreview` — desktop hero uses proper aspect-ratio padding trick with clean gradient overlay and CTA buttons; mobile shows a realistic 2-column card (image + title below, no text overlay). `mobileValue`/`onMobileChange` props kept as deprecated no-ops for backward compatibility. Migration: `20260908_courses_cloudflare_stream_id.sql` adds missing `cloudflare_stream_id` column to `mo_courses`.

**Commits:** `155905b`

---

## BUG-056 — content_type Selector Omitted from /admin/videos/new (RESOLVED 2026-09-08)

**Pages affected:** `/admin/videos/new`, `src/app/actions/admin.ts`

**Root cause:** Engineering failure — Full Lifecycle Mindset not applied. The `🎭 Агуулгын төрөл` (Movie vs Series) selector was built only on the edit page (`/admin/videos/[id]/edit`) without tracing the feature back through the creation flow. Result: any video created via `/admin/videos/new` was silently saved as `content_type = null`, breaking the series/episode architecture downstream.

**Resolution (commit `2325525`):**

1. **`src/app/actions/admin.ts`** — `createVideo()` extended to accept `content_type?: string` and `season_count?: number`. Return type updated to include `id: string | null` (needed for smart redirect).

2. **`src/app/[locale]/admin/videos/new/page.tsx`:**
   - Added `content_type: 'movie'` and `season_count: 1` to form state.
   - Added `🎭 Агуулгын төрөл` card (purple accent, Movie vs Series radio) positioned after the video source selector.
   - Season count input shown when Series is selected.
   - Validation relaxed for series: video-level source (youtube_id / cloudflare_stream_id) is optional — episodes hold the real content; video-level source serves as trailer only.
   - Smart redirect: after saving a **series**, redirects to `edit/[newId]` so admin can add episodes immediately. After saving a **movie**, redirects to `/admin/videos` list as before.

**Lifecycle gap this exposed:** The following checklist is now mandatory (MASTER_POLICY.md §3):
- Creation page (`new`) ✓
- Edit page (`edit`) ✓
- DB + server actions ✓
- Front-end rendering (Home, hubs, modals) ✓

---

## BUG-055 — Dual-Provider Episode Architecture + Platform-Wide Modal Parity (RESOLVED 2026-09-08)

**Pages affected:** `/admin/videos/[id]/edit`, `HeroDetailModal`, `/videos` hub, `videos.ts`, `admin.ts`

**Root cause:** Episodes had only a generic `video_url` field — no per-episode provider differentiation (YouTube vs Cloudflare Stream). The Videos hub modal also had no series/episode display at all, violating the "same modal logic everywhere" requirement.

**5-layer fix applied:**

1. **DB** (`docs/sql/mo_video_episodes_provider.sql`) — `ALTER TABLE mo_video_episodes ADD COLUMN video_provider TEXT DEFAULT 'youtube'`, `youtube_id VARCHAR(30)`, `cloudflare_stream_id VARCHAR(200)`. Run in Supabase SQL Editor.

2. **Interfaces** — `VideoEpisode` (admin.ts), `PublicEpisode` (videos.ts), `ModalEpisode` (HeroDetailModal.tsx) all extended with `video_provider`, `youtube_id`, `cloudflare_stream_id`.

3. **Admin episode builder** (`/admin/videos/[id]/edit`) — per-episode provider toggle: `[🔓 YouTube]` | `[🔐 Cloudflare Stream]`. YouTube episodes show YouTube URL input + 11-char ID detection. CF episodes show Stream UID input with amber "Premium" indicator.

4. **HeroDetailModal** — episode rows no longer navigate away on click; they set `playingEpisode` state → inline 16:9 player renders above the list. YouTube: `youtube-nocookie.com` embed. Cloudflare: `iframe.cloudflarestream.com` embed. Provider badge (▶ Үнэгүй / 🔐 Premium) shown per row.

5. **Videos hub parity** (`VideosClient.tsx`) — `Video` type + select query include `content_type`, `season_count`. `openInfo()` is now async; when called for a series, it client-fetches `getPublicVideoEpisodes()` and sets `seriesEpisodes[]`. Modal renders an "📺 Ангиуд" section with season selector + episode rows + inline player, matching Home modal behavior exactly.

**Files changed:**
- `docs/sql/mo_video_episodes_provider.sql` (NEW)
- `src/app/actions/admin.ts`
- `src/app/actions/videos.ts`
- `src/components/ui/HeroDetailModal.tsx`
- `src/app/[locale]/admin/videos/[id]/edit/page.tsx`
- `src/app/[locale]/videos/page.tsx`
- `src/app/[locale]/videos/VideosClient.tsx`
- `src/app/[locale]/page.tsx`

⚠️ **DB migration required:** run `docs/sql/mo_video_episodes_provider.sql` in Supabase SQL Editor before testing episodes.

---

## BUG-054 — Series & Multi-Episode Drama Architecture Missing (RESOLVED 2026-09-08)

**Pages affected:** `/admin/videos/[id]/edit`, Home hero detail modal

**Symptom:** The Кино & Видео section had no distinction between single movies and multi-episode series/dramas. Admins could not add episode lists. The Netflix-style "Дэлгэрэнгүй" modal had no "Ангиуд" (Episodes) section for series content.

**Root cause:** `mo_videos` table lacked `content_type` + `season_count` columns. No `mo_video_episodes` table existed. Admin edit page had no episode manager. `HeroDetailModal` had no episode section.

**Fix:** Full 5-layer architecture implemented:
1. **SQL** — `ALTER TABLE mo_videos ADD content_type, season_count` + `CREATE TABLE mo_video_episodes` (with FK cascade, RLS, indexes). Migration: `docs/sql/mo_video_episodes.sql`.
2. **Server actions** — `getVideoEpisodes`, `saveEpisodesBatch` in `admin.ts`; `getPublicVideoEpisodes`, `getPublicVideoBySlug` in `videos.ts`; `updateVideo` now accepts `content_type` + `season_count`.
3. **Admin CMS** — `/admin/videos/[id]/edit` gets: (a) Content Type selector (Movie vs Series, red border); (b) Season count field; (c) Episode Manager — add/delete episode rows with #, title, duration, video URL, thumbnail, description, published toggle, separate "💾 Ангиуд хадгалах" button.
4. **HeroDetailModal** — new "Ангиуд" section (Netflix The Tudors style): episode number + 16:9 thumb + title + duration right-aligned + description, season selector dropdown when >1 season. CTA changes to "▶ 1-р анги үзэх" for series. Section appears between description and "Үүнтэй төстэй".
5. **Home page** — `hero_content_slug` in admin/home config: admin pastes video slug → page.tsx fetches that video's content_type + episodes → passes to modal.

**Files changed:** `docs/sql/mo_video_episodes.sql`, `src/app/actions/admin.ts`, `src/app/actions/videos.ts`, `src/app/[locale]/admin/videos/[id]/edit/page.tsx`, `src/components/ui/HeroDetailModal.tsx`, `src/components/shared/HeroWithModal.tsx`, `src/app/[locale]/page.tsx`, `src/lib/homeConfig.ts`, `src/app/[locale]/admin/home/page.tsx`.

**⚠️ DB migration required:** Run `docs/sql/mo_video_episodes.sql` in Supabase SQL Editor before testing.

---

## BUG-051 — Video Detail Page: No Related Videos Section (RESOLVED 2026-09-06, Session 16)

**Page affected:** `/[locale]/videos/[slug]`

**Symptom:** After watching a video, users had no contextual next step — no related content visible on the detail page, forcing them to navigate back to `/videos` manually. Zero retention loop.

**Root cause:** `RelatedVideosRow` component did not exist; detail page made no secondary Supabase query.

**Fix implemented:**
1. `RelatedVideosRow.tsx` — new client component: horizontal snap-carousel, 16:9 cards with thumbnail/duration/free badge, hover lift effect, mobile swipe with snap, "Бүгдийг үзэх →" link
2. `page.tsx` — two-query fetch: same category (ordered by view_count desc, limit 8) → fallback pad with newest if <3 results; current video always excluded
3. Card click navigates to `/[locale]/videos/[slug]` — consistent with rest of platform

**Standard (must not regress):**
```
1. Related carousel always present on detail page
2. Same-category videos shown first, padded with newest if fewer than 3
3. Current video never appears in its own related row
4. Each card navigates to detail page (no modal)
5. Mobile: snap-scroll, min 2 cards visible (clamp 200–260px width)
```

---

## BUG-049 — Admin CMS: No Mobile Poster Upload + Single Desktop Preview (RESOLVED 2026-09-05, Session 12)

**Pages affected:** `/admin/videos/new`, `/admin/videos/[id]/edit`, `/admin/courses/new`, `/admin/articles/new`

**Symptoms:**
- `CoverImagePicker.tsx` showed only a single 16:9 desktop preview; admins had no way to verify how images appear on the 240px mobile pure-card layout (BUG-048 standard)
- No mobile poster upload field in videos or courses forms — only articles had `mobile_cover_image`
- Courses `/new` used a primitive inline text input (not `CoverImagePicker`) with no upload drag-drop
- No thumbnail priority tooltip explaining custom-upload vs. auto-thumbnail fallback priority

**Fix applied (Session 12):**

1. **`CoverImagePicker.tsx` (complete rewrite — BUG-049 upgrade):**
   - Extracted reusable `UploadZone` sub-component (supports both URL-paste and drag-drop upload modes)
   - Added optional `mobileValue` + `onMobileChange` props for second mobile poster upload
   - New `DualPreview` sub-component showing side-by-side:
     - Desktop: 16:9 cinematic card with asymmetric vignette simulation + title/button overlay
     - Mobile: 240px pure image card (zero overlay) + external text stack below (BUG-048 standard)
   - `previewTitle` + `previewBadge` props feed live mock text into preview cards
   - Thumbnail priority tip added: "Custom upload takes 100% priority. Auto-thumbnails serve as fallback ONLY if field is empty."

2. **`/admin/videos/new` + `/admin/videos/[id]/edit`:**
   - Added `mobile_cover_image` to form state + DB upsert
   - Passes `mobileValue` / `onMobileChange` / `previewTitle` / `previewBadge` to `CoverImagePicker`
   - Title field shows live character count with `⚠️` warning at >60 chars (mobile 2-line clamp threshold)

3. **`/admin/courses/new`:**
   - Replaced primitive inline cover image block (file input + text input) with `CoverImagePicker`
   - Added `mobile_cover_image` to form state + DB upsert
   - Title field shows live character count with mobile clamp warning

4. **`/admin/articles/new`:**
   - Already had `mobile_cover_image` wired — added Thumbnail Priority tooltip to desktop cover section

**Admin CMS standard (BUG-049, must not regress):**
```
1. Desktop Hero Poster:  CoverImagePicker — 1920×1080px WebP, 16:9, drag-drop or URL
2. Mobile Hero Poster:   Optional 2nd upload — 4:5 or 3:4 crop for portrait subjects
3. Live Dual Preview:    Desktop 16:9 card + Mobile 240px pure card side-by-side
4. Title hint:           Live char count, orange border + ⚠️ warning above 60 chars
5. Priority tip:         Custom upload = 100% priority; auto-thumb = fallback only
```

---

## BUG-048 — Mobile Hero: Text Overlay Covering Faces (RESOLVED 2026-09-05, Session 12)

**Pages affected:** All pages using `UniversalHero.tsx`, `/mn/videos` (`VideosClient.tsx`)

**Symptoms:** Title, description, and CTA buttons rendered OVER the hero poster image, covering subject faces. Buttons unreachable on short viewports.

**Root cause:** Netflix overlay pattern (text/buttons inside absolute-positioned div at card bottom) works on large screens but collides with human subjects on portrait mobile images.

**Fix: Pure image card architecture**
- **A. Hero card:** Pure poster image, 240px height, zero text/buttons/vignette inside
- **B. External metadata:** Badge (cyan, uppercase) + title (20px, w900) + description (12px, zinc-400) rendered BELOW the card in normal flow
- **C. External buttons:** Full-width stacked white/dark buttons in their own row below text

**Additional fix:** Movie placeholder cards in `VideosClient.tsx` were missing `mo-video-card` + `mo-video-card-thumb` CSS classes, causing them to remain 280px wide on mobile (overflowing viewport). Fixed by adding both classes.

**Mobile hero rules updated (supersedes BUG-046 rules):**
```
1. Hero card:    height 240px, image ONLY — no text, no vignette, no buttons inside
2. Corner badge: ONLY non-text element allowed inside the card
3. Title:        BELOW the card — 20px, weight 900, 2-line clamp
4. Meta:         BELOW title — 10px cyan badge + duration + free/paid status
5. Description:  BELOW meta — 12px, rgba(255,255,255,0.5), 2-line clamp
6. Buttons:      BELOW description — full-width, borderRadius 12px, NOT 24px pill
```

**NEVER overlay text on mobile hero images.** Subject faces always in top 40% of frame.

---

## BUG-047 — Mobile Carousel: No Snap + No Pagination Dots (RESOLVED 2026-09-05, Session 12)

**Pages affected:** `/mn`, `/mn/videos`

**Symptoms:** Horizontal card rows scrolled freely with no snap points; no visual indicator of scroll position on mobile.

**Root cause:** Raw `<div style={{ display:'flex', overflowX:'auto' }}>` wrappers had no `scrollSnapType` and no dot UI.

**Fix:** Created `src/components/shared/CarouselRow.tsx` — client component with:
- `scrollSnapType: 'x mandatory'` on the scroll container
- `onScroll` handler tracking dot index (`Math.round((scrollLeft / max) * (dots - 1))`)
- Pagination dots (max 7, teal `#00B5AD` active pill, `rgba(255,255,255,0.2)` inactive)
- Right-fade `::after` gradient on `.mo-row-wrap` (mobile scroll hint)

**CSS classes added (all pages using CarouselRow must include these in their `<style>` tag):**
```css
.mo-snap-card { scroll-snap-align: start; }
.mo-carousel-dots { display: none; justify-content: center; gap: 5px; margin-top: 10px; }
@media (max-width: 767px) { .mo-carousel-dots { display: flex; align-items: center; } }
.mo-row-wrap { position: relative; overflow: hidden; }
.mo-row-wrap::after { content:''; position:absolute; top:0; right:0; bottom:0; width:56px;
  background:linear-gradient(to right,transparent,#141414); pointer-events:none; z-index:2; }
@media (min-width:768px) { .mo-row-wrap::after { display:none; } }
```

**Applied to:** `page.tsx` (4 rows: courses, articles, videos, shop), `VideosClient.tsx` (genre rows + movies row)

---

## SECURITY CONSTRAINTS (never change)

- Student count: NEVER shown anywhere on MO
- MC_ENCRYPTION_KEY: NEVER regenerate once QPay credentials saved
- .env.local: NEVER commit / upload anywhere
- LOCAL_PASSWORDS_DO_NOT_COMMIT.md: READ ONLY, never commit/push/share
- API keys: .env.local AND Vercel env vars only, never hardcoded
- GLink boost budget: $3 USD daily MAXIMUM

---

## BUG REGISTRY — Developer Incident Log

> **Rule:** Before fixing ANY bug, search this section first.
> If the bug class is already here, apply the known fix directly — do not re-investigate.
> After fixing a new bug, add it here immediately.

---

## [BUG-001] Git HEAD.lock / index.lock blocks commits from sandbox

**Status**: Known limitation. Manual workaround required.
**First seen**: 2026-08-25
**Module**: Git / Windows filesystem

### Symptom
`git commit` or `git add` fails with "Unable to create '.git/HEAD.lock': File exists" or "Unable to create '.git/index.lock': File exists" when run from the Claude sandbox.

### Root cause
The sandbox mounts the Windows filesystem. Windows Git leaves lock files behind after crashes or interruptions. The sandbox cannot delete Windows mount lock files due to filesystem permission boundaries.

### Fix
Amaraa must run this manually in CMD before each commit sequence:
```cmd
del .git\HEAD.lock 2>nul & del .git\index.lock 2>nul
```

### Prevention
Always run `del` on both lock files before `git add / commit / push` if a previous session ended abruptly.

---

## [BUG-002] Secrets in SESSION_NOTES committed to git → GitHub Push Protection blocks push

**Status**: Resolved. Preventive rules added.
**First seen**: 2026-08-26
**Module**: Developer workflow / session documentation

### Symptom
`git push` rejected: "Push cannot contain secrets — Sendinblue API Key detected."

### Root cause
Raw Brevo API key written into session notes files on Aug 23–24.

### Fix
1. Rotated Brevo API key in app.brevo.com → SMTP & API → API Keys
2. Updated new key in Vercel env vars + `.env.local`
3. Redacted old key in session notes files
4. Added `SESSION_NOTES_*.md` to `.gitignore`, ran `git rm --cached`
5. Used GitHub unblock URL after key rotation

### Prevention
**NEVER write raw credentials into session notes.** `SESSION_NOTES_*.md` is permanently gitignored. Credentials belong ONLY in `.env.local` + Vercel env vars.

---

## [BUG-003] Vercel GitHub webhook breaks after GitHub Push Protection event

**Status**: Fixed. Known operational risk.
**First seen**: 2026-08-26
**Module**: Vercel GitHub integration

### Symptom
After GitHub Push Protection blocks a push, Vercel stops auto-deploying new commits.

### Root cause
GitHub Push Protection interference breaks the Vercel webhook registration.

### Fix
Vercel → mommyoffice → Settings → Git → Click "GitHub" → Connect next to the correct repo. Then push any commit to trigger a fresh deploy.

### Prevention
After any rejected push, verify Vercel is still auto-deploying within 30s.

---

## [BUG-004] TypeScript error: `Buffer<ArrayBuffer>` not assignable to `ArrayBuffer`

**Status**: Fixed.
**First seen**: 2026-08-25
**Module**: `src/app/api/stream/token/route.ts`

### Fix
Change function signature from `base64url(data: ArrayBuffer)` to `base64url(data: ArrayBuffer | Buffer)`.

---

## [BUG-005] Vercel stale node_modules cache causes `Module not found` for newly added packages

**Status**: Fixed. Prevention in place.
**First seen**: 2026-08-26
**Module**: Vercel build / npm install

### Fix
Added `vercel.json` with `"installCommand": "npm ci"`. This deletes and reinstalls from lockfile every build, bypassing cache.

### Prevention
Keep `"installCommand": "npm ci"` in `vercel.json` permanently.

---

## [BUG-006] Turbopack cannot resolve `@tiptap/*` ESM packages on Vercel Linux build

**Status**: Fixed by removing Tiptap.
**First seen**: 2026-08-26
**Module**: `src/components/admin/RichTextEditor.tsx`

### Fix
Replaced all `@tiptap/*` with a pure React textarea + HTML formatting toolbar (zero npm dependencies).

### Prevention
Test production Vercel build before adopting ESM-heavy packages with Tiptap-style export maps.

---

## [BUG-007] `git add -A` stages local build artifacts

**Status**: Fixed. Prevention added.
**First seen**: 2026-08-26
**Module**: Developer workflow / git

### Fix
`git rm -r --cached tmp/` + commit + push. Added `tmp/` to `.gitignore`.

### Prevention
Always update `.gitignore` BEFORE running `git add`. Never run `next build` locally. Scan `git status --short` before committing.

---

## Template for new bug entries

```
## [BUG-NNN] Short title

**Status**: Active | Fixed | Known limitation
**First seen**: YYYY-MM-DD
**Module**: file path or component name

### Symptom
What the developer observes.

### Root cause
Why it happens.

### Fix
Exact code change or action taken.

### Prevention
How to avoid repeating this.
```
