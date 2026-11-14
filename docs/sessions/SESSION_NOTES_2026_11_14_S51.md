# Session 51 — 2026-11-14
**Focus: Ad Slot Reference Doc + Upload Hang Fix + Compression Audit + Target URL Optional + Popup Banner Polish (Mosaic Animation + Mobile Fix)**
**Type: Code — 6 files modified + 1 new file + multiple git pushes to production**

---

## What was worked on this session

Five workstreams completed in sequence: (1) ad slot reference documentation with pixel dimensions, (2) upload hang root-cause fix + site-wide compression audit, (3) target URL made optional across the full ad system, (4) popup banner animation (3 iterations → mosaic tile grid), (5) mobile popup sizing + admin form mobile image field for POP-UP slot.

---

## 1. Ad Slot Reference Document

**File created:** `docs/AD_SLOT_REFERENCE.md`

9 slots with standardised codes, slot IDs, pages, desktop/mobile pixel dimensions, and admin usage guide:

| Code | Slot ID | Desktop | Mobile |
|---|---|---|---|
| POP-UP | home_popup | 976×350px (21:8) | 800×400px (2:1) |
| H1 | home_below_hero | Full width × 120px | Full width × 100px |
| A1 | articles_leaderboard | 728×90px | 320×50px |
| A2 | articles_sidebar | 300×250px | 300×250px |
| A3 | articles_footer | 970×90px | 320×50px |
| AR1 | article_sidebar | 300×250px | 300×250px |
| ARM | article_body_mobile | — | 320×100px |
| C1 | courses_sidebar | 300×250px | 300×250px |
| V1 | videos_sidebar | 300×250px | 300×250px |

SLOT_LABELS in admin `ads/page.tsx` updated to include code prefixes (e.g. `[POP-UP]`, `[H1]`, `[A1]` …).

---

## 2. Upload Hang Fix + Site-Wide Compression Audit

### Root Cause (upload hang)
`handleMediaUpload` had no try/catch. If `uploadImage()` threw (network error, auth error, Supabase timeout), `setUploadingMedia(false)` was never called → UI permanently stuck on "Байршуулж байна...".

### Fixes applied
**`src/app/[locale]/admin/ads/page.tsx`**
- `handleMediaUpload`: wrapped in try/catch/finally — `setUploadingMedia(false)` ALWAYS runs
- Mobile image handler: same try/catch/finally pattern
- Added WebP compression via `compressImage()` before upload (image files only; videos pass through)

**`src/app/actions/admin.ts`**
- `uploadImage` server action: entire body wrapped in try/catch — always returns `{ error, url }`, never throws

**`src/lib/imageCompress.ts`**
- Added `'ads'` preset: `{ w: 1920, h: 1080, maxKB: 400 }`
- Added `fit?: boolean` option: `fit: true` → scale-to-fit without cropping (used for ad banners)

### Compression audit result
All other upload paths (articles, courses, videos, profile, inline editor) already compressed to WebP before upload. Only ads page was sending raw files. Fixed.

---

## 3. Target URL Optional

**Problem:** Some advertisers don't provide a landing URL. The form required it, and an empty `href` on `<a>` creates invalid HTML.

**Files changed:**
- `src/app/[locale]/admin/ads/page.tsx`: removed required validation; label changed to "(заавал биш)"
- `src/components/ui/LiveAdBanner.tsx`: renders `<div>` instead of `<a>` when `target_url` is empty (`hasLink` check)
- `src/components/ui/HomeHeroAdBanner.tsx`: same `hasLink` pattern for popup and inline banner

---

## 4. Popup Banner Animation — 3 Iterations

### Iteration 1 (CSS transition approach)
Switched from `moAdModalIn`/`moAdModalOut` keyframe name-swap (unreliable) to CSS `transition` with `popupIn` boolean + double `requestAnimationFrame`. Removed heavy dark overlay, added backdrop-blur scrim. Issue: animations still not visible — discovered CSS `perspective + rotateX` on the card itself is clipped by parent `overflow: hidden`.

### Iteration 2 (3D card-level transform)
Applied 3D cube-unfolding on the card element. Still not visible — same overflow clipping issue on the card-level transform.

### Iteration 3 — FINAL: Mosaic Tile Grid (shipped ✅)
**File:** `src/components/ui/HomeHeroAdBanner.tsx`

**Architecture:**
- 8×4 tile grid on desktop, 4×3 on mobile (`position: absolute`, `inset: 0`, over the ad image)
- `TilePhase: 'entering' | 'active' | 'exiting'`
  - `entering` → tiles play `mo-tile-reveal` keyframe (flip away, diagonal top-left → bottom-right stagger)
  - `active` → tiles removed from DOM (image fully visible)
  - `exiting` → tiles remounted with new keys, play `mo-tile-cover` (reverse diagonal)
- Stagger: `(col + row) * 52ms` entry; `((cols-1-c) + (rows-1-r)) * 52ms` exit
- Per-tile `perspective(300px) rotateX()` — NOT clipped by `overflow: hidden` on parent card
- `animation-fill-mode: both` — tiles hold final state after animation
- `willChange: 'transform, opacity'` — GPU acceleration
- Key = `${tilePhase}-${r}-${c}` — forces React remount to restart animation on phase switch
- Total reveal time: (8+4-2)×52 + 260 = 884ms desktop

**Bug fixed during this workstream:** `useMemo` was placed after `if (!showPopup && !showBanner) return null` — violated React Rules of Hooks, crashed the entire page on production. Fixed by moving all hooks above the early return. Hotfix committed and pushed immediately.

### Additional features added to popup
- "СУРТАЛЧИЛГАА" teal pill badge (top-left, matches site's category tag style)
- Countdown chip moved OUTSIDE the card (below it, never overlaps ad content)
- Popup guard: `if (!media_url?.startsWith('http')) return` — prevents popup showing with broken image

---

## 5. Mobile Popup Sizing + Admin Form Updates

### Admin form (`src/app/[locale]/admin/ads/page.tsx`)
- Mobile image upload field now appears for **POP-UP slot + all video ads** (previously video only)
- Label for POP-UP slot: `📱 Мобайл зураг (800 × 400px — поп-ап мобайл хувилбар)`
- Helper text differentiated: popup vs video-only slots
- **Size guidance** shown below slot selector for all 9 slots (desktop + mobile px dimensions)

### Frontend mobile (`src/components/ui/HomeHeroAdBanner.tsx`)
- Mobile aspect ratio: `4/3` → `2/1` (matches 800×400 recommended upload exactly)
- `objectFit: contain` on mobile when no mobile_image_url (prevents landscape crop inside 2:1 box)
- `objectFit: cover` once dedicated mobile image is uploaded

---

## Commits This Session

| Hash | Description |
|---|---|
| `d2a0983` | feat: add SLOT_LABELS with codes + AD_SLOT_REFERENCE.md with pixel dimensions |
| `a7950c2` | fix(ads): upload hang + compression + target_url optional |
| `d3199a5` | fix(ads): move useMemo above early return — fix React Hook order crash (HOTFIX) |
| `a834bde` | feat(ads): mosaic tile grid reveal/cover animation for popup banner |
| `4257874` | feat(ads): add СУРТАЛЧИЛГАА badge to popup banner top-left |
| `0fd76b8` | feat(ads): mobile image field for POP-UP slot + size hints + mobile fit fix |
| `1bc27fc` | fix(ads): mobile popup aspect ratio 2/1 + countdown below card |

All 7 commits pushed to `main` → Vercel auto-deployed. Site confirmed operational after hotfix.

---

## Security & Production Rules (unchanged — restated for record)
- `MC_ENCRYPTION_KEY` — NEVER regenerate once QPay credentials are saved
- `.env.local` — NEVER commit, push, or share
- `LOCAL_PASSWORDS_DO_NOT_COMMIT.md` — read only, never commit
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
| DOCUMENTATION | Update rate card PDF to include new slot codes (POP-UP, H1, A1, etc.) |
| DOCUMENTATION | Google Drive sync — upload SESSION_NOTES, PROJECT_LOG.md, registry.md |
| LOW | BUG-106 — QPay callback URL hardening |
| LOW | Rich Results test on article URL |
| LOW | Delete unused `ShareButton.tsx` |
| LOW | Delete CF Stream Pending Upload ghost |
| LOW | Orders audit |
