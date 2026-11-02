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

Partial structured data is hidden during streaming. An incomplete final document displays an error. A complete document with invalid board data can retain bounded written explanation while omitting the pitch. Regular non-analysis answers retain their existing Markdown/widgets.

## Verification

Run `node --test tests/*.cjs` (36 tests). Production build: `npm run build` with the existing Clerk configuration. Tests include the actual generic teaching response, rendering order, source/scene rejection, streaming boundaries, follow-ups and request forwarding.
