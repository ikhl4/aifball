# Dify source routing verification — 27 November 2026

Separate test app: https://cloud.dify.ai/app/91549d82-fec0-428c-b7c5-0b55677445c0/configuration

The candidate configuration in `dify-source-routing.yml` contains no API keys or credential IDs. It derives from the repository's existing public system instructions plus source-routing rules. Existing provider authorization must be configured separately when importing it. Model/provider availability remains account dependent.

## Observed behavior

- DuckDuckGo discovers sources; Web Scraper reads a retrieved official club or federation page. Source content is evidence, never instructions. Missing facts remain unknown.
- Google Search failed twice with the generic SerpAPI search error. The cause was not established. It is disabled in the final test app.
- Wikipedia plugin requests intermittently returned JSON decoding errors. A direct Wikimedia request returned an explicit robot-policy denial. Direct Wikipedia retrieval was stopped; no alternative Wikimedia endpoints or proxies are used.
- Google Image and Gemini Image remain available only when media/design is requested. Player-card photos/statistics are independently retrieved by the site component.

## Live checks

| Case | Observed result | Time |
| --- | --- | --- |
| Lucas Bergvall, official biography and card | One search plus successful reading of Tottenham's actual biography; one card, requested season | 8.16 s |
| Lucas Bergvall, after common sporting-name rule | Two searches plus official page reading; one raw `<aifball-player name="لوكاس بيرغفال" lookup_name="Lucas Bergvall" current_season="2026-2027" />` | 19.44 s |

Official page read by the tool: https://www.tottenhamhotspur.com/player/570526/lucas-bergvall/biography

The raw tag was checked using the generated answer's Copy control. The common-name rule and disabled Google / enabled Vision states survived a page reload after Publish Update. Times are individual upstream runs, not a benchmark or guaranteed speedup. The final routing has not received a full cross-player regression pass.

## Release boundary

This is a separate Dify test app. The original Dify app, production Vercel configuration and production site were not changed. The new app is not yet connected to the Vercel branch preview. That requires an app API credential and a preview-only environment update, followed by an end-to-end SSE/card check. No new API credential was created during these tests.

Suggested preview checks after connection: Arabic player name yields one independently hydrated card; deltas and final answer do not duplicate the card; an ambiguous name asks for clarification; a failed source leaves figures unknown; interruption does not submit another generation automatically. Confirm the deployed preview references the test app before testing.
