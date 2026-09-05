# MommyOffice — Master Policy
**Director of Software Development: Alex (AI)**
**Owner: Amaraa**
**Last updated: 2026-09-05**

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

## 3. GIT COMMIT STANDARDS

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

## 4. SECURITY RULES — NON-NEGOTIABLE

| Rule | Detail |
|------|--------|
| `.env.local` | **NEVER** commit, push, or share. Local only + Vercel env vars. |
| `LOCAL_PASSWORDS_DO_NOT_COMMIT.md` | READ ONLY. Never commit, push, or share. |
| API keys | Local `.env.local` AND Vercel env vars only. Never hardcode in source. |
| `MC_ENCRYPTION_KEY` | **NEVER** regenerate once QPay credentials are saved to `mo_business_settings`. |
| Student count | **NEVER** shown anywhere on MO — no exceptions, no UI, no logs. |
| GLink boost budget | **$3 USD daily MAXIMUM** — no exceptions. |

---

## 5. MOBILE LAYOUT STANDARD (BUG-048)

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

## 10. DOCUMENT NAMING CONVENTION

| Document type | Convention |
|---------------|-----------|
| Session notes | `SESSION_NOTES_YYYY_MM_DD.md` |
| Audit reports | `AUDIT_CLEARANCE_REPORT_YYYY_MM_DD.md` |
| Registry | `registry.md` (lowercase, always) |
| Policy | `MASTER_POLICY.md` (uppercase) |
| Project log | `PROJECT_LOG.md` (uppercase) |

Dashes in filenames: **only for Aria's documents** (per standing instruction — use commas in Aria's written content, not dashes).
