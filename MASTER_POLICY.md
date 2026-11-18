# MommyOffice — Master Policy
**Director of Software Development: Alex (AI)**
**Owner: Amaraa**
**Last updated: 2026-10-12**

---

## ⚠️ PRODUCTION ALERT — SITE IS LIVE WITH REAL PAYING CUSTOMERS

**mommyoffice.com is live. Real customers have purchased courses. This changes everything.**

### Non-negotiable rules for every session from this point forward:

| Rule | Detail |
|------|--------|
| **No breaking changes** | Zero tolerance for any code change that could disrupt enrolled students' access to their courses, login, or payment history. |
| **Test before deploy** | Every code change must be reviewed for impact on: enrollment flow, QPay callback, Brevo email delivery, Supabase `mo_enrollments` table, and customer-facing pages. |
| **Customer data backup** | All orders (name, email, phone, course, amount, date) must be exported to a Google Sheet backup after every session that touches the DB or orders system. Google Sheet: GLink Strategic Projects → MommyOffice → `Customer_Orders_Backup`. |
| **No DB migrations without review** | Any Supabase migration that touches `mo_enrollments`, `mo_orders`, `mo_users`, or `mo_business_settings` must be reviewed line-by-line before running on production. |
| **QPay webhook sacred** | The QPay callback endpoint (`/api/qpay/callback`) must never be renamed, moved, or broken. It is the payment confirmation lifeline. |
| **Enrolled customers = untouchable** | Any customer with status `Төлөгдсөн` (paid) in `mo_orders` has enrolled access. Nothing may revoke, alter, or expire their enrollment without explicit written instruction from Amaraa. |

> **Origin:** As of 2026-10-13 (Session 47), mommyoffice.com has real paying customers. This rule exists to protect them permanently.

---

## 0. SESSION COMMANDS

### Starting a session
> **`Alex, resume MommyOffice`**

Alex will automatically:
1. Read `PROJECT_LOG.md` — understand where we left off
2. Read `registry.md` — reload all standards and known bugs
3. Read latest file in `docs/sessions/` — see pending carry-forward items
4. Report: *"Session [N] ready. Last commit was [hash]. Pending: [list]."*

### Ending a session
> **`Alex, close session`**

Alex will automatically:
1. Write `SESSION_NOTES_YYYY_MM_DD_S[N].md` to `docs/sessions/` (completed work + commit hashes + pending items)
2. Update `registry.md` with any new bugs or standards from this session
3. Update `PROJECT_LOG.md` with the session summary
4. Provide the git commit command to run
5. Remind Amaraa to re-upload changed files to Google Drive → MommyOffice

---

## 0. DUAL-SAVE RULE — LOCAL + GOOGLE DRIVE (Non-Negotiable)

> Amaraa works across multiple devices. **Every project document must exist in two places simultaneously:**
> 1. Local: `F:\MNT\Workspace\GLink Strategic Projects\mommyoffice\`
> 2. Google Drive: `GLink Strategic Projects → MommyOffice\`

### Google Drive folder structure (mirror local docs/)
```
GLink Strategic Projects/
└── MommyOffice/
    ├── Sessions/               ← all SESSION_NOTES_*.md
    ├── MASTER_POLICY.md
    ├── PROJECT_LOG.md
    ├── registry.md
    ├── UPGRADE_PLAN.md
    ├── AUDIT_CLEARANCE_REPORT_*.md
    ├── supabase_schema.sql
    └── docs/                   ← Word docs, video prompts, ElevenLab scripts
```

### After every session — mandatory sync checklist
- [ ] Upload new `SESSION_NOTES_YYYY_MM_DD.md` to Drive → MommyOffice → Sessions
- [ ] Re-upload `PROJECT_LOG.md` (updated each session)
- [ ] Re-upload `registry.md` if any bugs or standards were added
- [ ] Re-upload any other file that changed this session

### What does NOT go to Drive
- `.env.local` — never, anywhere (security rule)
- `LOCAL_PASSWORDS_DO_NOT_COMMIT.md` — never, anywhere
- `node_modules/`, `.next/`, build artifacts — not needed

---

## 1. FILE ORGANIZATION

### ⚠️ PERMANENT FILE STRUCTURE RULES (Non-Negotiable — Updated 2026-09-20)

#### Rule A — Root Project Log (ONE file, ONE location)
> `PROJECT_LOG.md` at the repo root is the **only** project log. It is the single source of truth for all session history, commit chains, and work summaries.
> - **NEVER** create `docs/Session_Log.md` or any variant (e.g. `Session_Log.md`, `dev_log.md`, `changelog.md`)
> - **NEVER** create a second project log anywhere in the repo
> - Every session closeout updates `PROJECT_LOG.md` — no exceptions

#### Rule B — Unified Registry (ONE file, ONE location)
> `registry.md` at the repo root is the **only** bug and standards registry.
> - **NEVER** create standalone `Bug_Registry.md`, `bug-log.md`, or any secondary bug file
> - All known issues, bug states, architectural states, and SEO/system component status go in `registry.md`
> - `docs/Bug_Registry.md` was deleted 2026-09-20 — it must never be recreated

#### Rule C — Session Notes (strict naming, strict location)
> All per-session technical notes go exclusively in `docs/sessions/` with the naming format:
> ```
> SESSION_NOTES_YYYY_MM_DD_S[N].md
> ```
> Example: `SESSION_NOTES_2026_09_20_S39.md`
> - Separator: **underscore only** (no dashes)
> - Session number suffix `_S[N]` is **mandatory** — not optional
> - Multiple sessions same day: increment session number only (S39, S40...), not a letter suffix
> - **NEVER** place session notes at repo root
> - **NEVER** place session notes in `docs/` root (only in `docs/sessions/` subdirectory)

---

### Project root — allowed files only
| File | Purpose |
|------|---------|
| `MASTER_POLICY.md` | This document |
| `PROJECT_LOG.md` | **ONLY** running session log — all sessions, all commits |
| `registry.md` | **ONLY** registry — bugs, layout standards, UX rules, system state |
| `UPGRADE_PLAN.md` | Planned future upgrades |
| `AUDIT_CLEARANCE_REPORT_*.md` | Pre-launch audit reports |
| `supabase_schema.sql` | DB schema snapshot |
| Config files | `next.config.ts`, `package.json`, `tsconfig.json`, `vercel.json`, `postcss.config.mjs` |

**No stray session notes at root.** All session notes go to `docs/sessions/`.

### docs/ folder structure
```
docs/
├── sessions/           ← ALL session notes (SESSION_NOTES_YYYY_MM_DD_S[N].md)
├── sql/                ← SQL migration files
└── [legacy prompt files — superseded by Google Drive Master Prompt v3]
```

**Content pipeline prompt:** Lives in Google Drive → MommyOffice → `MommyOffice_Gemini_Master_Prompt_v3`
(see Section 12 for full content pipeline workflow)

**Note:** `docs/Session_Log.md` and `docs/Bug_Registry.md` were deleted 2026-09-20. They must never be recreated.

---

## 2. THE REGISTRY — One Canonical File

**File:** `registry.md` (root level — not in `docs/`)

This is the **single source of truth** for:
- Bug registry (BUG-001 through BUG-NNN) — status: FIXED / OPEN / KNOWN / RESOLVED
- System architecture state (domain, analytics, SEO components)
- Layout & grid standards
- Mobile UX standards
- Admin CMS standards
- CSS class definitions
- Component API contracts
- Pending / future work backlog

**Rule:** Before fixing ANY bug, search `registry.md` first. If already documented, apply the known fix. After fixing a new bug, add it to `registry.md` immediately.

**Prohibited:** Never create `Bug_Registry.md`, `bug-log.md`, or any secondary file. `registry.md` is the single source of truth — no exceptions.

---

## 3. END-TO-END SYSTEM ARCHITECTURE — FULL LIFECYCLE MINDSET (Mandatory)

> **Violation of this section is a P0 engineering failure.**

### 3.1 — Admin Feature Lifecycle Rule

Before writing any code for an Admin feature, Alex must trace it across the **full lifecycle**:

| Layer | Check |
|---|---|
| **Creation** | `/admin/[resource]/new` — does the field exist here? |
| **Edit** | `/admin/[resource]/[id]/edit` — does the field exist here? |
| **DB** | Supabase schema + server actions — is it stored and returned? |
| **Home rendering** | `/mn` (Home page) — does the front-end read it? |
| **Hub rendering** | `/videos`, `/courses`, `/articles` hubs — does each hub read it? |
| **Modals** | `HeroDetailModal` + any hub modals — do all modals handle it? |

**Rule:** Never release an Admin feature on an `edit` page without verifying that the `new` page fully supports it. A feature that can only be set on edit — but not at creation — is an incomplete feature.

### 3.2 — Mandatory Bug Logging

Every bug, regression, or omission discovered must be formally logged in `registry.md` before the session ends, with:

- **ID & Title** (e.g., `BUG-056: Omission of content_type on /admin/videos/new`)
- **Root cause** — the reasoning gap that produced it
- **Full-stack resolution** — changes across Admin, DB, and Front-End layers
- **Commit hash(es)**

---

## 4. GIT COMMIT STANDARDS

### Format
```
<type>(<scope>): <short description>
```

| Type | Use for |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `UX` | Visual / layout improvement |
| `admin` | Admin CMS changes |
| `db` | Database migrations |
| `docs` | Documentation only |
| `refactor` | Code reorganization, no behavior change |
| `style` | CSS / styling only |

### Rules
- Commit message in English
- One logical change per commit — do not bundle unrelated changes
- Never commit `.env.local` — ever
- Never commit `~$*.docx` or `.tsbuildinfo` (add to `.gitignore` if needed)
- Always `git add <specific files>` — never `git add .` unless reviewed

---

## 5. SECURITY RULES — NON-NEGOTIABLE

| Rule | Detail |
|------|--------|
| `.env.local` | **NEVER** commit, push, or share. Local only + Vercel env vars. |
| `LOCAL_PASSWORDS_DO_NOT_COMMIT.md` | READ ONLY. Never commit, push, or share. |
| API keys | Local `.env.local` AND Vercel env vars only. Never hardcode in source. |
| `MC_ENCRYPTION_KEY` | **NEVER** regenerate once QPay credentials are saved to `mo_business_settings`. |
| Student count | **NEVER** shown anywhere on MO — no exceptions, no UI, no logs. |
| GLink boost budget | **$3 USD daily MAXIMUM** — no exceptions. |

---

## 6. MOBILE LAYOUT STANDARD (BUG-048)

**Platform rule for all mobile hero cards (`<768px`):**

```
[Category badge — plain teal text, above card]
[Title — full width, above card, no overlay]
┌────────────────────────┐
│                        │  ← 240px pure image card
│    objectFit: cover    │     NO text inside
│    objectPosition: top │     NO vignette inside
│                        │     NO buttons inside
└────────────────────────┘
[▶ ҮЗЭХ button — full width, below card]
[ⓘ ДЭЛГЭРЭНГҮЙ button — full width, below card]
```

Violations of this standard are bugs. Log them in `registry.md`.

---

## 6. ADMIN CMS STANDARD (BUG-049)

All admin create/edit forms must use:
- **`CoverImagePicker`** component — no primitive `<input type="file">` for cover images
- **Dual live preview** — desktop 16:9 cinematic card + mobile 240px pure card
- **Mobile poster upload** — optional field for mobile-specific crop
- **Title char count** — live counter + ⚠️ warning above 60 chars
- **Thumbnail Priority** — custom upload = 100% priority; YouTube/auto = fallback only

---

## 7. CAROUSEL STANDARD (BUG-047)

All horizontal scroll rows use `CarouselRow` component:
- `scrollSnapType: x mandatory`
- Pagination dots: teal `#00B5AD` active pill, grey inactive
- Max 7 dots displayed
- `gap` prop controls card spacing

---

## 8. SESSION NOTES POLICY

**Every session** must produce a session note saved to `docs/sessions/` before closing.

Session note must include:
- Session number + date
- All completed work with commit hashes
- Pending/carry-forward items with priority
- Any new bugs discovered (logged to `registry.md` first)

**Google Drive sync:** All files in `docs/sessions/` must be copied to GLink Google Drive → MommyOffice folder after each session.

---

## 9. PRE-LAUNCH CHECKLIST

Before going live on `mommyoffice.com`:

- [ ] `mobile_cover_image` DB migration run on Supabase (`mo_videos`, `mo_courses` tables)
- [x] Checkout page `/checkout/[slug]` complete — commit `51ad26f` (2026-08-24)
- [ ] Cart page `/cart` complete
- [x] QPay integration tested end-to-end — QR → payment → enrollment → Brevo email confirmed live (2026-08-24, re-verified 2026-09-08)
- [x] QPAY_USERNAME, QPAY_PASSWORD, QPAY_INVOICE_CODE, QPAY_SANDBOX in Vercel Production — confirmed (2026-08-24)
- [x] BREVO_API_KEY in Vercel Production — confirmed working (email delivery verified 2026-09-08)
- [ ] Domain `mommyoffice.com` connected in Vercel
- [ ] `NEXT_PUBLIC_SITE_URL=https://mommyoffice.com` set in Vercel env vars
- [ ] All 5 pending videos entered in admin CMS
- [ ] Supabase `media` bucket permissions verified (public read)
- [x] `/admin/courses/[id]/edit` upgraded with CoverImagePicker — commit `1951490` (2026-09-08)
- [ ] `/admin/articles/[id]/edit` upgraded with Thumbnail Priority tooltip
- [ ] Full mobile QA at 375px, 390px, 430px viewports
- [ ] Audit clearance report signed off

---

## 11. 🛡️ ZERO-REGRESSION & FEATURE PRESERVATION POLICY

**Effective: 2026-09-06, Session 16. Binding on all future sessions.**

### Rule 1 — Pre-Refactor Feature Inventory
Before refactoring or rewriting ANY page (`/mn`, `/courses`, `/articles`, `/videos`, `/admin`, or any sub-route), Alex MUST produce a written inventory of every active sub-component on that page — including but not limited to:
- Data-fetch queries and their outputs
- Client components (carousels, counters, share buttons, comment blocks, related shelves)
- Server actions wired to the page
- URL routing behaviour (slugs, query params, fallbacks)

This inventory must appear in the session notes or as a code comment block before the refactor begins.

### Rule 2 — Mandatory Preservation
No existing feature, component, or data connection may be removed, simplified out, or omitted during any code update **unless explicitly requested in writing by Amaraa (Product Owner)**. Silence is NOT permission to remove.

### Rule 3 — Pre-Commit Regression Audit
Before every `git commit` that touches an existing page, Alex MUST verify — by reading the current file — that every item from the pre-refactor inventory is still present and functional. If anything is missing, the commit is blocked until it is restored.

### Rule 4 — "I Touched It, I Own It"
If Alex edits a file, Alex is responsible for the full correctness of that file after the edit — not just the lines changed. Partial edits that break surrounding features are treated as regressions.

### Violation consequence
Any regression discovered by Amaraa resets that feature's session priority to P0 and must be fixed before any new feature work resumes.

> **Origin:** RelatedVideosRow was stripped during the slug-routing refactor in Session 16 because the detail page was rewritten without inventorying its existing components. This policy exists to prevent that class of mistake permanently.

---

## 10. DOCUMENT NAMING CONVENTION

| Document type | Convention | Location |
|---------------|-----------|----------|
| Session notes | `SESSION_NOTES_YYYY_MM_DD_S[N].md` | `docs/sessions/` only |
| Audit reports | `AUDIT_CLEARANCE_REPORT_YYYY_MM_DD.md` | repo root |
| Registry | `registry.md` (lowercase, always) | repo root — ONE file only |
| Policy | `MASTER_POLICY.md` (uppercase) | repo root |
| Project log | `PROJECT_LOG.md` (uppercase) | repo root — ONE file only |

Dashes in filenames: **only for Aria's documents** (per standing instruction — use commas in Aria's written content, not dashes).

**Explicitly prohibited file names** (must never be created):
- `docs/Session_Log.md` — deleted 2026-09-20, superseded by `PROJECT_LOG.md`
- `docs/Bug_Registry.md` — deleted 2026-09-20, superseded by `registry.md`
- Any variant: `session-log.md`, `dev_log.md`, `bug-log.md`, `changelog.md`

---

## 12. CONTENT PIPELINE — Articles & Videos (Established S46, Refined S47 — 2026-10-13)

This is the semi-automatic workflow for populating MommyOffice with articles and videos.
Alex handles research, prompts, and formatting. Gemini handles all Mongolian writing.
Amaraa bridges the two — two separate Gemini pastes per piece (Article + ElevenLabs).

### Trigger command
> **`Alex, new content — [SECTION NAME]`**

Valid section names: `АМЖИЛТЫН ЭЗЭД` | `STARTUP WOMEN` | `MONEY TALK` | `MOM HACKS` | `ЭЭЖҮҮДИЙН ХОББИ` | `ШИНЭХЭН ЭЭЖҮҮД` | `ДОТНО ХАРИЛЦАА`

The section name is **required** in the trigger — it sets shortlist type, tone, and content focus.

---

### The 6-Step Pipeline

| Step | Who | What |
|------|-----|-------|
| 1 | **Amaraa** | Say: `Alex, new content — [SECTION NAME]` |
| 2 | **Alex** | Check mommyoffice.com for already-published content → web research → build shortlist of 10 Asian-first trending women with confirmed HD video sources → present to Amaraa |
| 3 | **Amaraa** | Say: "Choosing #X" |
| 4a | **Alex** | Build **Article Prompt** (English, ready to copy) → Amaraa pastes into Gemini → Gemini returns Mongolian HTML article → Amaraa shares output with Alex |
| 4b | **Alex** | Build **ElevenLabs Prompt** (English, separate prompt) → Amaraa pastes into Gemini → Gemini returns Mongolian voice script → Amaraa shares output with Alex |
| 5 | **Alex** | Format article HTML + admin fields. Present as admin-ready output. |
| 6 | **Amaraa** | Copy article HTML into MommyOffice admin → fill fields → Publish. Paste ElevenLabs script into ElevenLabs → generate audio. |

**WHY TWO SEPARATE PROMPTS:** When both article and ElevenLabs are in one prompt, Gemini only outputs one (usually the script). Splitting guarantees both outputs.

---

### Absolute content rules (enforced by Alex at Steps 2 and 4)

| Rule | Detail |
|------|--------|
| **Women only** | Every person featured MUST be a woman. No exceptions. If co-founded with a man, cover only the woman's story. |
| **Asian women preferred** | Prioritize: (1) East Asian (Chinese, Korean, Japanese, Taiwanese), (2) Southeast Asian (Vietnamese, Filipino, Thai, Indonesian, Malaysian), (3) South/Central Asian (Indian, Pakistani, Kazakh). Western women are secondary fill only. |
| **Last 2 years only** | Only suggest people/topics with confirmed media coverage or viral moment in the last 2 years. |
| **HD video required** | Only include people with confirmed HD on-camera footage from Bloomberg, CNBC, Forbes, BBC, CNN, TED, or similar. No video = not on shortlist. |
| **No generic clichés** | BANNED: "тэрбум долларын эзэнт гүрэн", vague round numbers. USE: specific real figures, real company names, real turning points. |
| **No invented content** | No fabricated quotes or fictional people. Every claim must trace to a real published source. |
| **Already published** | Before each shortlist, check mommyoffice.com and exclude already-covered people/topics. |
| **Gemini prompt in English** | ALL prompts to Gemini must be written in English. Gemini's OUTPUT must be in Mongolian only — no English anywhere in the output. |

---

### PROMPT 1 — ARTICLE (send to Gemini first)

**Target:** 1800–2000 Mongolian words — equivalent to a **9-minute read** (matches existing published MommyOffice article standard, e.g. the Jing Gao article).

**HTML tags allowed:** `<h2>`, `<p>`, `<strong>`, `<em>` only. No `<div>`, `<br>`, `<ul>`, `<li>`, `<html>`, `<head>`, `<body>`.

**Section structure (6 sections + opening hook + closing):**
1. Opening hook — 3 paragraphs, no heading. Build tension, name subject at the end.
2. `<h2>` Who is she? — 3–4 paragraphs: background, nationality, university, early career
3. `<h2>` The company she built — 3–4 paragraphs: what it does, clients, valuation, growth
4. `<h2>` The turning point — 3–4 paragraphs: the pivotal moment (fired, risk taken, breakthrough), specific real details
5. `<h2>` What she built next — 3–4 paragraphs: follow-on ventures, what she does now
6. `<h2>` What this means for Mongolian women — 2–3 paragraphs: direct message to Mongolian mothers
7. Closing — 2 paragraphs, no heading, ends with engagement question to reader

**Style rules:**
- `<strong>` for: key numbers, company names (first mention), pivotal moments
- `<em>` for: direct quotes and single emphasis words
- Narrative journalism tone — like a Mongolian elder sister telling a true story
- Each paragraph adds NEW information — no repetition
- Numbers: standard written form for article — `$26 тэрбум`, `22 насандаа`, `5%`, `2016 он`

**Admin fields output (outside HTML, labeled):**
```
title_mn:       (max 70 characters)
description_mn: (150–160 characters)
category:       [section name]
slug:           [person-name-company-name]
```

---

### PROMPT 2 — ELEVENLABS VIDEO SCRIPT (send to Gemini second, separately)

**Target:** 200–250 Mongolian words. Read aloud by AI voice. Natural speech rhythm.

**⚠️ CRITICAL NUMBER RULE — ALL numbers must be spelled out in Mongolian words:**
- $26 billion → `хорин зургаан тэрбум доллар`
- 22 years old → `хорин хоёр насандаа`
- 5% → `таван хувийн`
- 2016 → `хоёр мянга арван зургадугаар онд`
- Every year, percentage, dollar amount → spell it out fully. NO digits anywhere.

**STRUCTURE (9 steps, with blank lines between each section):**

1. **Hook** (1–2 sentences) — dramatic scroll-stopping fact. No brand name yet. Numbers spelled out.
2. `Mommyoffice үзүүлж байна.`
3. **Who is she?** (2–3 sentences) — name, what she built, spelled-out numbers.
4. **What made her special?** (1–2 sentences) — the key turning point.
5. **Why this matters to you** (1 sentence) — direct emotional connection to Mongolian viewer/mother.
6. `Түүний түүхээс бид юу сурч болох вэ?`
7. **5 lessons** — use this exact format for EACH lesson, with a blank line between every lesson:
   ```
   Нэгт, [short headline sentence — 8 words or less].
   [2 sentences explaining this lesson with a specific detail from the person's real story.]

   Хоёрт, [short headline sentence — 8 words or less].
   [2 sentences explaining with a specific real detail.]
   ... (same for Гуравт, Дөрөвт, Тавт)
   ```
   **Each lesson = headline + explanation. NOT a one-liner list.**
8. **Engagement question** (1–2 sentences) — UNIQUE per video, tied to THIS story's emotional theme. Easy YES/NO or one-phrase answer. Encourages Facebook comments. Do NOT promise to reply. Address viewer as `Та` or `Чи`. Numbers spelled out.
9. `Мэдээллийг Моммиоффис хүргэлээ.`

**Word split:** ~80–90 words intro (steps 1–5) · ~110–130 words lessons (steps 6–7) · ~15–20 words engagement · ~10 words outro

---

### Gemini account note
- Gemini free plan has a daily message limit. If limit is hit:
  - Use the MommyOffice Gemini account (`gemini.google.com/u/1`) for the article prompt
  - Use personal account for ElevenLabs prompt (or wait until reset)
  - Limit resets daily — article is longer, so run it on the account with more quota

---

### Master prompt location
Google Drive → GLink Strategic Projects → MommyOffice → `MommyOffice_Gemini_Master_Prompt_v3`
This is the reference template. Individual session prompts are built fresh per person chosen.
