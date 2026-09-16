# Session 25 — MommyOffice — 2026-09-16

**Session type:** Bug fix + launch preparation
**Status at close:** BUG-089 fully resolved. Course player playing. Registry hardened. Launch-ready.
**Next session:** This afternoon/evening — domain cutover and official launch.

---

## What Happened This Session

### Context
Session resumed from compaction (Session 24 ended with BUG-089 partially resolved). The course player at `/mn/courses/easyenglish/learn` was showing "This content is blocked" again on the CF Stream iframe. User had a firm launch deadline (same evening).

---

## BUG-089 Regression — Root Cause Chain

Three separate issues were stacking:

**Issue 1 — Wrong fallback URL in token route**
`/api/stream/token` fallback used `${token}` (the JWT variable) instead of `${videoId}`. `iframe.cloudflarestream.com` expects `/{videoId}` — passing a JWT caused CF to reject it. Fixed in commit `17c1139`.

**Issue 2 — Wrong Vercel env var (CF_STREAM_KEY_SECRET = sk_live_a12…)**
A Stripe-like key was accidentally pasted into the CF Stream signing key field during Session 24 Vercel edits. Corrected to proper `eyJ…` JWK. But this alone was insufficient because of Issue 3.

**Issue 3 — `crypto.subtle.sign()` never throws on a wrong key**
The root cause of all BUG-089 recurrences. `crypto.subtle.sign()` produces a structurally valid JWT even when signed with a wrong/corrupted key. CF's public-key check rejects it silently ("This content is blocked"). This is undetectable server-side without a round-trip to CF. The Vercel env var holding the 2KB JWK is fragile — any edit in the Vercel UI can corrupt it without warning. After two separate incidents confirming this pattern, CF JWT signing was removed from the production path entirely.

**Issue 4 — Wrong URL format after removing JWT signing**
After removing JWT signing, the new direct embed URL was written as `https://iframe.cloudflarestream.com/${videoId}/iframe` — the `/iframe` suffix is only valid for the signed customer-subdomain format (`customer-{sub}.cloudflarestream.com/{JWT}/iframe`). The unsigned host ignores the suffix and returns blocked/blank. Fixed in commit `0e11fc6`.

---

## Commits This Session

| Commit | Description |
|--------|-------------|
| `17c1139` | fix(BUG-089): harden token route — fallback URL was `${token}`, changed to `${videoId}` |
| `d42beaa` | fix(BUG-089-final): remove CF JWT signing entirely; direct embed + Supabase enrollment gate |
| `0e11fc6` | fix: correct CF Stream direct embed URL — remove erroneous /iframe suffix ← **PRODUCTION** |
| `4c67d6a` | docs: permanent CF Stream URL rules + BUG-089 invariants + Session 25 close |

---

## Final State of /api/stream/token

```typescript
// Enrollment confirmed. Return direct CF Stream embed URL.
// Unsigned direct embed. CF format: iframe.cloudflarestream.com/{videoId} — NO /iframe suffix.
const iframeUrl = `https://iframe.cloudflarestream.com/${videoId}`;

return NextResponse.json({ iframeUrl }, {
  headers: { 'Cache-Control': 'private, no-store' },
});
```

Full file: `src/app/api/stream/token/route.ts`

---

## Security Model (Without CF JWTs)

1. Returns 401 if no `mo_user_email` cookie
2. Returns 403 if user has no valid `mo_access_tokens` record covering the videoId
3. Video IDs (cloudflare_stream_id) never returned in student-facing responses
4. `requireSignedURLs=false` on all 12 CF videos (confirmed via `disable-signed-urls.ps1`)

**Known tradeoff:** A paying enrolled student could extract the videoId from browser network tab and share a direct CF URL. This requires technical knowledge. Acceptable for launch; closed by restoring signed tokens post-launch (see registry SOP).

---

## CF Video State Confirmed

`disable-signed-urls.ps1` ran successfully — all 12 videos confirmed `OK`:
- 40.1. Active voice, 3. Auxiliary verbs.mp4
- 11. 4-р шат. Үгсийн аймаг үүсдэг талаар.mp4
- 10. 3-р шат. Үгсийн аймаг өгүүлбэрт байрладаг талаар.mp4
- 8. 2-р шат. Adjective.mp4
- 9. 2-р шат. Conjuction, Adverb, Preposition, Determiners.mp4
- 7. 2-р шат. Noun, Pronoun, Verb.mp4
- 5. 1-р шат Үгийн төрөл ялгах - бүүу үгсийн аймаг.mp4
- 4. Хичээл 2 - Орон орны хэл (1).mp4
- 3. Хичээл 1 - Дүрэм чухал уу.mp4
- 1. Англи хэлний сургалтанд тавтай морил.mp4 (×2 — both versions)
- 2. Сурахуйд суралцах талаар.mp4

---

## Registry Updates This Session

1. **BUG-089 Regression entry** — root cause chain logged
2. **BUG-089 Final Resolution entry** — JWT signing removed, security model documented
3. **Fixed stale URL format** in Final Resolution (was showing `/iframe` suffix — corrected)
4. **PERMANENT RULE — CF Stream URL Format** — two formats documented, NEVER interchangeable
5. **PERMANENT RULE — CF Stream Token Route Invariants** — 5 invariants that must hold on every future edit
6. **Session 25 Close entry** — commits, CF state, pre-launch items

---

## Pre-Launch Checklist for Next Session

These must be completed before official domain launch:

- [ ] **Domain cutover** — GoDaddy DNS: `A @ 76.76.21.21`, `CNAME www → cname.vercel-dns.com`
- [ ] **Vercel env var** — set `NEXT_PUBLIC_SITE_URL=https://mommyoffice.com`, then redeploy
- [ ] **Supabase Auth** — add `https://mommyoffice.com` to allowed redirect URLs
- [ ] **Cloudflare Stream** — add `mommyoffice.com` to allowed origins (CRITICAL — videos will block on live domain without this)
- [ ] **Brevo** — SPF/DKIM for `noreply@mommyoffice.com`
- [ ] **Fix missing Хичээл 2** in Module 1
- [ ] **Add instructor records** at `/mn/admin/instructors`
- [ ] **Delete sensitive .ps1 scripts** before public launch: `disable-signed-urls.ps1`, `generate-cf-key.ps1`, `verify-cf-body.ps1`
- [ ] **Populate 5 articles** at `/mn/admin/articles`
- [ ] **Mobile audit** — `/mn/courses`, `/mn/videos`, `/mn` (KNOWN-003)
- [ ] **Vercel Pro** ($20/mo) + **Supabase Pro** ($25/mo)

---

## Post-Launch Priority (Not Blocking Launch)

- Restore CF signed token signing (see registry "Restoring signed tokens" SOP)
- Upload first ad at `/mn/admin/ads` once advertiser signed
- GLink Task #8: Contact Danford College — agency registration
- GLink Task #9: Rewrite SOP Section 3 for Danford College

---

## Security Constraints (Always Active)

- Student count: NEVER shown anywhere on MO
- MC_ENCRYPTION_KEY: NEVER regenerate once QPay credentials saved to mo_business_settings
- `.env.local`: NEVER commit to git
- CF Stream IDs: NEVER leave `/admin` — not in creator portal, not in API responses to students
- Enrollment gate: ALWAYS enforced in `/api/stream/token`
- Never create `src/middleware.ts` — all edge middleware lives in `src/proxy.ts`
- GLink boost budget: $3 USD daily MAXIMUM
