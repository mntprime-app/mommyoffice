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

All four hero pages (Нүүр, Нийтлэл, Сургалт, Кино & Видео) share:

```tsx
{/* Outer — full-width background color */}
<div style={{ background: '#141414' }}>
  {/* Inner — aligned to grid standard */}
  <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '12px 2rem 0' }}>
    <section style={{
      position: 'relative', width: '100%',
      height: '65vh', minHeight: '420px',
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

### Rules

- **Never** set `heroVideoActive`, auto-play timers, or mute buttons on the hero card.
- **Never** put an `<iframe>` inside the hero `<section>`.
- **Never** use `aspectRatio` + `maxHeight` together on any container that holds an iframe.
- The modal's `paddingBottom: 56.25%` pattern is the ONLY safe iframe container.

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

## SECURITY CONSTRAINTS (never change)

- Student count: NEVER shown anywhere on MO
- MC_ENCRYPTION_KEY: NEVER regenerate once QPay credentials saved
- .env.local: NEVER commit / upload anywhere
- LOCAL_PASSWORDS_DO_NOT_COMMIT.md: READ ONLY, never commit/push/share
- API keys: .env.local AND Vercel env vars only, never hardcoded
- GLink boost budget: $3 USD daily MAXIMUM
