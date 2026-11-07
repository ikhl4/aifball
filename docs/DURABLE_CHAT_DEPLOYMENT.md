# Durable chat jobs — experimental deployment

This feature requires **both repositories** and external infrastructure. Do not merge or enable without a preview test.

## Render service (ikhl4/aifball-python-api)
Set `DATABASE_URL` to a persistent PostgreSQL database connection string, `CHAT_JOBS_TOKEN` to a strong random secret, and `DIFY_API_KEY` to the existing Dify chat application key. Install updated requirements. Run **one Render web worker instance** only for this prototype. The service exposes internal authenticated POST /internal/chat-jobs and GET /internal/chat-jobs/{id}?owner=...; never expose the shared secret to browsers. Persistent Postgres is required: an in-memory or ephemeral disk database will not recover jobs.

## Vercel (ikhl4/aifball)
Set `AIFBALL_RENDER_API_URL` to the Render HTTPS base URL, and `CHAT_JOBS_TOKEN` to the exact same secret. The Next.js routes authenticate with Clerk and scope reads to the signed-in user. Only signed-in **text-only** chats try durable mode; otherwise the existing streaming route remains. If Render is unavailable or not configured, the client falls back to the existing chat path.

## Important functional differences and limitations
- Render currently sends the query directly to Dify; existing Next.js /api/chat enhancements (match highlights, special prompt additions, image uploads, postprocessing) do **not** run for durable requests. This must be reconciled before enabling the feature broadly.
- Dify may perform the same job twice if Render is restarted mid-run; the database recovers interrupted jobs but the upstream Dify API has no confirmed idempotency support.
- A single active job is persisted per browser. Concurrent tabs and concurrent requests need a multi-job recovery model.
- Job polling has no maximum retention/TTL yet. Implement cleanup, quotas, cancellation and rate limits before production.
- If iOS suspends Safari before the job ID is received, the browser cannot yet recover that job automatically; implement client-idempotency-key lookup.
- Do not claim guaranteed background execution until the full end-to-end acceptance tests pass.

## Acceptance tests
1. Signed-in user submits a text question; job appears queued/running/completed and returns an answer.
2. Switch to X or Snapchat for 2 minutes; return to same tab and recover final answer.
3. Force-close Safari and reopen; last active job is resumed without re-submitting.
4. Render restarts mid-job; job is retried with clear duplicate-run policy.
5. Test unauthenticated requests, cross-user job access, missing configuration, slow Dify, and multiple tabs.
6. Verify ordinary football prompts retain their existing presentation and data-source behavior.

No secrets should be committed to GitHub.
