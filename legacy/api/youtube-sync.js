// ============================================================
// YOUTUBE SYNC  —  WORKS WITH A FREE API KEY (easiest social)
// ============================================================
// YouTube's Data API is the friendliest of the socials: no approval
// process for public channel stats — just a free API key.
//
// GET YOUR KEY:
//   1. console.cloud.google.com → new project
//   2. Enable "YouTube Data API v3"
//   3. Credentials → Create API Key
//
// ENV VARS:
//   YOUTUBE_API_KEY      = your key
//   YOUTUBE_CHANNEL_ID   = your channel id (starts with UC...)
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE
//   YOUTUBE_SOCIAL_ID    = which socials row, e.g. 'youtube_shadowglobal'
//
// FIND YOUR CHANNEL ID: youtube.com → your channel → Settings →
//   Advanced, OR use the channels.list?forUsername endpoint.
// ============================================================

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const channelId = process.env.YOUTUBE_CHANNEL_ID;
    const socialId = process.env.YOUTUBE_SOCIAL_ID || 'youtube_shadowglobal';

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE
    );

    // --- Call YouTube Data API ---
    const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${apiKey}`;
    const r = await fetch(url);
    const data = await r.json();

    if (!data.items || !data.items.length) {
      throw new Error('Channel not found — check YOUTUBE_CHANNEL_ID');
    }

    const stats = data.items[0].statistics;
    const followers = parseInt(stats.subscriberCount || 0, 10);
    const views = parseInt(stats.viewCount || 0, 10);

    // --- Read previous followers to compute growth % ---
    const { data: prev } = await supabase
      .from('socials').select('followers').eq('id', socialId).single();
    const prevFollowers = prev?.followers || 0;
    const growth = prevFollowers > 0
      ? +(((followers - prevFollowers) / prevFollowers) * 100).toFixed(1)
      : 0;

    // --- Write to Supabase ---
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

    return res.status(200).json({ ok: true, platform: 'youtube', followers, views, growth });
  } catch (err) {
    console.error('YouTube sync failed:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
