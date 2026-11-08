# AiFBall UX improvement roadmap — experimental branch

## Scope approved
1. Reliable background search and recovery
2. Response speed and transparent progress
3. Player and match-report card redesign
4. Mobile navigation
5. Conversation history/search
6. Actionable errors and retry

## Implemented in this first commit
- Search conversation titles in the existing sidebar.
- More specific loading phases, without claiming verified data before it arrives.
- User-facing notice when durable background submission fails and the legacy stream is used.
- More actionable generic connection error text.

## Still pending (do not claim complete)
- Durable-job reliability: session hydration race, handling network loss, idempotent resume and preventing silent fallback for signed-in users.
- Preserve all Next.js chat enrichments in Render background path.
- Measure first-token latency and end-to-end response time.
- Player cards and match reports: separate component changes, mobile visual QA and verified-data behavior.
- Mobile navigation audit for iPhone Safari safe areas and keyboard.
- Retry button for failed prompts without duplicate submission, and robust multi-job conversation recovery.

## QA before merge
- Build/type-check in Vercel.
- Test signed-in and guest chats.
- Test switching to X/Snapchat and re-opening Safari.
- Verify player stats, live matches, summaries and media rendering.
- Check dark/light themes and narrow viewport.
- No production merge until explicit approval.
