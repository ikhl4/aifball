# Tactical analysis inside chat

Analysis answers use a fenced `aifball-analysis` JSON document, rendered as narrative sections with optional contextual pitches. This is separate from `aifball-tactics` / `aifball-training` and the training library.

- `lib/analysis-story.ts` validates documents and separates complete/incomplete blocks from surrounding prose.
- `lib/analysis-prompt.ts` supplies presentation instructions to Dify for analysis requests.
- `app/api/chat/route.ts` retains Dify conversation/files and forwards request cancellation.
- `AnalysisStory.tsx` renders explanation, pitch, then interpretation for each section.
- `AnalysisPitch.tsx` renders independently controlled frames without interpreting coordinates as actual tracking.

## Deployment

The Dify app key must be available as `DIFY_API_KEY` in the deployment environment. Production and Preview environment scopes are separate on Vercel. After changing a scope, redeploy. Never add the key to Git or a `NEXT_PUBLIC_` variable.

The first Preview request returned HTTP 500 because Dify was not configured. After enabling the Preview key scope, live chat successfully streamed an analysis response. That response used coordinate destinations for movement arrows, which are now explicitly validated alongside player-ID destinations. The existing Production Dify connection accepted the analysis instructions and returned the teaching example saved in `tests/fixtures/analysis-teaching.json`. That generic example validates and renders two independent pitches; it is not a factual analysis of a named coach or club.

`/preview/tactical-analysis` renders that example for visual review. It calls `notFound()` when `VERCEL_ENV=production`. This review page does not call Dify and is not linked into the normal chat flow.

## Accuracy and failure behavior

The presentation instructions require tool-backed sources for named coaches, teams and matches. The validator requires at least one HTTPS reference when mode is `sourced`, and checks shape, length, coordinate bounds, duplicate IDs, arrow endpoints and team sizes. It cannot determine whether a cited webpage proves an assertion; factual grounding still depends on the existing Dify tools and accuracy instructions. Diagrams are always labelled interpretive.

Raw JSON is hidden during streaming. Completed narrative fields and fully validated sections are shown progressively; unfinished strings or scenes are never repaired or guessed. An interrupted response retains its completed explanation and shows an interruption notice. Source-backed partial diagrams require completed references; otherwise only prose is retained. A complete document with invalid board data can retain bounded written explanation while omitting the pitch. Regular non-analysis answers retain their existing Markdown/widgets.

## Verification

Run `node --test tests/*.cjs` (39 tests). Production build: `npm run build` with the existing Clerk configuration. Tests include the actual generic teaching response, rendering order, source/scene rejection, streaming boundaries, follow-ups and request forwarding.

## Interrupted named-coach response

Reproducing the exact Enrique/Paris question returned 13,621 characters but disconnected after 68.2 seconds without a `message_end` event. The route had an explicit 60-second maximum. The route now requests 300 seconds and the client allows 240 seconds. Actual hosting limits still depend on the Vercel project configuration. Presentation instructions put sources before sections and request a focused 2–4 section answer. `lib/analysis-partial.ts` extracts only completed JSON fields/sections; the interrupted real response is a regression fixture. Silent EOF is reported as an interruption as well as network failures.

The post-timeout-fix Enrique response completed after 68 seconds but put `Marquinhos` in a player-number field. Short names/labels are now accepted up to 40 characters, with compact two-character pitch tokens and full labels in tooltips/role details. The actual response was checked locally and renders three independent pitches. A minimal synthetic regression test covers the name-label case without publishing that complete response. Bounds, endpoints, source requirements and team limits remain enforced.
