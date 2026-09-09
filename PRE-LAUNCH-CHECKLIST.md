# MommyOffice — Pre-Launch Checklist

Last updated: 2026-09-09

---

## 🔴 MUST DO before going public

- [ ] **Test BUG-071 OTP flow** — go to `/mn/access`, enter email, check inbox for 6-digit code, enter code, confirm course redirect works end-to-end

- [x] **Brevo SMTP** — BUG-071: now using direct Brevo REST API (`/api/auth/send-code`). No Supabase SMTP config needed. Emails go directly via `BREVO_API_KEY` already in `.env.local` and Vercel.

- [ ] **Domain — connect `mommyoffice.com` to Vercel**
  - Vercel → Project → Settings → Domains → add `mommyoffice.com`
  - GoDaddy DNS → point nameservers to Vercel (or add A + CNAME records Vercel gives you)

- [ ] **`NEXT_PUBLIC_SITE_URL`** — set to `https://mommyoffice.com` in Vercel environment variables (after domain is connected)

- [ ] **Fix broken lesson** `fac775fea9a84b3ff2a2dc5f2a2e3535`
  - Admin → course edit page → find the lesson → click 🔄 Видео солих → re-upload

---

## 🟡 SHOULD DO before going public

- [ ] **Mobile QA** — test every page at 375px / 390px / 430px (course player, access page, home, course list)

- [ ] **Instructor records** — add instructor profiles at `/mn/admin/instructors`

---

## 🟢 NICE TO HAVE (can do after launch)

- [ ] **Archive staging code**
  - Delete `src/components/ui/VideoStagingUploader.tsx`
  - Delete `src/app/api/course-staging/presign/route.ts`
  - Delete `src/app/api/admin/staging-preview/route.ts`

- [ ] **Audit clearance report** sign-off

- [ ] **Facebook OAuth** — developers.facebook.com → App ID + Secret → Supabase → Facebook provider

---

## ✅ Completed (this sprint)

- [x] BUG-066 — Direct CF Stream TUS upload (drop Supabase staging bucket)
- [x] BUG-067 — CF Stream metadata backfill for pre-BUG-061 lessons
- [x] BUG-068 — Email-first course access (replaced broken UUID token flow)
- [x] BUG-069 — Secure magic link access flow on `/mn/access`
