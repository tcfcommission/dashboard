// ============================================================
// TIKTOK SYNC  —  NEEDS DEVELOPER APPROVAL (read this honestly)
// ============================================================
// STRAIGHT TALK: TikTok does NOT let you pull your stats with a
// simple key. You must:
//   1. Register at developers.tiktok.com
//   2. Create an app
//   3. Apply for the "Login Kit" + "Display API" scopes
//   4. Get the app APPROVED (this is a review, can take days/weeks)
//   5. Do OAuth so your account authorises the app
//   6. Use the returned access_token to call the API
//
// There is NO honest shortcut around the approval. Anyone selling
// "instant TikTok view automation" is either scraping (breaks TikTok's
// terms + breaks constantly) or lying. This function is the REAL,
// terms-compliant path — it works once your app is approved.
//
// ENV VARS (after approval + OAuth):
//   TIKTOK_ACCESS_TOKEN   = the OAuth token for your account
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE
//   TIKTOK_SOCIAL_ID      = e.g. 'tiktok_shadowglobal'
//
// Until approved: leave this social on 'manual' in your dashboard
// and type the numbers yourself. Everything else still works.
// ============================================================

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  try {
    const accessToken = process.env.TIKTOK_ACCESS_TOKEN;
    const socialId = process.env.TIKTOK_SOCIAL_ID || 'tiktok_shadowglobal';

    if (!accessToken) {
      return res.status(200).json({
        ok: false,
        skipped: true,
        reason: 'No TikTok access token yet — app not approved / not connected. Staying manual.'
      });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE
    );

    // --- TikTok Display API: user info (followers, likes) ---
    // Docs: developers.tiktok.com/doc/display-api-get-user-info
    const r = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=follower_count,likes_count,video_count', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const data = await r.json();

    if (data.error && data.error.code !== 'ok') {
      throw new Error(data.error.message || 'TikTok API error');
    }

    const u = data.data?.user || {};
    const followers = u.follower_count || 0;
    const views = u.likes_count || 0; // TikTok exposes likes; view totals need Content API

    const { data: prev } = await supabase
      .from('socials').select('followers').eq('id', socialId).single();
    const prevFollowers = prev?.followers || 0;
    const growth = prevFollowers > 0
      ? +(((followers - prevFollowers) / prevFollowers) * 100).toFixed(1)
      : 0;

    const { error } = await supabase
      .from('socials')
      .update({
        followers, views, growth,
        source: 'api',
        last_synced: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', socialId);

    if (error) throw error;

    return res.status(200).json({ ok: true, platform: 'tiktok', followers, views, growth });
  } catch (err) {
    console.error('TikTok sync failed:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
