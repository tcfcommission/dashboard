# Integration architecture

## Non-negotiable security rule

The dashboard never accepts or stores raw API keys, access tokens, banking credentials or passwords. The browser saves only safe identifiers and names such as `TCF_STRIPE_SECRET_KEY`. The real values live in Vercel server environment variables.

## Supported paths

### Stripe

- Secret reference: `TCF_STRIPE_SECRET_KEY`
- Webhook signing secret: `TCF_STRIPE_WEBHOOK_SECRET`
- Optional TCF business UUID: `TCF_STRIPE_BUSINESS_ID`
- Webhook URL: `https://YOUR_DOMAIN/api/webhooks/stripe`
- Events: `payment_intent.succeeded`, `charge.refunded`
- Scheduled sync reconciles the most recent 90 days of balance activity.

### YouTube

- Secret reference: `TCF_YOUTUBE_API_KEY`
- Safe configuration: YouTube Channel ID and handle
- No scraping. The adapter calls YouTube Data API v3.

### TikTok

- Secret reference: `TCF_TIKTOK_ACCESS_TOKEN`
- Requires an approved TikTok developer app, Login Kit/Display API scopes and OAuth consent.
- Public-profile scraping is deliberately not implemented.

### Instagram

- Secret reference: `TCF_INSTAGRAM_ACCESS_TOKEN`
- Requires a professional account connected to a Facebook Page, a Meta app and approved permissions.
- Safe configuration: Instagram professional account ID.

### Banks / Open Banking

There is no safe universal “bank API key.” Choose an FCA-regulated Open Banking provider and complete its onboarding and consent flow. Add its adapter after the provider and required scopes are known. Never store online-banking credentials in TCF OS.

### Custom APIs, n8n and Make

Use the normalized ingest endpoint:

```http
POST /api/webhooks/ingest
Authorization: Bearer <TCF_INGEST_SECRET>
Content-Type: application/json
```

Transaction event:

```json
{
  "type": "transaction",
  "data": {
    "provider": "custom",
    "externalId": "stable-provider-id",
    "description": "Paid invoice",
    "transactionType": "income",
    "grossAmount": 250,
    "feeAmount": 4.5,
    "netAmount": 245.5,
    "currency": "GBP",
    "occurredAt": "2026-08-17T12:00:00Z"
  }
}
```

Social metric event:

```json
{
  "type": "social_metric",
  "data": {
    "platform": "other",
    "handle": "@tcf",
    "followers": 1000,
    "views": 12000,
    "growth": 4.2
  }
}
```

## Adding a new provider adapter

1. Add a provider-specific function in `lib/integrations/sync.ts`.
2. Use only official APIs and documented OAuth scopes.
3. Read secrets from an allow-listed `TCF_*` environment-variable reference.
4. Normalize data into `transactions`, `socials` or `daily_metrics`.
5. Return a non-sensitive summary for the audit log.
6. Add a test proving the endpoint is authenticated and does not expose credentials.
