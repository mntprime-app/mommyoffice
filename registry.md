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

**NEVER USE aspect-ratio on mobile hero.** 4:5 = 468px at 375px viewport. Use `height: '260px'` always.

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

## SECURITY CONSTRAINTS (never change)

- Student count: NEVER shown anywhere on MO
- MC_ENCRYPTION_KEY: NEVER regenerate once QPay credentials saved
- .env.local: NEVER commit / upload anywhere
- LOCAL_PASSWORDS_DO_NOT_COMMIT.md: READ ONLY, never commit/push/share
- API keys: .env.local AND Vercel env vars only, never hardcoded
- GLink boost budget: $3 USD daily MAXIMUM
