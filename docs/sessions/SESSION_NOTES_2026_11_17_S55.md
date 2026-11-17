# Session 55 — 2026-11-17
**Focus: V1 Videos Banner — Full Redesign, React Error Fix + Critical Site Restore**
**Type: Code — 8 files modified + 9 commits to production**

---

## What was worked on this session

Five workstreams in one session: (1) emergency production restore, (2) A1 mobile banner fix, (3) AR1+ARM slot merge, (4) V1 full redesign as a leaderboard between content rows, (5) React error #441 fix on admin media upload.

---

## 1. CRITICAL — Production Restore: `hasMobileImg` ReferenceError

**File:** `src/components/ui/LiveAdBanner.tsx`

**Problem:** Site was down — `ReferenceError: hasMobileImg is not defined` thrown during render because `hasMobileImg` was declared *after* `containerStyle` where it was used.

**Fix:** Moved `hasMobileImg` declaration (line 79) to before `containerStyle` (line 81).

**Commit:** `ba97d4d`

---

## 2. A1 Mobile Banner — `objectFit: contain` Fix

**File:** `src/components/ui/LiveAdBanner.tsx`

**Problem:** A1 (`articles_leaderboard`) desktop 728×90 image was being cropped on mobile — `objectFit: cover` cuts off the left/right edges of a wide landscape image when forced into a tall container.

**Fix:** Changed `mobileHorizontal && hasMobileImg` case from `objectFit: cover` → `objectFit: contain`.

```tsx
mobileHorizontal && hasMobileImg
  ? { width: '100%', height: mh, objectFit: 'contain' as const, display: 'block' }
```

**Commit:** `a98570d`

---

## 3. AR1 + ARM Merge — Single Unified Slot

**Files:** `src/app/[locale]/articles/[slug]/page.tsx`, `src/app/[locale]/admin/ads/page.tsx`

**Problem:** `article_sidebar` (AR1) was desktop-only; `article_body_mobile` (ARM) was a separate mobile-only slot requiring two separate ad uploads. Admin UX was fragmented.

**Decision:** Merge ARM into AR1 — same slot served as 300×250 desktop sidebar AND 390×100 mobile strip via CSS show/hide.

**Article page changes:**
```tsx
{/* Mobile-only: same slot as desktop sidebar, renders as 390×100 strip */}
<div className="mo-mobile-ad">
  <LiveAdBanner slot="article_sidebar" type="leaderboard" mobileHeight={100} style={{ borderRadius: 0 }} />
</div>
```
```css
@media (max-width: 1024px) {
  .mo-detail-grid > aside { display: none !important; }
  .mo-mobile-ad { display: block !important; margin-left: -1.5rem; margin-right: -1.5rem; }
}
```

**Admin panel:** Removed `article_body_mobile` entry from `SLOT_LABELS`. Mobile image section now renders for all slots unconditionally.

**Commits:** `1fff8e4`, `c198586`, `a821afa`

---

## 4. Admin SLOT_LABELS — Full Dimension Standardization

**File:** `src/app/[locale]/admin/ads/page.tsx`

Updated all slot labels to show exact Desktop + Mobile dimensions:

```ts
const SLOT_LABELS: Record<string, string> = {
  home_popup:           '[POP-UP] Нүүр хуудас — 8с Поп-ап (Desktop 800×400 + Mobile 800×400)',
  home_below_hero:      '[H1]     Нүүр хуудас — Hero доор (Desktop 1336×120 + Mobile 390×100)',
  articles_leaderboard: '[A1]     Нийтлэлүүд — Дунд (Desktop 728×90 + Mobile 390×100)',
  articles_sidebar:     '[A2]     Нийтлэлүүд — Sidebar (300×250 · Desktop тал)',
  articles_footer:      '[A3]     Нийтлэлүүд — Footer (Desktop 970×90 + Mobile 390×100)',
  article_sidebar:      '[AR1]    Нийтлэл — Sidebar Desktop (300×250) + Mobile (390×100)',
  courses_sidebar:      '[C1]     Хичээлүүд — Sidebar Desktop (300×250) + Mobile (390×100)',
  videos_sidebar:       '[V1]     Видеонүүд — Хөндлөн (Desktop 1336×120 + Mobile 390×100)',
};
```

Note: `article_body_mobile` entry removed entirely (merged into AR1).

---

## 5. V1 (`videos_sidebar`) — Full Redesign as Horizontal Leaderboard

**Files:** `src/app/[locale]/videos/VideosClient.tsx`, `src/app/[locale]/admin/ads/page.tsx`

### 5a. Architecture Change
Previous: V1 was a 300×250 desktop sidebar (never implemented).
New: V1 is a **full-width horizontal leaderboard** (1336×120 desktop, 390×100 mobile) positioned between the "Шинээр нэмэгдсэн" and "Санал болгох" rows.

### 5b. Implementation — Fragment injection between rows

```tsx
import { Fragment } from 'react';

{ROWS.map(row => {
  const rowVideos = filtered.filter(row.filter)...;
  if (!rowVideos.length) return null;
  return (
    <Fragment key={row.key}>
      <div>... row content ...</div>
      {row.key === 'new' && (
        <div className="mo-v1-banner" style={{ maxWidth:'1400px', margin:'0 auto', padding:'0.75rem 2rem' }}>
          <LiveAdBanner slot="videos_sidebar" type="leaderboard" mobileHeight={100} />
        </div>
      )}
    </Fragment>
  );
})}
```

Mobile full-bleed CSS:
```css
@media (max-width: 767px) {
  .mo-v1-banner { margin-left:-2rem !important; margin-right:-2rem !important; padding-left:0 !important; padding-right:0 !important; }
}
```

### 5c. Admin size hints updated for V1
```
🖥 Desktop: 1336×120px · 📱 Mobile: 390×100px
```
Mobile image label includes `videos_sidebar` in the 390×100 label group.

**Commits:** `04180ee` (desktop width fix), `21f51be` (leaderboard redesign)

---

## 6. React Error #441 Fix — Admin Upload

**Files:** `src/app/api/admin/upload/route.ts` (new), `src/app/[locale]/admin/ads/page.tsx`

**Problem:** Uploading media in the admin ads panel threw "Minified React error #441" for all slots. The error came from `uploadImage` being a **Server Action** called with direct `await` from async `onChange` event handlers — in React 19, Server Actions called outside `startTransition` or a form `action` go through React's flight transport, which throws #441 when async state updates are triggered outside the React scheduler.

**Fix:** Created a plain Next.js Route Handler (`POST /api/admin/upload?folder=ads`) with identical upload logic (auth check → Supabase storage). Both upload handlers in `ads/page.tsx` now call `fetch('/api/admin/upload')` instead of the Server Action — completely bypassing React's transport layer for file uploads.

**New route:** `src/app/api/admin/upload/route.ts`
- Admin auth via `checkAdmin()` (mirrors `assertAdmin` logic)
- Accepts `multipart/form-data` with `file` field
- 50 MB hard cap
- Returns `{ error: string | null, url: string | null }`

**Admin page change:**
```ts
// REMOVED: import { uploadImage } from '@/app/actions/admin';

// ADDED: local fetch helper (no React transport)
async function uploadMedia(fd: FormData) {
  const res = await fetch('/api/admin/upload?folder=ads', { method: 'POST', body: fd });
  return res.json() as Promise<{ error: string | null; url: string | null }>;
}
```

Both `handleMediaUpload` and the inline mobile image handler now call `uploadMedia(fd)`.

**Commit:** `78a809e`

---

## 7. V1 Border-Radius Polish

**File:** `src/app/[locale]/videos/VideosClient.tsx`

Removed explicit `style={{ borderRadius: 0 }}` from V1 `LiveAdBanner`. Default `borderRadius: '10px'` now applies — matching H1 and all other banners on the platform.

**Commit:** `28e1157`

---

## Commits This Session

| Hash | Description |
|---|---|
| `ba97d4d` | fix: hasMobileImg declared before containerStyle — restores production |
| `a98570d` | fix(a1): mobile banner objectFit contain — no side-cropping |
| `1fff8e4` | feat(ar1): merge article_body_mobile into article_sidebar |
| `c198586` | fix(admin): remove article_body_mobile from slot labels |
| `a821afa` | fix(admin): mobile image section renders for all slots unconditionally |
| `04180ee` | fix(v1): constrain desktop banner to 300px width wrapper |
| `21f51be` | feat(v1): redesign as full-width leaderboard between video rows |
| `78a809e` | fix: replace uploadImage Server Action with API route — fixes React #441 |
| `28e1157` | polish: restore default border-radius on V1 leaderboard banner |

---

## Final V1 Spec (confirmed working)

| Viewport | Position | Size | Notes |
|----------|----------|------|-------|
| Desktop | Between "Шинээр нэмэгдсэн" and "Санал болгох" rows | 1336×120px | Full-width leaderboard |
| Mobile ≤767px | Same position, full-bleed edge-to-edge | 390×100px | Negative margin CSS cancels 2rem padding |

**Advertiser uploads:**
- Main image/video: **1336×120px** (desktop leaderboard)
- Mobile image: **390×100px** (mobile strip; video slots require this for mobile visibility)

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
