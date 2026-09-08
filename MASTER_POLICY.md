# MommyOffice — Master Policy
**Director of Software Development: Alex (AI)**
**Owner: Amaraa**
**Last updated: 2026-09-05**

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
1. Write `SESSION_NOTES_YYYY_MM_DD.md` to `docs/sessions/` (completed work + commit hashes + pending items)
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

### Project root — allowed files only
| File | Purpose |
|------|---------|
| `MASTER_POLICY.md` | This document |
| `PROJECT_LOG.md` | Running session log (all sessions, all commits) |
| `registry.md` | Canonical registry: bugs, layout standards, UX rules, CSS classes |
| `UPGRADE_PLAN.md` | Planned future upgrades |
| `AUDIT_CLEARANCE_REPORT_*.md` | Pre-launch audit reports |
| `supabase_schema.sql` | DB schema snapshot |
| Config files | `next.config.ts`, `package.json`, `tsconfig.json`, `vercel.json`, `postcss.config.mjs` |

**No stray session notes at root.** All session notes go to `docs/sessions/`.

### docs/ folder structure
```
docs/
├── sessions/           ← ALL session notes (SESSION_NOTES_YYYY_MM_DD.md)
├── MommyOffice_Gemini_Video_Prompt_v2.docx
└── for elevenlab.docx
```

### Session note naming convention
```
SESSION_NOTES_YYYY_MM_DD.md          ← single session per day
SESSION_NOTES_YYYY_MM_DD_b.md        ← second session same day (suffix: b, c...)
```
Separator: **underscore only** (no dashes). Example: `SESSION_NOTES_2026_09_05.md`

---

## 2. THE REGISTRY — One Canonical File

**File:** `registry.md`

This is the **single source of truth** for:
- Bug registry (BUG-001 through BUG-NNN)
- Layout & grid standards
- Mobile UX standards
- Admin CMS standards
- CSS class definitions
- Component API contracts

**Rule:** Before fixing ANY bug, search `registry.md` first. If already documented, apply the known fix. After fixing a new bug, add it to `registry.md` immediately.

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
- [ ] Checkout page `/checkout/[slug]` complete
- [ ] Cart page `/cart` complete
- [ ] QPay integration tested end-to-end
- [ ] Domain `mommyoffice.com` connected in Vercel
- [ ] `NEXT_PUBLIC_SITE_URL=https://mommyoffice.com` set in Vercel env vars
- [ ] All 5 pending videos entered in admin CMS
- [ ] Supabase `media` bucket permissions verified (public read)
- [ ] `/admin/courses/[id]/edit` upgraded with CoverImagePicker
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

| Document type | Convention |
|---------------|-----------|
| Session notes | `SESSION_NOTES_YYYY_MM_DD.md` |
| Audit reports | `AUDIT_CLEARANCE_REPORT_YYYY_MM_DD.md` |
| Registry | `registry.md` (lowercase, always) |
| Policy | `MASTER_POLICY.md` (uppercase) |
| Project log | `PROJECT_LOG.md` (uppercase) |

Dashes in filenames: **only for Aria's documents** (per standing instruction — use commas in Aria's written content, not dashes).
