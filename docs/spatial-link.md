# Spatial data link

Adds a separate SofaScore source panel to the match report rather than merging its identifiers or statistics with ESPN. Requires the backend analysis_routes.py update. A source URL resolves a provider match identity and source lineup; player heatmaps use a player ID from that lineup. Only ALL-period xG is shown. Missing coordinates and xG remain unavailable. Heat visualization is activity-point density, not continuous tracking; points are never joined into imaginary running paths. Shot locations are from playerCoordinates, without a central default.

Current live prerequisites: Render serves the new routes after backend deployment. FotMob is disabled and remains disabled. Existing SofaScore shotmap returned 502, so upstream availability is unverified. Failure remains visible in the panel. Career totals/season history/contracts are not connected by this bridge.

Tests: 49 Node tests and 4 backend unit tests, strict TypeScript check. No full upstream datasets are committed.
