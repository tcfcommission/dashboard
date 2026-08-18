# TCF Command Centre

A private, production-oriented operating system for TCF: tasks, daily mission, businesses, transactions, revenue history, social metrics, goals, integrations and automation audit logs.

## What changed in v2

The original single-file dashboard is preserved in `legacy/`. It used a password stored in browser JavaScript and saved business data only in `localStorage`; the backend connector was never loaded by the page. Version 2 replaces that foundation with:

- Supabase Auth with no public registration UI
- owner-scoped Postgres tables and row-level security
- persistent create/update/delete flows
- protected Next.js server routes
- Stripe, YouTube, TikTok and Instagram provider adapters
- signed Stripe webhooks and a normalized custom-ingest webhook
- Vercel cron protection using `CRON_SECRET`
- PWA manifest, responsive desktop/mobile UI and service worker shell
- integration health, last error and sync-run audit trail
- no API keys, passwords or provider tokens stored in browser data

## Stack

- Next.js 16 App Router + TypeScript
- Supabase Auth/Postgres/RLS
- Vercel deployment and daily cron
- official provider APIs only

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Add only the Supabase project URL and publishable key locally.
3. Keep all server secrets in local environment variables and Vercel—never commit them.
4. Run the SQL migration in `supabase/migrations/`.
5. Create the owner in Supabase Authentication.
6. Install and start:

```bash
npm install
npm run dev
```

## Validation

```bash
npm run typecheck
npm test
npm run build
```

## Automation model

- Stripe: signed webhook for near-real-time payments/refunds plus scheduled reconciliation.
- YouTube: scheduled official API pull.
- TikTok: official OAuth token after TikTok developer approval.
- Instagram: professional account + Meta app/OAuth approval.
- Banks: connect through an approved Open Banking provider; bank credentials are never collected by this app.
- Anything else: post normalized events to `/api/webhooks/ingest` with a server-side bearer secret.

See [docs/INTEGRATIONS.md](docs/INTEGRATIONS.md) and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
