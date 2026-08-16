# SHADOW OS — Backend Deploy Guide

This turns your dashboard from "type numbers manually" into "numbers pull in automatically."

**Honest order of difficulty — do them in this order:**
1. ✅ **Supabase** (the database) — 10 minutes, no approval
2. ✅ **Stripe** (real revenue automation) — 20 minutes, no approval, *actually works*
3. ⚠️ **YouTube** — 20 minutes, free API key, no approval
4. 🛑 **TikTok / Instagram** — days-to-weeks, needs platform approval (see API_APPROVAL.md)

You can stop after any step. Everything you haven't set up just stays manual.

---

## STEP 1 — Supabase (your database)

1. Go to **supabase.com** → sign up (free) → **New Project**.
2. Name it `shadow-os`. Pick a password, save it somewhere.
3. Wait ~2 min for it to build.
4. Left menu → **SQL Editor** → **New Query**.
5. Open `supabase/schema.sql`, copy **everything**, paste, hit **Run**.
   - You should see "Success." Your tables now exist.
6. Left menu → **Project Settings → API**. Copy two things:
   - **Project URL** (`https://xxxx.supabase.co`) → this is `SUPABASE_URL`
   - **service_role** key (under "Project API keys", click reveal) → this is `SUPABASE_SERVICE_ROLE`
   - ⚠️ The service_role key is **secret**. Never put it in the dashboard HTML or GitHub. It only goes in Vercel env vars (next step).

---

## STEP 2 — Deploy the backend to Vercel

1. Put this whole `backend` folder in a GitHub repo (or drag-drop deploy).
2. Go to **vercel.com** → sign up → **Add New → Project** → import the repo.
3. Before deploying, open **Environment Variables** and add:

   | Name | Value |
   |------|-------|
   | `SUPABASE_URL` | your project URL |
   | `SUPABASE_SERVICE_ROLE` | your service_role key |
   | `DASHBOARD_TOKEN` | make up a long random string (e.g. mash 40 characters) |

4. Click **Deploy**. When done, you get a URL like `https://shadow-os-backend.vercel.app`.
5. Test it: visit `https://your-url.vercel.app/api/get-dashboard` — you'll get `unauthorized` (that's correct — it's protected). Good.

Your database + read endpoint are now live. The dashboard can already connect (Step 5).

---

## STEP 3 — Stripe (the one that really auto-works)

1. **dashboard.stripe.com** → Developers → API keys.
2. Copy your **Secret key** (`sk_live_...` for real money, or `sk_test_...` to try it first).
3. In Vercel → your project → Settings → Environment Variables, add:

   | Name | Value |
   |------|-------|
   | `STRIPE_SECRET_KEY` | your sk_live_ or sk_test_ key |
   | `STRIPE_BUSINESS_ID` | `shadow_global` (the business row it updates) |

4. **Redeploy** (Vercel → Deployments → ⋯ → Redeploy) so it picks up the new vars.
5. Test: visit `https://your-url.vercel.app/api/stripe-sync`.
   - You'll see your real revenue + sales count come back as JSON, and it writes to Supabase.
   - ✅ **This is genuine automation.** From now on your Stripe revenue updates itself.

---

## STEP 4 — YouTube (free key, no approval)

1. **console.cloud.google.com** → New Project.
2. **APIs & Services → Library** → search "YouTube Data API v3" → **Enable**.
3. **Credentials → Create Credentials → API Key** → copy it.
4. Find your channel ID: youtube.com → your channel → Settings → Advanced (starts `UC...`).
5. Vercel env vars:

   | Name | Value |
   |------|-------|
   | `YOUTUBE_API_KEY` | your key |
   | `YOUTUBE_CHANNEL_ID` | your UC... id |
   | `YOUTUBE_SOCIAL_ID` | `youtube_shadowglobal` |

6. Redeploy → test `https://your-url.vercel.app/api/youtube-sync`. Your subs + views come back. ✅

---

## STEP 5 — TikTok & Instagram

These need developer approval. **Read `API_APPROVAL.md`** — it's the honest breakdown.
Until approved, leave them on `manual` and type the numbers. The rest of the dashboard is unaffected.

---

## STEP 6 — Connect your dashboard to the backend

1. Open `dashboard-connect.js`.
2. Set `BACKEND_URL` to your Vercel URL, and `DASHBOARD_TOKEN` to the same string you set in Vercel.
3. Paste the whole snippet into `personal-command.html`, just before the closing `</script>`.
4. Find `tryUnlock()` in the dashboard. After the line `renderAll();`, add one line:
   ```js
   fetchLiveData();
   ```
5. Re-upload/redeploy your dashboard. Now when you unlock, it pulls live numbers from the backend, falls back to manual if the backend is ever unreachable.

---

## STEP 7 — Auto-refresh (already set up)

`vercel.json` includes a cron that hits `/api/refresh-all` **every 6 hours**, so your numbers stay fresh automatically. Change `"0 */6 * * *"` to `"0 * * * *"` for hourly, or `"0 0 * * *"` for once a day.

> Note: Vercel cron is available on the free Hobby plan at a daily minimum; for every-6-hours you may need the Pro plan, OR just hit "Refresh" in the dashboard (the `triggerRefresh()` function) whenever you want an update. Both work.

---

## WHERE YOUR SECRETS LIVE (important)

- **Dashboard HTML** (public): only `BACKEND_URL` + `DASHBOARD_TOKEN`. Never any real API keys.
- **Vercel env vars** (secret, server-side): Stripe key, Supabase service role, social tokens.
- This split is *why* it's safe — the browser never touches a real secret. That's the whole reason the backend has to exist as a separate piece.

You're done. Stripe automates immediately; socials automate as you get each approved.
