# Detailed match report foundation

Replaces the legacy report endpoint that silently selected a fixed StatsBomb match and generated ratings, scores and percentages. Reports now require an exact ESPN event and competition; search requires a valid date and explicit user selection. Source namespaces are never interchangeable.

The Arabic report includes team comparisons, source-provided lineups with explicit starter status, events and selectable per-match player statistics. Home/away are bound through source IDs. Missing xG stays unavailable; no default shot positions, heatmaps, player ratings, possession or minutes are generated.

Data coverage: ESPN summary responses currently expose team passing/defensive statistics and a smaller set of player match statistics. The tested match does not supply xG or spatial event coordinates. Full heatmaps, passing maps, true tracking, career totals, contract and season-by-season player profiles are not implemented in this report. Those need separately verified provider contracts. The existing separate PlayerProfile remains a legacy component and is not used for these per-match player cards.

Chat requests for match analysis receive an explicit presentation instruction. If Dify cannot retrieve a verified ESPN identity, the widget opens the competition/date selector instead of choosing a match. Existing 365Scores report tags open that selector; this replacement does not claim cross-provider shotmap compatibility.

Preview /preview/match-report loads a real source match (748236, esp.1) and is disabled in Production. Tests use synthetic identities; no full external response is committed. Run node --test tests/*.cjs.
