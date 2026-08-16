# TCF OS — SUPABASE → GITHUB → VERCEL (click-by-click)

Do these three in this exact order. Each one takes 5-15 minutes. Don't skip ahead —
GitHub needs to exist before Vercel, and Supabase needs to exist before you can
connect anything to it.

By the end: your database exists, your backend code is live on the internet,
and Stripe + YouTube are pulling real numbers automatically.

---

# 1️⃣ SUPABASE — your database (10 min)

**What it is:** the place your live numbers get stored.

1. Go to **supabase.com** → click **Start your project** → sign up (GitHub or email, free)
2. Click **New Project**
   - Name: `tcf-os`
   - Database password: make one up, **save it somewhere** (a notes app is fine)
   - Region: closest to you (e.g. West EU / London)
   - Click **Create new project** → wait ~2 minutes while it builds
3. Once it's ready, click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Open the file **`supabase/schema.sql`** (in your backend folder), select ALL the text, copy it
6. Paste it into the Supabase query box
7. Click **Run** (bottom right, or Ctrl/Cmd + Enter)
8. You should see **"Success. No rows returned"** — that means your tables are built ✅
9. Now click **Project Settings** (gear icon, bottom left) → **API**
10. You'll see two things — **copy both somewhere safe, you need them in Step 3:**
    - **Project URL** → looks like `https://abcdefgh.supabase.co`
    - **service_role** key (under "Project API keys" — click the eye icon to reveal it) → a long string starting `eyJ...`

⚠️ **The service_role key is secret.** Never post it publicly, never put it in the dashboard file itself. It only ever goes into Vercel (Step 3).

**✅ Supabase done. Your database exists.**

---

# 2️⃣ GITHUB — where your backend code lives (5 min)

**What it is:** just storage for the code, so Vercel can read it and run it.

1. Go to **github.com** → sign up if you don't have an account (free)
2. Click the **+** icon (top right) → **New repository**
   - Repository name: `tcf-os-backend`
   - Set it to **Public** (fine — there are no secrets in the code itself, only in Vercel later)
   - Click **Create repository**
3. On the new empty repo page, click **uploading an existing file**
4. Open your `shadow-os-backend` folder → select everything inside it (the `api` folder, `supabase` folder, `docs` folder, `dashboard-connect.js`, `vercel.json`, `package.json`, `README.md`)
5. Drag them all into the GitHub upload box
6. Scroll down, click **Commit changes**

**✅ GitHub done. Your code is stored and ready for Vercel to grab.**

---

# 3️⃣ VERCEL — runs your backend live (10 min)

**What it is:** this is what actually *executes* the sync code — the thing that calls Stripe/YouTube and writes to Supabase.

1. Go to **vercel.com** → sign up using **your GitHub account** (this makes the next step automatic)
2. Click **Add New...** → **Project**
3. Find `tcf-os-backend` in the list (it'll show up because you signed in with GitHub) → click **Import**
4. Before clicking Deploy, click **Environment Variables** and add these one at a time:

   | Name | Value |
   |------|-------|
   | `SUPABASE_URL` | paste your Project URL from Supabase Step 1 |
   | `SUPABASE_SERVICE_ROLE` | paste your service_role key from Supabase Step 1 |
   | `DASHBOARD_TOKEN` | type any long random text, e.g. `tcf-secure-9284kd8261` |

5. Click **Deploy**
6. Wait ~1 minute. You'll get a live URL like `tcf-os-backend.vercel.app`
7. Test it worked: visit `https://tcf-os-backend.vercel.app/api/get-dashboard` in your browser
   - You should see `{"ok":false,"error":"unauthorized"}` — **that's correct!** It means the backend is live and protected.

**✅ Vercel done. Your backend is live on the internet.**

---

# 4️⃣ TURN ON STRIPE (10 min) — real automation, today

1. Go to **dashboard.stripe.com** → **Developers** → **API keys**
2. Copy your **Secret key** (starts `sk_live_...` — or use `sk_test_...` first if you want to test safely)
3. Back in **Vercel** → your project → **Settings** → **Environment Variables** → add:

   | Name | Value |
   |------|-------|
   | `STRIPE_SECRET_KEY` | your sk_live_ or sk_test_ key |
   | `STRIPE_BUSINESS_ID` | `shadow_global` |

4. Go to **Deployments** tab → click the **⋯** on the latest one → **Redeploy** (so it picks up the new keys)
5. Once redeployed, visit `https://tcf-os-backend.vercel.app/api/stripe-sync`
6. You should see your **real revenue and sales** come back as JSON ✅

**✅ Stripe is now automatic. Your money updates itself from now on.**

---

# 5️⃣ TURN ON YOUTUBE (15 min) — free, automatic

1. Go to **console.cloud.google.com** → click **New Project** (name it anything) → **Create**
2. Left menu → **APIs & Services** → **Library** → search **"YouTube Data API v3"** → click it → **Enable**
3. Left menu → **Credentials** → **Create Credentials** → **API key** → copy it
4. Find your Channel ID: go to youtube.com → your channel → **Settings** → **Advanced settings** → copy the ID (starts `UC...`)
5. Back in **Vercel** → Environment Variables → add:

   | Name | Value |
   |------|-------|
   | `YOUTUBE_API_KEY` | your key |
   | `YOUTUBE_CHANNEL_ID` | your UC... id |
   | `YOUTUBE_SOCIAL_ID` | `youtube_shadowglobal` |

6. **Redeploy** again (same as before)
7. Visit `https://tcf-os-backend.vercel.app/api/youtube-sync` → your subs + views come back ✅

**✅ YouTube is now automatic too.**

---

# 6️⃣ CONNECT YOUR DASHBOARD TO ALL THIS (5 min)

Right now your dashboard (`index.html`) still shows manual numbers. This step makes it pull the live ones.

1. Open `dashboard-connect.js` from your backend folder
2. Find these two lines near the top:
   ```js
   const BACKEND_URL = 'https://YOUR-BACKEND.vercel.app';
   const DASHBOARD_TOKEN = 'YOUR-LONG-RANDOM-TOKEN';
   ```
3. Replace with your real values:
   - `BACKEND_URL` = your actual Vercel URL from Step 3
   - `DASHBOARD_TOKEN` = the exact same random text you set in Vercel Step 3
4. Copy the whole file's contents
5. Open your `index.html` in a text editor, paste this snippet in right before the final `</script>` tag near the bottom
6. Find the function `tryUnlock()` in the file. Right after the line that says `renderAll();` inside it, add a new line: `fetchLiveData();`
7. Save the file
8. Go back to **Netlify** → drag this updated `index.html` on again (same drop page) — it'll give you a fresh live link, or update your existing one if you signed in

**✅ Now when you unlock your dashboard, it pulls real Stripe + YouTube numbers automatically.**

---

# WHAT'S AUTOMATIC NOW vs WHAT'S PENDING

| | Status |
|---|---|
| 💰 Stripe (money) | ✅ **Automatic** |
| 📺 YouTube | ✅ **Automatic** |
| 🎵 TikTok | ⏳ Manual until your developer app is approved |
| 📸 Instagram | ⏳ Manual until your developer app is approved |

When TikTok/Instagram approve you, come back — it's a 2-minute job to flip them on
(paste the token into Vercel, same pattern as Stripe/YouTube above). The code is
already sitting in `api/tiktok-sync.js` and `api/instagram-sync.js`, ready and waiting.

**That's the whole system, live.**
