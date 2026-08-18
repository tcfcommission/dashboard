# Production deployment checklist

## 1. Supabase

1. Run `supabase/migrations/20260817230000_production_foundation.sql` in the TCF project.
2. Create the single owner account in Authentication → Users.
3. Keep email sign-up disabled unless a controlled invitation is being completed.
4. Copy the project URL and publishable key. Do not expose the service-role key.
5. Record the owner user UUID for `TCF_OWNER_USER_ID`.

## 2. Vercel environment variables

Configure Production, Preview and Development separately:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`
- `TCF_OWNER_USER_ID`
- `TCF_INGEST_SECRET`

Add provider variables only when each provider is connected. Use `.env.example` as the name list.

## 3. Supabase Auth URLs

- Site URL: the final production domain
- Redirect URL: `https://YOUR_DOMAIN/auth/callback`
- Add Vercel preview redirect URLs only if preview authentication is required.

## 4. Deploy and verify

1. Deploy the feature branch to Vercel Preview.
2. Confirm unauthenticated `/dashboard` redirects to `/login`.
3. Sign in as the owner and exercise every create/update/delete flow.
4. Verify another user cannot read the owner’s records.
5. Test an integration with test credentials first.
6. Confirm `/api/cron/sync` returns 401 without the correct bearer secret.
7. Configure Stripe webhook against Preview/test mode, then Production/live mode.
8. Promote only after build, tests and responsive checks pass.

## 5. Recovery

- Supabase is the system of record; browser storage is not.
- Keep all SQL changes as migrations in GitHub.
- Export critical data periodically or enable the Supabase backup option appropriate to the account plan.
- Rotate any key immediately if it is ever pasted into chat, committed to GitHub or exposed in browser code.
