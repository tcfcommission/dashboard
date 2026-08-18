// ============================================================
// INSTAGRAM SYNC  —  NEEDS A BUSINESS ACCOUNT + META APPROVAL
// ============================================================
// STRAIGHT TALK: Instagram only exposes stats through the Meta
// Graph API, and ONLY if:
//   1. Your IG is a PROFESSIONAL (Business/Creator) account
//   2. It's linked to a Facebook Page
//   3. You create an app at developers.facebook.com
//   4. You add "Instagram Graph API" + get the app reviewed for
//      the instagram_basic / instagram_manage_insights permissions
//   5. You do OAuth to get a long-lived access token
//
// Personal IG accounts CANNOT be pulled at all. This is Meta's rule.
// Like TikTok: no honest shortcut. Real path below; manual until ready.
//
// ENV VARS (after setup):
//   IG_ACCESS_TOKEN        = long-lived Graph API token
//   IG_USER_ID             = your instagram business account id
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE
//   IG_SOCIAL_ID           = e.g. 'instagram_mrglobalai'
// ============================================================

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  try {
    const token = process.env.IG_ACCESS_TOKEN;
    const igUserId = process.env.IG_USER_ID;
    const socialId = process.env.IG_SOCIAL_ID || 'instagram_mrglobalai';

    if (!token || !igUserId) {
      return res.status(200).json({
        ok: false,
        skipped: true,
        reason: 'No Instagram token/user id yet — Business account + Meta app not connected. Staying manual.'
      });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE
    );

    // --- Followers via Graph API ---
    const fieldsUrl = `https://graph.facebook.com/v19.0/${igUserId}?fields=followers_count,media_count&access_token=${token}`;
    const r1 = await fetch(fieldsUrl);
    const info = await r1.json();
    if (info.error) throw new Error(info.error.message);
    const followers = info.followers_count || 0;

    // --- Views/impressions via insights (last 30 days) ---
    let views = 0;
    try {
      const insightsUrl = `https://graph.facebook.com/v19.0/${igUserId}/insights?metric=impressions&period=days_28&access_token=${token}`;
      const r2 = await fetch(insightsUrl);
      const ins = await r2.json();
      views = ins.data?.[0]?.values?.[0]?.value || 0;
    } catch (_) { /* insights optional */ }

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

    return res.status(200).json({ ok: true, platform: 'instagram', followers, views, growth });
  } catch (err) {
    console.error('Instagram sync failed:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
