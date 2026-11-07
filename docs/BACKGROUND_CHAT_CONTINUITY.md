# Background chat continuity — implementation plan

## Current experimental improvement
The web client now persists the submitted question immediately and saves received response tokens when the page is hidden or unloaded. This reduces lost chat content when an iPhone switches to X or Snapchat.

## Important limitation
This is **not** guaranteed background execution. iOS may suspend or terminate Safari, ending its fetch/SSE stream. Vercel functions cannot be treated as durable workers, and localStorage does not synchronize across devices. Do not describe the feature as complete until a server-side durable job store and worker are installed.

## Required production design
1. Authenticated POST /api/chat/jobs with a unique idempotency key and conversation ID; persist job as queued in a durable database before responding with job ID.
2. Background worker runs Dify independently of the browser connection and saves partial answer, Dify conversation ID, status and final response; worker has retry and timeout policy. Never expose DIFY_API_KEY to client.
3. GET /api/chat/jobs/:id (authenticated and owner-scoped) returns pending/running/completed/failed, cursor, partial response and final answer.
4. Client persists job ID and chat session ID; on visibilitychange/pageshow/reload polls for job status and resumes rendering without resending the original question.
5. Protect duplicate submissions via idempotency key, clean up stale jobs, redact logs, set TTL and storage quotas, and define cancellation explicitly.
6. Test Safari backgrounding for 30 seconds/2 minutes, force-killing Safari, reopening site, network loss, and multiple tabs. Validate Dify rate limits and deployment runtime.
7. Choose a durable backend (e.g. existing Render service plus a database/queue) and configure secrets and authorization before enabling.

## Acceptance
- User submits a question, switches to X/Snapchat, returns and sees either live progress or completed answer.
- If iOS terminates the page, reopening recovers the job without repeating the query.
- No cross-user data leakage; no duplicate Dify invocations.
- A clear recoverable error appears if the background job genuinely fails.
