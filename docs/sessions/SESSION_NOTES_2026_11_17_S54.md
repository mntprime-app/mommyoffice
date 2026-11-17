# Session 54 — 2026-11-17
**Focus: C1 Courses Sidebar — Desktop 300×250 + Mobile 390×100 Full-Bleed Fix**
**Type: Code — 4 files modified + multiple git pushes to production**

---

## What was worked on this session

One workstream: fixing the C1 (`courses_sidebar`) ad slot to render correctly on both desktop (300×250 sidebar in 2-column grid) and mobile (390×100 full-bleed slim strip). Multiple iterations to reach the final solution.

---

## 1. C1 Desktop Sidebar — 2-Column Grid Layout

**Problem:** C1 banner was rendering full-width across the page (no sidebar layout).

**Fix:** Added `mo-courses-layout` CSS grid (`1fr 300px`) to `courses/page.tsx` with sticky sidebar.

```css
.mo-courses-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 2rem;
  align-items: flex-start;
}
.mo-courses-sidebar { position: sticky; top: 80px; min-width: 0; }
```

---

## 2. C1 Mobile — Dual-Render Architecture

**Problem:** On mobile (≤900px), the collapsed sidebar rendered as a tall square block (300×250 portrait image at full width ≈ 325px tall), dominating the page.

**Requirement:** Mobile must show a slim 390×100 horizontal strip, consistent with H1 mobile proportions.

**Solution:** Dual-render — two `LiveAdBanner` components from same `courses_sidebar` slot, CSS show/hide at breakpoint:

```tsx
{/* Desktop only — 300×250 sidebar */}
<div className="mo-courses-sidebar mo-c1-desktop">
  <LiveAdBanner slot="courses_sidebar" type="sidebar" />
</div>

{/* Mobile only — 390×100 full-bleed strip */}
<div className="mo-c1-mobile">
  <LiveAdBanner slot="courses_sidebar" type="leaderboard" style={{ borderRadius: 0 }} />
</div>
```

```css
.mo-c1-desktop { display: block; }
.mo-c1-mobile  { display: none; }

@media (max-width: 900px) {
  .mo-c1-desktop { display: none; }
  .mo-c1-mobile  { display: block; margin-top: 1.5rem; margin-left: -1rem; margin-right: -1rem; }
}
```

**Full-bleed via negative margin:** cancels parent container's `1rem` padding → edge-to-edge, no right-side crop. Same pattern as H1 mobile banner.

---

## 3. LiveAdBanner — `mobileHorizontal` Logic

**File:** `src/components/ui/LiveAdBanner.tsx`

Added `mobileHorizontal` flag for `leaderboard`/`footer` type on mobile:
- Container: `height: 100px` (fixed)
- Image: `height: 100px`, `objectFit: cover` (center-crops to slim strip regardless of source image dimensions)

This ensures portrait images (300×250 sidebar repurposed) are cropped to slim strip rather than rendering tall on mobile.

---

## 4. Admin Panel — C1 Mobile Image Size Hint

**File:** `src/app/[locale]/admin/ads/page.tsx`

- Slot size hint for `courses_sidebar`: `🖥 Desktop: 300×250px · 📱 Mobile: 390×100px`
- Mobile image label for C1 video ads: `📱 Мобайл зураг (390 × 100px — мобайл хэвтээ · видео орлуулга)`
- Mobile image label for C1 image ads: `📱 Мобайл зураг (390 × 100px — мобайл хэвтээ)`

---

## 5. AD_SLOT_REFERENCE.md — C1 Updated

```
| **C1** | `courses_sidebar` | Courses list | Sidebar (desktop) / Slim strip (mobile) | 300×250px | 390×100px | ✅ Live |
```

---

## Commits This Session

| Hash | Description |
|---|---|
| `310affc` | feat(c1): 2-column courses layout with sticky sidebar |
| `d4d1f13` | feat(c1): dual-render desktop sidebar + mobile leaderboard strip |
| `e213b2d` | fix(admin): C1 mobile image label shows 390×100px size |
| `27f2d7c` | fix(c1): full-bleed mobile banner — cancel parent padding to fix right-crop |

All commits pushed to `main` → Vercel auto-deployed. C1 confirmed working on both desktop and mobile.

---

## Final C1 Spec (confirmed working)

| Viewport | Rendering | Size | Notes |
|----------|-----------|------|-------|
| Desktop >900px | Sidebar in 2-column grid, sticky | 300×250px | `mo-c1-desktop` shown |
| Mobile ≤900px | Full-bleed horizontal strip | 390×100px | `mo-c1-mobile` shown, edge-to-edge |

**Advertiser uploads:**
- Main image: **300×250px** (desktop sidebar)
- Mobile image: **390×100px** (mobile strip fallback for video, or dedicated mobile creative)

---

## Security & Production Rules (unchanged)
- `MC_ENCRYPTION_KEY` — NEVER regenerate once QPay credentials are saved
- `.env.local` — NEVER commit, push, or share
- QPay webhook `/api/qpay/callback` — never rename, move, or break
- Student count — never shown anywhere on MO
- Enrolled customers (`Төлөгдсөн`) — untouchable without explicit written instruction from Amaraa

---

## Pending / Backlog Carried Forward

| Priority | Item |
|---|---|
| HIGH | Lucy Guo article — Article Prompt v4 + ElevenLabs script ready (pending since S47) |
| HIGH | cron-job.org — POST `https://mommyoffice.com/api/cron/abandoned-cart` with `x-cron-secret` header every 60 min |
| HIGH | COL Group call outcome — update partnership status |
| MEDIUM | Delete `/api/test/send-reminder` route |
| MEDIUM | 3 untracked optimised images in `/public/` (`og-image_opt.png`, `og-image_opt2.png`, `squarelogo_opt.png`) |
| MEDIUM | Test ElevenLabs Dubbing v2 with sample Chinese drama clip |
| MEDIUM | Add contact email/phone to `MommyOffice_AdRateCard_2026.pdf` before sending to advertisers |
| MEDIUM | Courses page pagination — add when catalog grows past ~30 courses |
| DOCUMENTATION | Update rate card PDF to include new slot codes (POP-UP, H1, A1, etc.) |
| DOCUMENTATION | Google Drive sync — upload SESSION_NOTES, PROJECT_LOG.md, registry.md |
| LOW | BUG-106 — QPay callback URL hardening |
| LOW | Rich Results test on article URL |
| LOW | Delete unused `ShareButton.tsx` |
| LOW | Delete CF Stream Pending Upload ghost |
| LOW | Orders audit |
