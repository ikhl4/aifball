# 365Scores in chat

The match-report tag accepts a retrieved provider URL with a team/team/competition suffix and exact #id= event fragment. The UI and canonical response adapter validate this identity and keep it separate from ESPN and SofaScore. Generic 365 URLs cannot be reinterpreted using ESPN IDs or open an implicit date form.

`/api/advanced?source=365&action=analysis&matchUrl=...` calls Python's new `/365scores/match-analysis`. The adapter replaces model numbers with source prose before the visual. Reports show source comparisons, starters/substitutes, player statistics, source heatmap images and normalized shot positions. Absent values are unavailable. A substitute's presence is not evidence of playing time. No career totals or passing/tracking maps are invented.

`/api/provider-heatmap` proxies only the source-bound PNG response, verifies source/event/player headers, PNG signature and size, and keeps backend credentials server-side. Browser loads use exact match/player IDs. A source image is displayed as an image, not synthesized point data. Image errors are scoped to the selected player.

Deployment order: merge/deploy Python's 365 adapter to Render, verify it there, then merge/deploy this frontend change. The existing Python production API lacks the new analysis and player-heatmap routes until that first deployment. Source access, coverage and Dify retrieving a specific event link remain requirements. No paid API or new account is configured.

Validation: 64 frontend tests, targeted strict TypeScript, Next production build. Backend live-code verification on a single historical event returned 22 indicators, 31 shots and a real source PNG; this does not establish coverage across the user's competitions. Full browser integration must be verified after the backend deployment.
