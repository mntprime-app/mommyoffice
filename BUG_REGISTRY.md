# MommyOffice — Bug & System Failure Registry

> **Rule**: Before fixing ANY bug, search this file first.
> If the bug class is already here, apply the known fix directly — do not re-investigate.
> After fixing a new bug, add it here immediately.

---

## [BUG-001] Git HEAD.lock / index.lock blocks commits from sandbox

**Status**: Known limitation. Manual workaround required.
**First seen**: 2026-08-25
**Module**: Git / Windows filesystem

### Symptom
`git commit` or `git add` fails with "Unable to create '.git/HEAD.lock': File exists" or "Unable to create '.git/index.lock': File exists" when run from the Claude sandbox.

### Root cause
The sandbox mounts the Windows filesystem. Windows Git leaves lock files behind after crashes or interruptions. The sandbox cannot delete Windows mount lock files due to filesystem permission boundaries.

### Fix
Amaraa must run this manually in CMD before each commit sequence:
```cmd
del "F:\MNT\Workspace\GLink Strategic Projects\mommyoffice\.git\HEAD.lock"
del "F:\MNT\Workspace\GLink Strategic Projects\mommyoffice\.git\index.lock"
```

### Prevention
Always run `del` on both lock files before `git add / commit / push` if a previous session ended abruptly.

---

## [BUG-002] Secrets in SESSION_NOTES committed to git → GitHub Push Protection blocks push

**Status**: Resolved. Preventive rules added.
**First seen**: 2026-08-26
**Module**: Developer workflow / session documentation

### Symptom
`git push` rejected: "Push cannot contain secrets — Sendinblue API Key detected." Across 5 historical commits in SESSION_NOTES_2026_08_23.md and SESSION_NOTES_2026_08_24.md.

### Root cause
Raw Brevo API key was written into session notes files during sessions on Aug 23 and Aug 24. Files were git-tracked and committed.

### Fix applied
1. Rotated Brevo API key in app.brevo.com → SMTP & API → API Keys
2. Updated new key in Vercel env vars + `.env.local`
3. Redacted old key in session notes files
4. Added `SESSION_NOTES_*.md` to `.gitignore`, ran `git rm --cached`
5. GitHub unblock URL used to allow push after rotation
6. Committed + pushed + verified

### Prevention
**NEVER write raw credentials into session notes.** SESSION_NOTES_*.md is now permanently gitignored. Credentials belong ONLY in `.env.local` + Vercel env vars.

---

## [BUG-003] Vercel GitHub webhook breaks after GitHub Push Protection event

**Status**: Fixed. Known operational risk.
**First seen**: 2026-08-26
**Module**: Vercel GitHub integration

### Symptom
After GitHub Push Protection blocks a push, Vercel stops auto-deploying new commits. Production stays pinned to the last pre-incident commit. New pushes reach GitHub successfully but no Vercel build triggers.

### Root cause
GitHub Push Protection interference breaks the Vercel webhook registration.

### Fix
Vercel → mommyoffice → Settings → Git → Click "GitHub" → Connect next to the correct repo. Then trigger a deploy by pushing any commit (use `git commit --allow-empty`).

### Prevention
After any rejected push, verify Vercel is still auto-deploying. Check Deployments list — new commits should appear within 30s of a push.

---

## [BUG-004] TypeScript error: `Buffer<ArrayBuffer>` not assignable to `ArrayBuffer`

**Status**: Fixed.
**First seen**: 2026-08-25
**Module**: `src/app/api/stream/token/route.ts`

### Symptom
`npx tsc --noEmit` reports: "Argument of type 'Buffer<ArrayBuffer>' is not assignable to parameter of type 'ArrayBuffer'".

### Root cause
`Buffer.from(data)` in Node.js returns `Buffer<ArrayBuffer>`, which TypeScript's strict mode does not consider assignable to plain `ArrayBuffer`.

### Fix
Change function signature from `base64url(data: ArrayBuffer)` to `base64url(data: ArrayBuffer | Buffer)`.

### Prevention
When writing crypto helpers that accept binary data, always type the parameter as `ArrayBuffer | Buffer` to handle both Web Crypto API output and Node.js Buffer output.

---

## Template for new entries

```
## [BUG-NNN] Short title

**Status**: Active | Fixed | Known limitation
**First seen**: YYYY-MM-DD
**Module**: file path or component name

### Symptom
What the developer observes.

### Root cause
Why it happens.

### Fix
Exact code change or action taken.

### Prevention
How to avoid repeating this.
```
