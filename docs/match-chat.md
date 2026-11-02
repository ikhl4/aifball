# Chat-first match reports

Match questions without a date instruct Dify to retrieve and verify the latest already-started encounter, comparing event timestamps and stating competition, date and state. Explicit user dates/competitions take precedence. This is an assistant retrieval policy, not an independent fixture discovery engine: successful latest-event selection still depends on configured Dify search/data tools. Missing identity leaves a sourced prose answer, not an automatic date form.

The response explains sourced numbers in Arabic before an embedded report. Existing ESPN event/league tags remain supported. A retrieved HTTPS SofaScore URL with its provider event fragment now loads Python analysis automatically; provider identifiers remain separate. `player_name` selects an exact unique name from that match roster only, including accent normalization. Unknown/ambiguous names never pick the first player. Conversation follow-ups receive the same reporting policy without converting unrelated questions into reports.

Both report renderers include deterministic prose from source metrics before visual comparisons. Zero stays zero; unavailable remains unavailable. The existing date selector is optional and collapsed. Source point density is never advertised as GPS paths.

Validation: 54 existing and new Node tests; targeted strict TypeScript and production build. Render OpenAPI exposes the SofaScore analysis and player-point routes. An analysis request returned HTTP 502 during verification; deployment presence does not guarantee upstream data availability. Clipboard/audio are outside this change. Full player career and autonomous multi-provider event matching are outside this change.
