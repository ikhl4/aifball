# Football news from X — initial integration

## Curated sources
The editable allowlist is in `lib/football-news-sources.ts`: `1smi_`, `rengo_sport`, `trendepl`, `FabrizioRomano`, `DeadlineDayLive`. Add a source to this array or set `enabled: false` to remove it from the feed. Sources are discovery leads, **not** official confirmations.

## API
`GET /api/football-news` lists recent verified X posts from the allowlist.
`GET /api/football-news?category=transfers` filters transfer sources.
`GET /api/football-news?category=general` filters general sources.

Set `X_BEARER_TOKEN` as a **server-side secret** in the hosting environment. Never prefix with `NEXT_PUBLIC_`, log it, or commit it. Without the token the endpoint returns `status: not_configured` and `posts: []`, not invented posts. X API plan/credit limits may apply. Responses distinguish upstream errors from an empty feed.

The endpoint returns original X post URLs, dates, text and media URLs when the X API supplies them. Each item is marked `unverified_report` until corroborated with a club/league announcement. It does not automatically label deals official or implement a scheduler or UI. Avoid presenting old search-index snippets as today's news.

## Manual verification before merge
1. Check TypeScript/build in an available local or CI environment.
2. With no X token, verify the endpoint returns `not_configured` and no fake posts.
3. With valid credentials, verify author allowlisting, date sorting, image presence where available, and upstream failures.
4. Verify the X account identities and source suitability before treating any account as trusted.
5. Only after successful testing should the feed be integrated into the news UI.
