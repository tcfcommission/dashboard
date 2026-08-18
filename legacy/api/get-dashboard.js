// ============================================================
// GET DASHBOARD  —  the read endpoint your dashboard fetches
// ============================================================
// Returns everything the dashboard needs in one JSON payload.
// Uses the service role server-side, so your data stays private
// (the browser never sees your Supabase keys).
//
// Protect it with a simple shared token so only your dashboard reads it.
//
// ENV VARS:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE
//   DASHBOARD_TOKEN   = any long random string; your dashboard sends it
// ============================================================

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS so your hosted dashboard can call it
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // simple token gate
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (process.env.DASHBOARD_TOKEN && token !== process.env.DASHBOARD_TOKEN) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);
    const [socials, businesses, goals, tasks, history, settings] = await Promise.all([
      supabase.from('socials').select('*').order('platform'),
      supabase.from('businesses').select('*').order('name'),
      supabase.from('goals').select('*'),
      supabase.from('tasks').select('*').eq('due_date', new Date().toISOString().slice(0,10)).order('created_at'),
      supabase.from('revenue_history').select('*').order('day', { ascending: true }).limit(14),
      supabase.from('settings').select('*').single()
    ]);

    return res.status(200).json({
      ok: true,
      name: settings.data?.owner_name || 'Shadow',
      socials: socials.data || [],
      businesses: businesses.data || [],
      goals: goals.data || [],
      tasks: tasks.data || [],
      revHistory: (history.data || []).map(h => Number(h.revenue) || 0)
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
