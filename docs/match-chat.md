# Chat-first match reports

Match questions without a date instruct Dify to retrieve and verify the latest already-started encounter, comparing event timestamps and stating competition, date and state. Explicit user dates/competitions take precedence. This is an assistant retrieval policy, not an independent fixture discovery engine: successful latest-event selection still depends on configured Dify search/data tools. Missing identity leaves a sourced prose answer, not an automatic date form.

The response explains sourced numbers in Arabic before an embedded report. Existing ESPN event/league tags remain supported. A retrieved HTTPS SofaScore URL with its provider event fragment now loads Python analysis automatically; provider identifiers remain separate. `player_name` selects an exact unique name from that match roster only, including accent normalization. Unknown/ambiguous names never pick the first player. Conversation follow-ups receive the same reporting policy without converting unrelated questions into reports.

Both report renderers include deterministic prose from source metrics before visual comparisons. Zero stays zero; unavailable remains unavailable. The existing date selector is optional and collapsed. Source point density is never advertised as GPS paths.

Validation: 58 existing and new Node tests; targeted strict TypeScript and production build. Render OpenAPI exposes the SofaScore analysis and player-point routes. An analysis request returned HTTP 502 during verification; deployment presence does not guarantee upstream data availability. Clipboard/audio are outside this change. Full player career and autonomous multi-provider event matching are outside this change.

## Verified response stream

For match requests and follow-ups carrying a prior report context, answer deltas are held until Dify finishes. If a supported report tag is present, the server fetches that exact provider event and replaces free-form model statistics with canonical Arabic prose and the verified report tag. Conversation/message identifiers and message_end order are preserved. Failed or future events and ISO date mismatches emit no report. An unknown player never inherits model claims of participation. Responses without supported report tags retain their existing prose flow after completion; they are not independently verified by this adapter. This adds a source fetch and delays first answer text for these requests.

Live QA before grounding found an incorrect model card total and an unconfirmed player participation claim; neither is accepted as verified behavior. The server adapter and tests were added in response.
