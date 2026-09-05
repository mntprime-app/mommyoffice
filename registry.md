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
