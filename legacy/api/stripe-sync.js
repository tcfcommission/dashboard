// ============================================================
// STRIPE SYNC  —  THIS ONE WORKS RIGHT NOW (real automation)
// ============================================================
// Pulls your real Stripe revenue + sales count and writes it to Supabase.
// Runs on Vercel (serverless). Called by refresh-all.js and/or the cron.
//
// ENV VARS NEEDED (set in Vercel → Settings → Environment Variables):
//   STRIPE_SECRET_KEY        = sk_live_... (from Stripe dashboard)
//   SUPABASE_URL             = https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE    = the service_role key (SECRET, server-only)
//   STRIPE_BUSINESS_ID       = which business row to update, e.g. 'shadow_global'
// ============================================================

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE
    );
    const businessId = process.env.STRIPE_BUSINESS_ID || 'shadow_global';

    // --- Pull all successful charges (paginated) ---
    let totalRevenue = 0;
    let salesCount = 0;
    let hasMore = true;
    let startingAfter = undefined;

    while (hasMore) {
      const charges = await stripe.charges.list({
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {})
      });

      for (const charge of charges.data) {
        if (charge.paid && charge.status === 'succeeded' && !charge.refunded) {
          totalRevenue += charge.amount;   // amount is in pence
          salesCount += 1;
        }
      }

      hasMore = charges.has_more;
      if (hasMore) startingAfter = charges.data[charges.data.length - 1].id;
    }

    const revenueInPounds = Math.round(totalRevenue / 100);

    // --- Write to Supabase ---
    const { error } = await supabase
      .from('businesses')
      .update({
        revenue: revenueInPounds,
        sales: salesCount,
        last_synced: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', businessId);

    if (error) throw error;

    // --- Also log today's total into revenue_history for the chart ---
    const today = new Date().toISOString().slice(0, 10);
    await supabase
      .from('revenue_history')
      .upsert({ day: today, revenue: revenueInPounds }, { onConflict: 'day' });

    return res.status(200).json({
      ok: true,
      business: businessId,
      revenue: revenueInPounds,
      sales: salesCount,
      synced: new Date().toISOString()
    });
  } catch (err) {
    console.error('Stripe sync failed:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
