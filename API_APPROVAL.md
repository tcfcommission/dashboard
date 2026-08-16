# The Honest Truth About Social Media APIs

Read this before you spend hours chasing "automatic TikTok views." I'd rather you know the real picture than burn a weekend on a dead end.

---

## The core reality

Social platforms **do not want** random apps pulling data freely — it's how scandals happen. So every one of them gates access. There are exactly two ways people get social stats:

1. **The official API** — terms-compliant, stable, but requires registration and (for most) approval.
2. **Scraping** — hitting the public page and ripping numbers out of the HTML. This **breaks their terms of service, breaks constantly** (every time they change their page it dies), can get your accounts banned, and is not something I'll build you. Anyone selling "instant social automation" cheaply is almost always doing this.

This guide is the **official, safe path** for each. Where it's easy, I say so. Where it's a slog, I say that too.

---

## ✅ YouTube — EASY (do this one)

- **Approval needed?** No.
- **What you need:** a free Google Cloud API key.
- **Time:** ~20 minutes.
- **Reality:** YouTube is the friendliest. Public channel stats (subscribers, total views) come back with just a key. This genuinely works today.
- **Code:** `api/youtube-sync.js` — ready.

---

## ✅ Stripe — EASY and this is the big win

- **Approval needed?** No. It's your own account.
- **What you need:** your Stripe secret key.
- **Time:** ~20 minutes.
- **Reality:** This is the one that actually changes your life day-to-day. Your real revenue and sales count pull in and update themselves. If you do only one automation, do this.
- **Code:** `api/stripe-sync.js` — ready.

---

## 🛑 TikTok — HARD (needs approval)

- **Approval needed?** **Yes** — app review.
- **What you need:**
  1. developers.tiktok.com account
  2. A registered app
  3. Apply for **Login Kit** + **Display API** scopes
  4. **Wait for approval** (days to weeks, sometimes rejected, you reapply)
  5. OAuth so your account authorises your app → get an access token
- **Reality:** There is no key you can just paste. The approval is a real review process. Once you're through it, `api/tiktok-sync.js` works and pulls your follower + like counts. TikTok's *view* totals need the additional Content Posting API scope on top.
- **My advice:** Keep TikTok **manual** in the dashboard for now. Apply for approval in parallel. When it lands, flip it to API. Losing nothing in the meantime — you just type the number.

---

## 🛑 Instagram — HARD (needs a Business account + Meta approval)

- **Approval needed?** **Yes** — and prerequisites.
- **What you need:**
  1. Your IG must be a **Professional (Business/Creator)** account — personal accounts **cannot** be pulled, full stop.
  2. It must be linked to a **Facebook Page**.
  3. A **Meta developer app** at developers.facebook.com.
  4. App review for `instagram_basic` + `instagram_manage_insights`.
  5. OAuth → long-lived access token.
- **Reality:** Meta's process is the most bureaucratic of all. Followers and impressions are available once you're through it. `api/instagram-sync.js` is ready for that moment.
- **My advice:** Same as TikTok — manual now, apply in parallel, flip when approved.

---

## So what should you actually do?

**Today, realistically:**
- Deploy Supabase + Vercel (the skeleton). ✅
- Turn on **Stripe** — real revenue automation, immediately. ✅
- Turn on **YouTube** — free, works. ✅
- Leave **TikTok + Instagram manual** — type the numbers when you post; apply for their APIs in the background if/when you want them automated.

That gets you a real, mostly-automated command centre **this week**, with the two hardest platforms slotting in later without any rebuild — the code's already sitting there waiting for the tokens.

**The one-line summary:** Money automates now. Socials automate when the platforms let you in. Nobody honest can change that — but your dashboard is built so that when the door opens, you just walk through it.
