# SHADOW OS — Backend

Turns your personal dashboard from manual entry into automatic data pulls.

## What's here
```
backend/
├── supabase/
│   └── schema.sql          → run once in Supabase to build your tables
├── api/
│   ├── stripe-sync.js      → ✅ pulls real Stripe revenue (works now)
│   ├── youtube-sync.js     → ✅ pulls YouTube stats (free key, works now)
│   ├── tiktok-sync.js      → 🛑 pulls TikTok stats (needs approval)
│   ├── instagram-sync.js   → 🛑 pulls Instagram stats (needs approval)
│   ├── refresh-all.js      → runs every sync; skips ones not set up
│   └── get-dashboard.js    → the read endpoint your dashboard fetches
├── dashboard-connect.js    → snippet to wire your existing dashboard in
├── vercel.json             → cron: auto-refresh every 6 hours
├── package.json            → dependencies
└── docs/
    ├── DEPLOY_GUIDE.md     → START HERE. Full step-by-step.
    └── API_APPROVAL.md     → honest truth about each social API

## Start here
Open docs/DEPLOY_GUIDE.md and follow it top to bottom.
Do Supabase → Stripe → YouTube first (all work immediately).
TikTok + Instagram need platform approval — see API_APPROVAL.md.
```
