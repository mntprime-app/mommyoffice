# MommyOffice — Session Notes 2026-09-06 · Session 16
**Alex (AI Director) × Amaraa**

---

## COMPLETED THIS SESSION

### Tasks 23–26 · Card Component Standardization — External Text Container Structure

**Problem:** Video cards and home row cards were rendering category badges (`АМЖИЛТЫН ЭЗЭД`, etc.) as large overlays directly on top of subject face photos. This blocked faces, looked unorganized, and violated the platform's clean visual standard. The Article section had the correct baseline: pure image on top, all metadata in a dark external text box below.

**Directive:** Standardize ALL card components across `/mn`, `/videos`, `/articles`, `/courses` to use the exact same External Text Container Structure as the article section.

**Architecture: External Text Container Structure (platform standard from this session)**

```
┌──────────────────────┐
│   16:9 pure image    │  ← objectFit: cover, zero overlaid text or badges
├──────────────────────┤
│ category  ·  meta    │  ← dark box, #1a1a1a bg, borderTop: 1px solid #1f1f1f
│ Title (2-line clamp) │
└──────────────────────┘
```

**Files changed:**
- `src/app/[locale]/videos/VideosClient.tsx` — VideoCard: removed overlaid category badge from image; added external text box with teal category text + duration + match label. Free/paid pill retained on image top-right (later removed in S17).
- `src/app/[locale]/page.tsx` — Home courses, articles, and videos rows all rebuilt with External Text Container Structure.
- `src/app/[locale]/articles/page.tsx` — `ArticleScrollCard` + `EditorialPickCard`: removed overlaid category badges; added external text box matching article list baseline.

**Commits:**
| Hash | Description |
|------|-------------|
| `f58c3e2` | UX: VideoCard external text box — category below image |
| `5aead03` | UX: home course row external text box |
| `9499250` | UX: home article row external text box |
| `67117f9` | UX: ArticleScrollCard + EditorialPickCard — external text box |
| `9c6bb46` | UX: home video row external text box |
| `ab5690f` | UX: final card pass — all sections External Text Container Structure |

**Vercel deploy note:** `ab5690f` did not trigger webhook automatically. Fix: `git commit --allow-empty -m "trigger: force Vercel redeploy"` — worked.

---

## CARRY-FORWARD TO S17

- 🔴 Free/paid (`ҮНЭГҮЙ`/`ГИШҮҮН`) pill still on image top-right in VideoCard and RelatedVideosRow — user screenshots confirmed this still blocks faces
- 🔴 Category pill styling inconsistent: plain teal text in text box, not unified pill shape
- 🔴 Task #27: full badge removal from images + unified pill standard platform-wide

---

## SECURITY CONSTRAINTS (carry-forward, non-negotiable)
- Student count: NEVER shown anywhere on MO
- .env.local: NEVER commit / push / share
- LOCAL_PASSWORDS_DO_NOT_COMMIT.md: READ ONLY
- API keys: local .env.local + Vercel env vars only, never hardcoded
- GLink boost budget: $3 USD daily maximum
- MC_ENCRYPTION_KEY: NEVER regenerate once QPay credentials saved
