# Session 24 Notes — 2026-09-15 — BUG-090, Ad Monetization System, Regression Fix

## Context
Session resumed from compaction (context limit hit mid-session). Continued MommyOffice development.

---

## What We Did

### 1. Expired Access Banner (carried from Session 23 boundary)
**File:** `src/app/[locale]/courses/[slug]/page.tsx`

`accessDenied = sp['access'] === 'denied'` flag was already declared. Added the banner JSX at top of return (before HEADER section):
- Red gradient bar with ⏰ icon
- Mongolian copy: "Таны хандах хугацаа дууссан байна"
- CTA button "Дахин авах →" scrolls to `#pricing`
- Commit: `5ef8450`

---

### 2. Regression Fix — Section Visibility Toggles Missing from `/admin/courses/new`
**Root cause:** `new/page.tsx` and `edit/page.tsx` are parallel files. When CF Stream ID masking was added to `new/page.tsx` in isolation, parity check was missed. `show_about` + `show_features` fields were only in `edit/page.tsx`.

**Fix:**
- Added `show_about: true, show_features: true` to form state in `new/page.tsx`
- Added `show_about: form.show_about, show_features: form.show_features` to `handleSave`
- Added "Хуудасны хэсгүүд" SideCard in right sidebar with 3 `SectionToggle` components
- Added `SectionToggle` pill-style toggle component (bottom of file)
- Added `show_about: boolean` and `show_features: boolean` to BOTH `createCourse` and `updateCourse` type signatures in `src/app/actions/admin.ts`
- **Parallel-file rule documented in `registry.md`**: `new/page.tsx` and `edit/page.tsx` must always match feature set

**Commits:** `376178c`, `fbf74e6`

---

### 3. Architecture Review — Documented in `registry.md`
- CF Stream ID role-based access (internal admin only, never creator portal or API responses)
- Right-panel purpose clarification (operational controls, not student-facing content)
- Multi-tenant roadmap: Phase 1 (current), Phase 2 (creator portal), Phase 3 (marketplace)
- 6 architecture invariants added to registry
- Pre-deploy 8-item checklist added

---

### 4. BUG-090 — Course Deletion Fails Silently (FK Constraint Violations)
**Root cause:** `deleteCourse()` in `admin/courses/actions.ts` called `.delete()` on `mo_courses` but discarded the Postgres error. FK constraints on `mo_access_tokens.course_id` and `mo_orders.course_id` blocked deletion silently.

**Fix — `src/app/[locale]/admin/courses/actions.ts`:**
```typescript
export async function deleteCourse(id: string): Promise<{ error: string | null }> {
  // Cascade-delete child rows first — FK constraints block course delete otherwise
  // Order: reviews → access_tokens → orders → course
  const { error: e1 } = await supabase.from('mo_reviews').delete().eq('course_id', id);
  if (e1) return { error: `Үнэлгээ устгахад алдаа: ${e1.message}` };
  const { error: e2 } = await supabase.from('mo_access_tokens').delete().eq('course_id', id);
  if (e2) return { error: `Хандалтын токен устгахад алдаа: ${e2.message}` };
  const { error: e3 } = await supabase.from('mo_orders').delete().eq('course_id', id);
  if (e3) return { error: `Захиалга устгахад алдаа: ${e3.message}` };
  const { error: e4 } = await supabase.from('mo_courses').delete().eq('id', id);
  if (e4) return { error: `Хичээл устгахад алдаа: ${e4.message}` };
  return { error: null };
}
```

**Fix — `src/app/[locale]/admin/courses/page.tsx`:** `handleDelete` now checks returned error, shows `alert()` on failure, only filters local state on success.

**Commit:** `571f706`

---

### 5. Full Ad Monetization System — Built from Scratch

#### DB — `mo_ads` table (SQL run in Supabase):
```sql
create table if not exists mo_ads (
  id           uuid primary key default gen_random_uuid(),
  slot         text not null,
  title        text,
  target_url   text not null,
  media_url    text not null,
  media_type   text not null default 'image' check (media_type in ('image','video')),
  is_active    boolean not null default true,
  starts_at    timestamptz,
  ends_at      timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists mo_ads_slot_active_idx on mo_ads (slot, is_active);
```

#### Ad Slots (8 total):
| Slot key | Location |
|---|---|
| `articles_leaderboard` | Articles list — mid-feed (728×90) |
| `articles_sidebar` | Articles list — right sidebar (300×250) |
| `articles_footer` | Articles list — footer (970×90) |
| `article_body_mobile` | Article detail — mobile inline |
| `article_sidebar` | Article detail — right sidebar (300×250) |
| `courses_sidebar` | Courses list — footer leaderboard |
| `videos_sidebar` | Videos page — between rows and Coming Soon |
| `home_below_hero` | Home page — below hero (reserved, not yet wired) |

#### Files Created:
- **`src/app/api/ads/[slot]/route.ts`** — public GET endpoint. Returns most recent active ad for slot, respects `starts_at`/`ends_at`. 60s CDN cache header.
- **`src/components/ui/LiveAdBanner.tsx`** — client component. Fetches on mount. Returns `null` when loading (no layout shift) or when no active ad (no empty box). Mobile (<768px) + video ad → `null` (image-only on mobile). Desktop image and video both supported.
- **`src/app/[locale]/admin/ads/page.tsx`** — full CRUD admin. Image/video upload (reuses `uploadImage` to `mommyoffice-media` bucket), paste media URL directly, slot picker, schedule dates, active toggle, media preview, per-slot status overview card.
- **`src/app/[locale]/admin/ads/actions.ts`** — `listAds`, `createAd`, `updateAd`, `deleteAd` server actions.

#### Pages Wired:
- `articles/page.tsx` — removed static `AdBanner` component (37 lines). Replaced with `LiveAdBanner` at 3 slots.
- `articles/[slug]/page.tsx` — replaced 2 inline placeholder divs with `LiveAdBanner`.
- `videos/VideosClient.tsx` — added `LiveAdBanner` between video rows and "Coming Soon" section.
- `courses/page.tsx` — added `LiveAdBanner` footer below course grid.
- `admin/page.tsx` — added "📢 Сурталчилгаа" nav button linking to `/admin/ads`.

**Commits:** `a69607a` (full system), `1ea02e3` (UX refinements — collapse + mobile image-only)

---

## Commit History This Session
| Commit | Description |
|---|---|
| `5ef8450` | Expired access banner on course detail page |
| `376178c` | Regression fix: section toggles in /new + parallel-file rule in registry |
| `fbf74e6` | Registry: multi-tenant roadmap + architecture invariants |
| `571f706` | BUG-090: cascade-delete for course deletion + error propagation to UI |
| `a69607a` | feat: full ad monetization system — LiveAdBanner + admin CRUD + API route |
| `1ea02e3` | fix: LiveAdBanner — collapse when no ad, image-only on mobile |

---

## UX / Behavior Rules Established This Session
- **Empty ad slot** → `LiveAdBanner` returns `null` — zero height, no dead space, no placeholder box
- **Loading state** → `null` (no layout shift during fetch)
- **Mobile + video ad** → suppressed entirely (image-only rule)
- **Desktop** → image and video both supported (video: autoplay, muted, loop)

---

## Security Constraints (always in effect)
- Student count: NEVER shown anywhere on MO — no exceptions
- MC_ENCRYPTION_KEY: NEVER regenerate once QPay credentials saved
- .env.local: NEVER commit to git
- LOCAL_PASSWORDS_DO_NOT_COMMIT.md: READ ONLY — never commit/push/share
- GLink boost budget: $3 USD daily MAXIMUM
- Never create `src/middleware.ts` — all edge middleware in `src/proxy.ts`
- CF Stream IDs never leave `/admin` — not in creator portal, not in API responses to students
- Video signing always required — `requireSignedURLs: true` on all CF Stream videos
- Enrollment gate always enforced in `/api/stream/token`

---

## Pending Tasks (Priority Order — Pre-Launch)

### MommyOffice
1. **Domain cutover** — Vercel Settings → Domains → add `mommyoffice.com`; GoDaddy DNS: `A @ → 76.76.21.21`, `CNAME www → cname.vercel-dns.com`
2. **Vercel env var** — `NEXT_PUBLIC_SITE_URL=https://mommyoffice.com` after domain
3. **Supabase Auth** — add `https://mommyoffice.com` to allowed redirect URLs
4. **Cloudflare Stream** — add `mommyoffice.com` to allowed origins
5. **Brevo SPF/DKIM** for `noreply@mommyoffice.com` (BUG-008)
6. **Upgrade plans** — Vercel Pro ($20/mo) + Supabase Pro ($25/mo)
7. **Fix missing lesson** "Хичээл 2" in Module 1 (admin panel)
8. **Add instructor records** at `/mn/admin/instructors`
9. **Populate 5 articles** (Money Talk, Mom Hacks, Ээжүүдийн хобби, Шинэхэн ээжүүд, Дотно харилцаа)
10. **Mobile audit** — `/mn/courses`, `/mn/videos`, `/mn` (KNOWN-003)
11. **Delete sensitive `.ps1` scripts** from mommyoffice folder before launch
12. **First ad** — upload to `/mn/admin/ads` once an advertiser is signed

### GLink
- Task #8: Contact Danford College — agency registration
- Task #9: Rewrite SOP Section 3 for Danford College

---

## HEAD.lock Recurring Pattern
Sandbox (Linux) cannot delete Windows git lock files. Pattern every session:
1. Commit succeeds in sandbox
2. Push requires PowerShell: `Remove-Item ".git\HEAD.lock" -ErrorAction SilentlyContinue` then `git push`
