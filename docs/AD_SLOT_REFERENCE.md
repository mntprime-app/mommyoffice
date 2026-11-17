# MommyOffice — Ad Slot Reference
**Last updated: 2026-11-14 (Session 50)**

---

## Slot Code Map

| Code | Slot ID (DB) | Page | Location | Desktop Size | Mobile Size | Status |
|------|-------------|------|----------|-------------|-------------|--------|
| **POP-UP** | `home_popup` | Homepage | Full-viewport 8s overlay, first visit | 1100×413px (16:6 ratio) | 100vw × 75vw (4:3 ratio) | ✅ Live |
| **H1** | `home_below_hero` | Homepage | Between Онцлох хичээлүүд & Трэндинг нийтлэл | 1336 × 120px (11:1) | 390 × 100px (3.9:1) | ✅ Live |
| **A1** | `articles_leaderboard` | Articles list | Mid-content horizontal | 728×90px | 320×50px | ✅ Live |
| **A2** | `articles_sidebar` | Articles list | Right sidebar | 300×250px | 300×250px | ✅ Live |
| **A3** | `articles_footer` | Articles list | Bottom of page | 970×90px | 320×50px | ✅ Live |
| **AR1** | `article_sidebar` | Article detail | Right sidebar | 300×250px | 300×250px | ✅ Live |
| **ARM** | `article_body_mobile` | Article detail | In-body, mobile only | — (mobile only) | 320×100px | ✅ Live |
| **C1** | `courses_sidebar` | Courses list | Right sidebar | 300×250px | 300×250px (max-width capped) | ✅ Live |
| **V1** | `videos_sidebar` | Videos list | Right sidebar | 300×250px | 300×250px | ✅ Live |

---

## Homepage Slots Detail

### POP-UP — `home_popup`
- **What it does:** Appears as a full-viewport overlay when user first opens the homepage. Auto-closes after 8 seconds. Has ✕ close button. Only shows once per browser session (sessionStorage).
- **Desktop:** Supports animated video (autoplay, muted, loop) or static image
- **Mobile:** Shows `mobile_image_url` static image fallback if ad is video type
- **Click-through:** Entire banner is clickable → opens `target_url` in new tab
- **Admin label:** `[POP-UP] Нүүр хуудас — 8с Поп-ап оверлей`

### H1 — `home_below_hero`
- **What it does:** Permanent horizontal banner strip between Featured Courses and Trending Articles sections. Has ✕ dismiss button (hides for session).
- **Desktop canvas:** 1336 × 120px — container is `maxWidth: 1400px` with 32px padding each side
- **Mobile canvas:** 390 × 100px — full-bleed on mobile (no side padding), designs edge-to-edge
- **Design note:** Upload separate mobile image — aspect ratios differ significantly (11:1 desktop vs 3.9:1 mobile). Keep key content centered within the 390px width.
- **Admin label:** `[H1] Нүүр хуудас — Hero доор хөндлөн`

---

## Rate Card Package → Slot Mapping

| Package | Slots Included |
|---------|---------------|
| **PREMIUM** ₮2,500,000/mo | POP-UP + H1 + A2 + C1 + all monthly Facebook Reels + article mention |
| **GOLD** ₮1,400,000/mo | H1 + A2 or C1 + 2 Facebook Reels |
| **VIDEO ONLY** ₮400,000/reel | Facebook Reel only |
| **WEB ONLY** from ₮150,000/slot/mo | Any single slot (A1–V1) |

---

## Admin Panel Usage

1. Go to `/mn/admin/ads`
2. Click **+ Шинэ зар**
3. Select slot from **Байршлын зай** dropdown (codes shown in brackets)
4. Fill in: Очих URL (required), upload image or video, set schedule dates if needed
5. Toggle **Идэвхтэй** ON → click **Нэмэх**

**Important:** POP-UP and H1 are independent — an advertiser can buy just one or both.

---

## Technical Notes

- All slots served via `/api/ads/{slot_id}` (GET, cached 60s)
- Component: `src/components/ui/LiveAdBanner.tsx` (all slots except homepage)
- Component: `src/components/ui/HomeHeroAdBanner.tsx` (POP-UP + H1)
- sessionStorage keys: `mo_homePopupSeen` (POP-UP), `mo_homeBannerHidden` (H1)
- Video ads: desktop shows `<video autoPlay muted loop>`, mobile uses `mobile_image_url` fallback
- If no active ad for a slot → component returns null, zero layout impact
