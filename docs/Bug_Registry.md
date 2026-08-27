# MommyOffice — Bug Registry

Status: OPEN / FIXED / KNOWN

---

## FIXED Bugs

### BUG-001 — Git HEAD.lock blocks commits from sandbox
**Status:** FIXED (workaround)
**Symptom:** `git commit` fails with "fatal: Unable to create '.git/HEAD.lock': File exists"
**Root cause:** Windows file lock on `.git/HEAD.lock` / `.git/index.lock` — sandbox cannot delete Windows-locked files
**Fix:** User must run from CMD:
```cmd
del .git\HEAD.lock
del .git\index.lock
```
Then commit and push normally. Occurs intermittently; always check if a commit fails.

---

### BUG-002 — Hardcoded `mommyoffice-smoky.vercel.app` in 3 files
**Status:** FIXED (2026-08-27)
**Files fixed:**
- `src/app/api/qpay/create/route.ts` line 44
- `src/app/api/qpay/check/route.ts` line 84
- `src/app/[locale]/courses/[slug]/page.tsx` ShareButton URL
**Fix:** Changed to `process.env.NEXT_PUBLIC_SITE_URL || 'https://mommyoffice.com'`

---

### BUG-003 — Article detail hero gradient covering subject's face
**Status:** FIXED (2026-08-27)
**Symptom:** Dark gradient mask sitting too high on hero image, dimming the subject's face
**Fix:** Removed all hero image gradients entirely. Layout refactored to stacked: text header → pure photo → body. No overlays on hero image.

---

### BUG-004 — Article detail page: three separate width containers (unaligned layout)
**Status:** FIXED (2026-08-27)
**Symptom:** Title text (900px), hero photo (900px), and sidebar grid (1200px) were in separate containers — misaligned compared to ikon.mn
**Fix:** Wrapped all content in single `mo-detail-grid` (max-width 1200px). Left article column holds full vertical sequence, right 300px sticky sidebar.

---

### BUG-005 — Sidebar showing on mobile despite CSS `display: none`
**Status:** FIXED (2026-08-27)
**Symptom:** ИХ УНШИГДСАН and ТӨСТЭЙ НИЙТЛЭЛҮҮД sidebar blocks rendering on mobile phones, duplicating content
**Root cause:** Aside element had inline `style={{ display: 'flex' }}` which overrode the CSS `display: none` rule (inline styles have higher specificity than stylesheet rules)
**Fix:** Added `!important` to CSS rule:
```css
@media (max-width: 1024px) {
  .mo-detail-grid > aside { display: none !important; }
}
```

---

### BUG-006 — Python `zip` CLI fails on Windows-mounted paths
**Status:** FIXED (workaround)
**Symptom:** `zip` command returns "Operation not permitted" when writing to `/sessions/.../mnt/` paths
**Fix:** Use Python `zipfile` module instead of zip CLI for all docx repacking tasks

---

## OPEN Bugs

### BUG-007 — `/mn/access` returns 404
**Status:** OPEN
**Symptom:** Navigating to `/mn/access` returns a 404 page
**Priority:** Medium — blocks access page flow
**Next step:** Check if route file exists at `src/app/[locale]/access/page.tsx`

---

### BUG-008 — Brevo SPF/DKIM not configured for noreply@mommyoffice.com
**Status:** OPEN
**Symptom:** Outbound emails from noreply@mommyoffice.com may land in spam / fail delivery
**Fix needed:** Add SPF TXT record + DKIM CNAME records to mommyoffice.com DNS (records from Brevo dashboard → Senders & Domains)

---

## KNOWN Issues (by design / deferred)

### KNOWN-001 — `NEXT_PUBLIC_SITE_URL` not yet set in Vercel Production
**Status:** DEFERRED — intentional until domain cutover
**Note:** Fallback `|| 'https://mommyoffice.com'` in code handles this safely. Set env var at cutover time per Domain_Cutover_Checklist.md Step 1.

### KNOWN-002 — Course player not yet implemented
**Status:** DEFERRED
**Note:** Cloudflare Stream integration pending. Videos tab shows "УДАХГҮЙ" badge.

### KNOWN-003 — Mobile audit pending for `/mn/courses`, `/mn/videos`, `/mn`
**Status:** DEFERRED
**Note:** Desktop layout confirmed working. Mobile pass needed before launch.
