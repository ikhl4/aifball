# Player quality and chat recovery preview

Branch: `feat/prelaunch-quality`; base: production `dd458b37a217b29604316437aec8675906d89745`.

## Behavior

- A missed ESPN search gets at most one extra search using the English label of a uniquely resolved Wikidata entity. This is a search hint, never proof of identity.
- ESPN search/detail contradictions in athlete ID, name, league or known club ID yield `conflict` and a compact source-status card without statistics or photo.
- Cross-source media requires a matching exact name/alias; conflicting known birth dates reject the image. Missing birth dates still allow name-only matching; this does not prove every image identity independently.
- Successful profile responses expose the provider athlete ID and league for repeatable audits. Existing per-competition scopes and unknown-value handling remain intact.
- A lost/invalid job-start acknowledgement no longer automatically creates a second paid direct generation. Only an explicit pre-dispatch configuration-unavailable response permits direct fallback.
- Existing background jobs can resume GET polling on page restoration, reconnect and foreground events. Active polling is guarded against overlap. This does not create a new job and depends on configured authenticated backend access.
- A direct SSE connection silent for 90 seconds is cancelled while preserving received text. Incoming heartbeat bytes reset the timer. No automatic paid retry is introduced.

## Verification (2026-11-28)

- 56 targeted tests pass, including identity conflicts, photo identity/date mismatch, canonical-name recovery, compact conflict rendering, uncertain-start handling, UTF-8 SSE and a silent-stream timeout.
- Broad `.cjs` suite: 159/167 pass. The same eight failures occur at the unmodified production base (153/161 pass): analysis route forwarding; live-match date filtering; two highlight-publisher checks; recap rendering; two summary-prompt checks; training-library count. These failures require separate triage; they are not evidence of a launch-ready full suite.
- TypeScript: 134 errors at baseline and preview; zero new unique diagnostics after normalizing line numbers. Build settings currently bypass type failures.
- `git diff --check` passes.

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
