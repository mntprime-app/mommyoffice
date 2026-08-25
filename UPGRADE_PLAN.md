# MommyOffice — Platform Upgrade Roadmap
Last updated: 2026-08-25

## Current State (Free Tier)
- Supabase Free: 500MB DB, 1GB storage, daily backups (1-day retention)
- Vercel Hobby: 100GB bandwidth, mommyoffice-smoky.vercel.app
- Cloudflare Stream: pay-per-minute (no subscription yet)
- Domain: mommyoffice.com (GoDaddy, not yet connected to Vercel)

---

## ✅ Completed Tasks
- [x] Mobile UX audit + responsive CSS fixes
- [x] Hero section mobile layout (buttons side-by-side, no collision)
- [x] Full admin dark theme (all 7 admin routes)
- [x] Admin: Course editor (/admin/courses/[id]/edit)
- [x] Admin: Article editor with trending pin + placement zones
- [x] Admin: Orders page with revenue metrics + product type badges
- [x] Admin: Courses/new with dark inputs + 2MB image guard
- [x] Admin: Articles/new with dark inputs + image helper + placement zone
- [x] Supabase migration: is_pinned_trending, pin_rank, placement, view_count on mo_articles
- [x] Navbar: Кино & Видео + Дэлгүүр with "Удахгүй" badge
- [x] Coming-soon pages: /videos and /shop
- [x] QPay payment integration
- [x] Brevo email (basic — FROM_EMAIL not yet domain-verified)
- [x] Auth flow: Supabase Auth + /welcome + /my-courses

---

## 🔴 Critical — Do First
1. **Connect mommyoffice.com domain to Vercel**
   - Vercel → Settings → Domains → add mommyoffice.com
   - GoDaddy: set A record → 76.76.19.61, CNAME www → cname.vercel-dns.com

2. **Upgrade Supabase to Pro ($25/mo)** — needed for:
   - Point-in-Time Recovery (payment data protection)
   - Image transformations (WebP auto-conversion)
   - 100GB storage (vs 1GB free)
   - Deadline: before 100 paid users or first $500 MRR

3. **Fix Brevo domain email**
   - Add noreply@mommyoffice.com as Brevo sender
   - Verify DNS (SPF, DKIM) in GoDaddy
   - Update FROM_EMAIL env var in Vercel
   - Currently: emails send from generic Brevo address

4. **Fix instructor slug** (blocks instructor profile pages)
   ```sql
   UPDATE mo_instructors SET slug = 'b-narantuya' WHERE slug IS NULL OR slug = '';
   ```

5. **Revert test price on geriin-hool-hiih-urlag course**
   - Via admin course editor → set price back to 19900

---

## 🟡 High Priority — Next Sprint
6. **Add video content to first course**
   - Upload to Cloudflare Stream → copy Video ID
   - Admin course editor → Cloudflare Stream Video ID field → save
   - Add outline JSON via curriculum builder

7. **Course player page** — /[locale]/courses/[slug]/learn
   - Cloudflare Stream signed JWT playback
   - Lesson sidebar with progress tracking
   - Access gate (mo_orders check)

8. **Search page** — /[locale]/search?q=
   - Query mo_courses + mo_articles full-text
   - Unified results grid

9. **Image optimization (WebP)**
   - Upgrade Supabase Pro → enable image transformations
   - Update <Image> src to append ?format=webp&width=X&quality=80

10. **Storage backup cron**
    - GitHub Actions weekly job: list mommyoffice-public bucket → copy to Cloudflare R2
    - Cost: ~$0.02/GB/month

---

## 🟢 Phase 2 — Platform Expansion
11. **Кино & Видео section** (/videos)
    - New table: mo_videos (title, cloudflare_stream_id, category, price)
    - Admin video manager
    - Video player page with DRM

12. **Дэлгүүр** (/shop)
    - New table: mo_products (title, price, stock, images)
    - Product listing + QPay checkout
    - Order fulfillment tracking

13. **RBAC / Vendor Portal**
    - mo_vendors table + mo_user_roles
    - Instructor can manage own courses only
    - Admin can manage all

14. **Email sequences (Brevo)**
    - Welcome email → day 3 nudge → day 7 check-in
    - Course completion certificate email

15. **Analytics dashboard**
    - view_count increment on article/course view
    - Revenue chart (daily/weekly/monthly) in admin overview
    - Top courses by orders

---

## 💰 Cost Upgrade Triggers
| Trigger | Action |
|---|---|
| Domain connected | None — free |
| First real payment received | Supabase Pro ($25/mo) for PITR |
| >10 courses or >1GB storage | Already on Pro |
| >100GB Vercel bandwidth | Vercel Pro ($20/mo) |
| Custom domain email | Brevo Starter ($25/mo) — 20k emails/mo |
| **Total at 10× scale** | **~$70-95/mo** |

---

## 🔐 Security Rules (never change)
- MC_ENCRYPTION_KEY: NEVER regenerate once QPay creds saved
- .env.local: NEVER commit, NEVER share
- LOCAL_PASSWORDS_DO_NOT_COMMIT.md: READ ONLY
- Student count: NEVER show anywhere on platform
- GLink boost budget: $3 USD daily MAXIMUM
- No dashes in Aria's documents — use commas
