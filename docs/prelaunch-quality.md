# Player quality and chat recovery preview

Branch: `feat/prelaunch-quality`; base: production `dd458b37a217b29604316437aec8675906d89745`.

## Behavior

- A missed ESPN search gets at most one extra search using the English label of a uniquely resolved Wikidata entity. This is a search hint, never proof of identity.
- ESPN search/detail contradictions in athlete ID, name or known club ID yield `conflict` and a compact source-status card without statistics or photo. A league redirect also requires a matching known club.
- Cross-source media requires a matching exact name/alias; conflicting known birth dates reject the image. Missing birth dates still allow name-only matching; this does not prove every image identity independently.
- Successful profile responses expose the provider athlete ID and league for repeatable audits. Existing per-competition scopes and unknown-value handling remain intact.
- A lost/invalid job-start acknowledgement no longer automatically creates a second paid direct generation. Only an explicit pre-dispatch configuration-unavailable response permits direct fallback.
- Existing background jobs can resume GET polling on page restoration, reconnect and foreground events. Active polling is guarded against overlap. This does not create a new job and depends on configured authenticated backend access.
- A direct SSE connection silent for 90 seconds is cancelled while preserving received text. Incoming heartbeat bytes reset the timer. No automatic paid retry is introduced.

## Verification (2026-11-28)

- 57 targeted tests pass, including identity conflicts, photo identity/date mismatch, canonical-name recovery, compact conflict rendering, uncertain-start handling, UTF-8 SSE and a silent-stream timeout.
- Broad `.cjs` suite: 160/168 pass. The same eight failures occur at the unmodified production base (153/161 pass): analysis route forwarding; live-match date filtering; two highlight-publisher checks; recap rendering; two summary-prompt checks; training-library count. These failures require separate triage; they are not evidence of a launch-ready full suite.
- TypeScript: 134 errors at baseline and preview; zero new unique diagnostics after normalizing line numbers. Build settings currently bypass type failures.
- `git diff --check` passes.

- Live preview audit initially caught valid cup-to-domestic league redirects being rejected. Corrected the guard: accept only the same exact player ID, name and known club; retain each statistics row’s own validated competition scope. Added the observed Bergvall redirect as a regression test. Full-name Arabic search hints added for Bergvall and Alvarez; no provider IDs or facts are hardcoded.

## Repeatable coverage check

`node scripts/check-prelaunch.cjs --base https://PREVIEW --out /tmp/aifball-audit.json`

Runs 21 public profile GETs with concurrency 2, comparing Arabic/English pairs and validating stable provider identity, season/competition scope, nullable counts, duplicate scopes and photo attribution fields. It reports coverage separately from contract violations. It sends no paid chat requests. A structural pass does not verify biography prose, every source statistic or actual image content.

## Required manual checks, not yet executed

| Check | Practical procedure | Expected result |
| --- | --- | --- |
| Real iPhone Safari | Send a signed-in query, background Safari, restore it; repeat after reload | Same job resumes, one answer, no duplicate paid generation |
| Network interruption | Disconnect during authenticated job polling, then reconnect | Existing job ID is polled; partial text remains; no new POST |
| Account separation | Attempt another account's saved job ID | Access denied; no answer or ownership information disclosed |
| Ambiguous player | Ask bare Javi Guerra, then qualify Valencia | Clarification first; provider disagreement is disclosed without fabricated stats |
| Source facts | Independently compare a sample of player rows, biography claims and photo identities against source pages | Exact identity, date and competition scope; missing data stays unknown |

No production merge is included in this work.

## Deployed preview audit

Code commit: `ad19a31a3148b2ce4df84cf1f89008ee2028f13a`; deployment: `dpl_6ruUaiXajhK2V4zMdBMdgNC7a1YF`, READY.
Preview: https://aifball-3ugmwk8pc-ai-fball.vercel.app

2026-11-28 05:22 Riyadh: 21 public profile requests, 16 found with per-competition statistics (eight Arabic/English player pairs sharing the same provider ID), zero structural quality violations. Bergvall has an attributed photo in both spellings. Other images were omitted when verification/availability was insufficient.

Remaining coverage gaps: Arabic Mohammed Noor ambiguous, English Mohammed Noor absent, bare Javi Guerra ambiguous in both languages, Valencia-qualified Javi Guerra absent. These are five request results, not five distinct players. No rows or photos leaked for these results. The audit does not independently verify all biography prose or every numeric source fact. See `prelaunch-profile-audit-2026-11-28.json`.

Live chat smoke checks on the tested preview: bare Javi Guerra returned one clarification without a player tag; greeting completed with the fixed Arabic greeting (both HTTP 200, approximately 8.6 seconds in this sample). An unauthenticated job GET returned HTTP 503 `auth_unavailable`, so authenticated durable recovery is not operationally verified on this preview. No account-isolation claim is made.

Environment metadata (values not read): `CLERK_SECRET_KEY`, `CHAT_JOBS_TOKEN` and `AIFBALL_RENDER_API_URL` target production only. The public Clerk key targets production and preview. This explains why the private preview job endpoints are disabled. Production credentials were not copied into preview; a test auth/backend configuration is needed for the remaining live checks.
