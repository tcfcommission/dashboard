// ============================================================
// REFRESH ALL  —  runs every sync in one call
// ============================================================
// This is what the cron hits on a schedule, and what your dashboard's
// "Refresh" button calls. It runs each platform sync; any that aren't
// set up yet just skip gracefully (they stay manual).
//
// It calls the other functions internally by importing their handlers.
// ============================================================

import stripeSync from './stripe-sync.js';
import youtubeSync from './youtube-sync.js';
import tiktokSync from './tiktok-sync.js';
import instagramSync from './instagram-sync.js';
import { createClient } from '@supabase/supabase-js';

// helper to run a handler and capture its JSON result
function runHandler(handler, label) {
  return new Promise(async (resolve) => {
    const fakeRes = {
      _status: 200,
      status(code) { this._status = code; return this; },
      json(obj) { resolve({ label, status: this._status, ...obj }); return this; }
    };
    try { await handler({ method: 'POST' }, fakeRes); }
    catch (e) { resolve({ label, ok: false, error: e.message }); }
  });
}

export default async function handler(req, res) {
  const results = [];
  results.push(await runHandler(stripeSync,    'stripe'));
  results.push(await runHandler(youtubeSync,   'youtube'));
  results.push(await runHandler(tiktokSync,    'tiktok'));
  results.push(await runHandler(instagramSync, 'instagram'));

  // After socials sync, auto-update any goals that track totals
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);
    const { data: socials } = await supabase.from('socials').select('followers');
    const { data: biz } = await supabase.from('businesses').select('revenue');
    const followersTotal = (socials || []).reduce((s, x) => s + (x.followers || 0), 0);
    const revenueTotal = (biz || []).reduce((s, x) => s + (Number(x.revenue) || 0), 0);

    await supabase.from('goals').update({ current: followersTotal, updated_at: new Date().toISOString() }).eq('auto_source', 'followers_total');
    await supabase.from('goals').update({ current: revenueTotal, updated_at: new Date().toISOString() }).eq('auto_source', 'revenue_total');
  } catch (e) { /* non-fatal */ }

  return res.status(200).json({
    ok: true,
    ran_at: new Date().toISOString(),
    results
  });
}
