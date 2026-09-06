# MommyOffice — Session Notes 2026-09-06 · Session 17
**Alex (AI Director) × Amaraa**

---

## COMPLETED THIS SESSION

### Task #27 · Zero Badges on Images + Unified Category Badge System

**Directive (Lead UX Director authority):**
> "Strip ҮНЭГҮЙ OFF the Thumbnail Image — Zero Overlays on Photos. Move to External Metadata Line. Unified Category Tag Pill Standard — all category tags to exact same elegant pill style as Article section. You need act as the director Alex, I don't want to micromanage everything."

**Phase 1 — Remove all badges from images (`deaf43e`)**

Removed every overlaid `<span>` from inside image `<div>` containers across all card types. Free/paid status moved to external text box as subtle pills. Category tags moved to text box.

Files changed: `VideosClient.tsx`, `RelatedVideosRow.tsx`, `articles/page.tsx`, `page.tsx`

**Phase 2 — CategoryBadge shared component (`2213558`)**

User identified remaining deviation: video section was using `borderRadius: 20px` (pill/capsule) while article section uses a subtle semi-rounded rectangle. Badges also stacking vertically instead of rendering inline.

**Solution:** Extracted to single shared source of truth:

```
src/components/ui/CategoryBadge.tsx
```

Three exports, all matching article list baseline exactly:
- `CategoryBadge` — always teal, `borderRadius: 4px`, `fontWeight: 800`, `letterSpacing: 0.8px`
- `StatusBadge` — free/paid, green/amber variant, same shape
- `PriceBadge` — course price, free=green / paid=teal+₮, same shape

**Article baseline spec locked (do not deviate):**
```ts
fontSize: '10px', fontWeight: 800, letterSpacing: '0.8px',
textTransform: 'uppercase', color: '#00B5AD',
background: 'rgba(0,181,173,0.12)', border: '1px solid rgba(0,181,173,0.35)',
borderRadius: '4px', padding: '2px 8px'
```

All 4 card files now import from `@/components/ui/CategoryBadge` — future style changes are one-line edits.

**Commits:**
| Hash | Description |
|------|-------------|
| `deaf43e` | UX: Task#27 — zero badges on images, unified pill system platform-wide |
| `2213558` | UX: Task#27 — CategoryBadge shared component, article baseline style platform-wide |

---

## PENDING / CARRY-FORWARD

| Priority | Item |
|----------|------|
| 🔴 Revenue blocker | Checkout `/checkout/[slug]` — guest form → QPay QR → mo_enrollments |
| 🔴 Revenue blocker | Cart page `/cart` |
| 🟡 Admin | `/admin/courses/[id]/edit` — add CoverImagePicker (only `/new` done) |
| 🟡 Admin | Admin video forms — comments_enabled toggle (Task #21) |
| 🟡 Admin | Detail page — duration badge fix + wire VideoComments + ViewCounter (Task #22) |
| 🟡 Content | Fill `duration_text` for all 5 uploaded videos via edit form |
| 🟠 Domain | Connect `mommyoffice.com` in Vercel + set `NEXT_PUBLIC_SITE_URL` |

---

## SECURITY CONSTRAINTS (carry-forward, non-negotiable)
- Student count: NEVER shown anywhere on MO
- .env.local: NEVER commit / push / share
- LOCAL_PASSWORDS_DO_NOT_COMMIT.md: READ ONLY
- API keys: local .env.local + Vercel env vars only, never hardcoded
- GLink boost budget: $3 USD daily maximum
- MC_ENCRYPTION_KEY: NEVER regenerate once QPay credentials saved
