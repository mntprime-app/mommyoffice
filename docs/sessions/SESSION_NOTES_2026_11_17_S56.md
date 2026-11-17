# Session 56 — 2026-11-17
**Focus: Global Border-Radius Standardization + C1 Leaderboard Redesign**
**Type: Code — 5 files modified + 4 commits to production**

---

## What was worked on this session

Three workstreams: (1) uniform `10px` border-radius audit across all banner slots, (2) C1 redesign from 300×250 sidebar to full-width 1336×120 leaderboard.

---

## 1. Global Border-Radius Audit — All LiveAdBanner Slots

**Problem:** Several banner slots had explicit `style={{ borderRadius: 0 }}` overrides, applied originally so full-bleed mobile strips wouldn't show rounded corners at the page edge. This left them looking inconsistent on desktop. The V1 banner (fixed in S55) proved that `10px` corners look correct even on full-bleed strips.

**Files changed:** `articles/page.tsx`, `articles/[slug]/page.tsx`, `courses/page.tsx`

**Slots fixed (removed `borderRadius: 0` override):**

| Slot | File |
|------|------|
| A1 — Articles leaderboard | `articles/page.tsx` |
| A3 — Articles footer | `articles/page.tsx` |
| AR1 mobile — Article detail mobile strip | `articles/[slug]/page.tsx` |
| C1 mobile — Courses mobile strip | `courses/page.tsx` |

**Complete site-wide border-radius state after fix:**

| Slot | Radius |
|------|--------|
| POP-UP | `10px` / `14px` (custom component, unchanged) |
| H1 | `10px` desktop (custom component, unchanged) |
| A1 | `10px` ✅ |
| A2 | `10px` ✅ (was already default) |
| A3 | `10px` ✅ |
| AR1 desktop | `10px` ✅ (was already default) |
| AR1 mobile | `10px` ✅ |
| C1 desktop | `10px` ✅ (was already default) |
| C1 mobile | `10px` ✅ |
| V1 | `10px` ✅ (fixed in S55) |

**Commit:** `5d8174e`

---

## 2. C1 Courses Page — Redesign from Sidebar to Full-Width Leaderboard

**File:** `src/app/[locale]/courses/page.tsx`

**Problem:** The 300×250 sidebar layout created a 2-column grid (`1fr 300px`) that broke the course card alignment — cards couldn't fill the row naturally when only one course existed.

**Decision:** Match V1 pattern — full-width horizontal leaderboard positioned below the course grid.

### Layout change

**Before:**
```
┌──────────────────────────────┬──────────┐
│  Course card grid (1fr)      │ 300×250  │
│                              │ C1 side  │
└──────────────────────────────┴──────────┘
+ separate mobile-only 390×100 strip
```

**After:**
```
┌──────────────────────────────────────────┐
│  Course card grid (full width, auto-fill)│
└──────────────────────────────────────────┘
┌──────────────────────────────────────────┐
│  C1 Leaderboard  1336×120 / 390×100      │
└──────────────────────────────────────────┘
```

### Code changes

Removed:
- `mo-courses-layout` 2-column grid wrapper
- `mo-courses-sidebar` / `mo-c1-desktop` sidebar div
- `mo-c1-mobile` separate mobile-only div
- Dual `LiveAdBanner` instances (one sidebar + one leaderboard)

Added:
```tsx
{/* C1 — full-width leaderboard below course grid */}
<div className="mo-c1-banner" style={{ marginTop: '2rem' }}>
  <LiveAdBanner slot="courses_sidebar" type="leaderboard" mobileHeight={100} />
</div>
```

Mobile full-bleed CSS (cancels parent `1rem` padding):
```css
@media (max-width: 767px) {
  .mo-c1-banner { margin-left: -1rem !important; margin-right: -1rem !important; }
}
```

Net result: 39 lines removed, 9 added.

---

## 3. Admin — C1 Slot Label + Size Hint Updated

**File:** `src/app/[locale]/admin/ads/page.tsx`

**SLOT_LABELS:**
```ts
// Before
courses_sidebar: '[C1]     Хичээлүүд — Sidebar Desktop (300×250) + Mobile (390×100)'

// After
courses_sidebar: '[C1]     Хичээлүүд — Хөндлөн (Desktop 1336×120 + Mobile 390×100)'
```

**Size hint (upload form):**
```
// Before
🖥 Desktop sidebar: 300 × 250px · 📱 Mobile: 390 × 100px

// After
🖥 Desktop: 1336 × 120px · 📱 Mobile: 390 × 100px
```

**Commit:** `1bf86a3`

---

## Final C1 Spec (confirmed working)

| Viewport | Rendering | Size | Notes |
|----------|-----------|------|-------|
| Desktop | Full-width leaderboard below course grid | 1336×120px | Rounded 10px corners |
| Mobile ≤767px | Full-bleed horizontal strip | 390×100px | Negative margin CSS, rounded corners |

**Advertiser uploads:**
- Main image/video: **1336×120px** (desktop leaderboard)
- Mobile image: **390×100px** (mobile strip; video slots require this for mobile visibility)

---

## Commits This Session

| Hash | Description |
|---|---|
| `5d8174e` | polish: uniform 10px border-radius on all LiveAdBanner slots |
| `1bf86a3` | feat(c1): redesign from sidebar to full-width horizontal leaderboard |

---

## Security & Production Rules (unchanged)
- `MC_ENCRYPTION_KEY` — NEVER regenerate once QPay credentials are saved
- `.env.local` — NEVER commit, push, or share
- QPay webhook `/api/qpay/callback` — never rename, move, or break
- Student count — never shown anywhere on MO
- Enrolled customers (`Төлөгдсөн`) — untouchable without explicit written instruction from Amaraa
- GLink boost budget — $3 USD daily MAXIMUM

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
| DOCUMENTATION | Update rate card PDF to include new slot codes (POP-UP, H1, A1, A2, A3, AR1, C1, V1) |
| DOCUMENTATION | Google Drive sync — upload SESSION_NOTES, PROJECT_LOG.md, registry.md |
| LOW | BUG-106 — QPay callback URL hardening |
| LOW | Rich Results test on article URL |
| LOW | Delete unused `ShareButton.tsx` |
| LOW | Delete CF Stream Pending Upload ghost |
| LOW | Orders audit |
