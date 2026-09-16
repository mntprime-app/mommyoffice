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
**Status:** FIXED (2026-08-30)
**Symptom:** Navigating to `/mn/access` returns a 404 page
**Fix:** Created `src/app/[locale]/access/page.tsx` — redesigned as a unified two-tab hub (Сурагч + Багш tabs). Student tab handles token entry + course/video browse. Instructor tab links to `/instructor/login` and `/become-instructor`.

---

### BUG-008 — Brevo SPF/DKIM not configured for noreply@mommyoffice.com
**Status:** OPEN
**Symptom:** Outbound emails from noreply@mommyoffice.com may land in spam / fail delivery
**Fix needed:** Add SPF TXT record + DKIM CNAME records to mommyoffice.com DNS (records from Brevo dashboard → Senders & Domains)

---

### BUG-009 — Trending section alignment (4-iteration failure loop)
**Status:** FIXED (2026-08-27, 4th attempt)
**Symptom:** Right column of 5 articles not aligning top/bottom edges with left hero card
**Root cause chain:**
- Attempt 1: Text block below image made left card taller than pure image → right column misaligned to full card height
- Attempt 2: Overlay text on image (user rejected — text illegible on image)
- Attempt 3: `repeat(5, 1fr)` grid rows + uniform padding → outer boundaries broke (card 1 pushed down, card 5 pushed out)
- Attempt 4 (FIXED): `flex: 1` per item + `paddingTop: 0` on first, `paddingBottom: 0` on last, `10px` symmetric on middle
**Fix applied:**
- Left card: `aspectRatio: 16/9` image + fixed `height: 80px` text box below on dark bg
- Right column: `display: flex, flexDirection: column, height: 100%`
- Each item: `flex: 1, display: flex, alignItems: center, paddingTop: isFirst ? 0 : 10px, paddingBottom: isLast ? 0 : 10px`
**Lessons:**
- Never add uniform padding to bordered list — first needs pt-0, last needs pb-0
- Always reason from slot height math before coding, not after seeing a bug
- Do not switch layout approach (overlay vs. below) without user request

---

### BUG-089 — CF Stream "This content is blocked" regression (Session 25)
**Status:** FIXED (2026-09-16, commit `0e11fc6`)
**Symptom:** Course player iframe showed "This content is blocked" after every env var edit
**Root cause chain (3 stacking issues):**
1. `/api/stream/token` fallback used `${token}` (the JWT var) instead of `${videoId}` — CF rejected it silently
2. Wrong Vercel env var: Stripe-like key pasted into CF_STREAM_KEY_SECRET field during S24 Vercel edits
3. `crypto.subtle.sign()` never throws on a wrong key — produces a valid-looking JWT that CF's public-key check rejects. Undetectable server-side. Caused two separate incidents.
4. After removing JWT: new URL used `…/iframe` suffix valid only for signed customer-subdomain format, not unsigned `iframe.cloudflarestream.com`
**Fix:** Removed CF JWT signing entirely from production path. Direct embed `https://iframe.cloudflarestream.com/${videoId}`. Enrollment gate remains: 401 if no cookie, 403 if not enrolled.
**Commits:** `17c1139` → `d42beaa` → `0e11fc6`
**Lesson:** Never store a 2KB JWK in Vercel env var UI — any truncation produces a structurally valid but cryptographically broken key with no error.

---

### BUG-091 — "Failed to fetch" on video TUS upload (CSP connect-src)
**Status:** FIXED (2026-09-16, commit `6826296`)
**Symptom:** Uploading video to admin course editor failed with "Failed to fetch" in browser console
**Root cause:** CSP `connect-src` directive was missing `https://upload.cloudflarestream.com`. Browser blocked the TUS PATCH request before it left the client.
**Fix:** Added `https://upload.cloudflarestream.com` to `connect-src` in `next.config.ts`

---

### BUG-092 — Ad form: "Зураг"/"Видео" buttons not opening file pickers
**Status:** FIXED (2026-09-16, commit `2ac682a`)
**Symptom:** Clicking type buttons in admin ad form opened nothing — no file picker appeared
**Root cause:** Buttons were wired only as type-label toggles; no hidden `<input type="file">` refs were attached
**Fix:** Added three hidden file inputs with React refs (`imagePickerRef`, `videoPickerRef`, `mobileImageRef`). Buttons call `ref.current?.click()`. Removed `set('media_type')` from button onClick — `handleMediaUpload` auto-detects type from `file.type` only.

---

### BUG-093 — Ad form: selecting the same file twice did nothing
**Status:** FIXED (2026-09-16, commit `2ac682a`)
**Symptom:** After uploading a file in the ad form, clicking the same button and selecting the same file again triggered no upload
**Root cause:** `<input type="file">` value was never reset after upload, so `onChange` didn't fire for the same file
**Fix:** Added `e.target.value = ''` at the start of `handleMediaUpload`

---

### BUG-094 — Video ad preview black / not playing in admin form
**Status:** FIXED (2026-09-16, commit `f27694e`)
**Symptom:** After uploading an MP4 ad, the preview video element showed as black and didn't play
**Root cause:** Preview `<video>` element had no `autoPlay` attribute
**Fix:** Added `autoPlay muted loop controls playsInline` to preview video, plus `key={form.media_url}` to force remount when URL changes

---

### BUG-095 — Video ads not loading in browser (CSP media-src)
**Status:** FIXED (2026-09-16, commit `bdba7f6`)
**Symptom:** Video ads uploaded to Supabase storage silently failed to play in LiveAdBanner — no console error, just blank
**Root cause:** CSP `media-src` directive was missing `https://*.supabase.co` and `https://*.supabase.in`. Browser blocked `<video src="https://…supabase.co/…">` at the network layer.
**Fix:** Added both Supabase domains to `media-src` in `next.config.ts`
**Note:** CSP `media-src` controls `<video>`/`<audio>` source loading — distinct from `connect-src` (fetch/XHR) and `img-src`. All three must include domains used.

---

### BUG-097 — CourseOutline accordion crashes page on expand
**Status:** FIXED (2026-09-16, commit `e5ec523`)
**Symptom:** Clicking any ▼ module or "Бүгдийг дэлгэх" in "Хичээлийн агуулга" sidebar caused Chrome "This page couldn't load" crash
**Root cause:** Two mismatches between DB format and component interface:
1. DB stores module name as `title` key; component read `section` key → module titles showed as blank
2. DB stores lessons as objects `{ title, stream_id, ... }`; component rendered `{lesson}` directly as JSX → React threw "Objects are not valid as a React child" → hard page crash
3. The cast `outline as { section: string; lessons: string[] }[]` in page.tsx hid both mismatches at compile time
**Fix:** Replaced the bare cast with a proper transform in the `outlineData` IIFE in `src/app/[locale]/courses/[slug]/page.tsx`:
- Maps `m.title ?? m.section` → `section`
- Maps `lesson.title` (or raw string fallback) → lesson string
**Note:** This bug existed since the admin editor was built — the admin saves rich objects to preserve `stream_id`, but the student-facing display never accounted for that format.

---

### BUG-096 — `mo_reviews.user_id NOT NULL` blocked seeded/migrated reviews
**Status:** FIXED (2026-09-16, Supabase migration)
**Symptom:** INSERT into `mo_reviews` for migrated Kajabi reviews failed: `null value in column "user_id" violates not-null constraint`
**Root cause:** `mo_reviews.user_id` was created NOT NULL. Migrated reviews have no MommyOffice user account.
**Fix:** `ALTER TABLE mo_reviews ALTER COLUMN user_id DROP NOT NULL;`
**Note:** Existing rows with real user_id values are unaffected. New submissions via the review API always set `user_email` (not user_id) — tracked correctly going forward.

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

### KNOWN-004 — `/mn/instructor/login` page not yet built
**Status:** DEFERRED — Phase 2
**Note:** `/access` Багш tab links to this page. Page doesn't exist yet (404). Instructor login + dashboard is Phase 2 work, after launch prep is complete.

### KNOWN-005 — `qpay_username` column may be missing from `mo_instructors`
**Status:** NEEDS VERIFICATION
**Note:** First Supabase migration screenshot had lines 2–3 cut off. `qpay_username` TEXT column may not have been added. Verify in Supabase table editor before implementing per-instructor QPay routing.

### KNOWN-006 — Cloudflare Stream Webhooks UI not visible in free plan sidebar
**Status:** KNOWN / WORKAROUND IN PLACE
**Symptom:** Cloudflare dashboard → Stream → Webhooks page shows blank content; no Webhooks nav item in sidebar under free "Images & Stream" plan
**Root cause:** Webhooks UI tab only appears after a paid Stream plan is active. Free plan only shows Videos, Live inputs, Transformations, Analytics in sidebar.
**Workaround:** Webhook registered successfully via REST API (PUT /accounts/{id}/stream/webhook). Secret retrieved from API response and saved to env vars. Webhook is active and functional — only the UI tab is hidden.
**Note:** Not a blocker. Webhook fires correctly on video encoding completion.
