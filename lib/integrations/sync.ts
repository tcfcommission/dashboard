import Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Integration, Json } from "@/lib/types";
import { isSafeCredentialReference } from "@/lib/resources";

type SyncContext = { supabase: SupabaseClient; integration: Integration & { user_id?: string }; userId: string };
type SyncSummary = Record<string, Json>;

function configString(integration: Integration, key: string) {
  const value = integration.config?.[key];
  return typeof value === "string" ? value.trim() : "";
}

function credential(integration: Integration, key: string, fallbackRef: string) {
  const requestedRef = configString(integration, key) || fallbackRef;
  if (!isSafeCredentialReference(requestedRef)) throw new Error(`Invalid credential reference: ${requestedRef}`);
  const value = process.env[requestedRef];
  if (!value) throw new Error(`${requestedRef} is not configured in Vercel.`);
  return value;
}

async function syncYouTube({ supabase, integration, userId }: SyncContext): Promise<SyncSummary> {
  const apiKey = credential(integration, "credentialRef", "TCF_YOUTUBE_API_KEY");
  const channelId = configString(integration, "channelId") || integration.account_reference || "";
  if (!channelId) throw new Error("YouTube channel ID is missing.");

  const url = new URL("https://www.googleapis.com/youtube/v3/channels");
  url.searchParams.set("part", "statistics,snippet");
  url.searchParams.set("id", channelId);
  url.searchParams.set("key", apiKey);
  const response = await fetch(url, { cache: "no-store" });
  const payload = await response.json();
  if (!response.ok || !payload.items?.length) throw new Error(payload.error?.message || "YouTube channel was not found.");

  const channel = payload.items[0];
  const followers = Number(channel.statistics?.subscriberCount) || 0;
  const views = Number(channel.statistics?.viewCount) || 0;
  const handle = configString(integration, "handle") || channel.snippet?.customUrl || channel.snippet?.title || channelId;

  const { data: previous } = await supabase.from("socials").select("followers").eq("user_id", userId).eq("platform", "youtube").eq("handle", handle).maybeSingle();
  const previousFollowers = Number(previous?.followers) || 0;
  const growth = previousFollowers > 0 ? Number((((followers - previousFollowers) / previousFollowers) * 100).toFixed(3)) : 0;

  const now = new Date().toISOString();
  const { error } = await supabase.from("socials").upsert({
    user_id: userId,
    platform: "youtube",
    handle,
    profile_url: `https://www.youtube.com/channel/${channelId}`,
    followers,
    views,
    growth,
    source: "api",
    last_synced_at: now
  }, { onConflict: "user_id,platform,handle" });
  if (error) throw error;
  return { followers, views, handle };
}

async function syncTikTok({ supabase, integration, userId }: SyncContext): Promise<SyncSummary> {
  const accessToken = credential(integration, "credentialRef", "TCF_TIKTOK_ACCESS_TOKEN");
  const response = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url,follower_count,likes_count,video_count", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store"
  });
  const payload = await response.json();
  if (!response.ok || (payload.error && payload.error.code !== "ok")) throw new Error(payload.error?.message || "TikTok sync failed.");
  const user = payload.data?.user || {};
  const followers = Number(user.follower_count) || 0;
  const views = Number(user.likes_count) || 0;
  const handle = configString(integration, "handle") || user.display_name || integration.account_reference || "TikTok";
  const now = new Date().toISOString();
  const { error } = await supabase.from("socials").upsert({
    user_id: userId, platform: "tiktok", handle, followers, views, source: "api", last_synced_at: now
  }, { onConflict: "user_id,platform,handle" });
  if (error) throw error;
  return { followers, likes: views, videos: Number(user.video_count) || 0 };
}

async function syncInstagram({ supabase, integration, userId }: SyncContext): Promise<SyncSummary> {
  const accessToken = credential(integration, "credentialRef", "TCF_INSTAGRAM_ACCESS_TOKEN");
  const instagramUserId = configString(integration, "instagramUserId") || integration.account_reference || "";
  if (!instagramUserId) throw new Error("Instagram professional account ID is missing.");
  const url = new URL(`https://graph.facebook.com/v23.0/${encodeURIComponent(instagramUserId)}`);
  url.searchParams.set("fields", "username,followers_count,media_count");
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
  const payload = await response.json();
  if (!response.ok || payload.error) throw new Error(payload.error?.message || "Instagram sync failed.");
  const handle = payload.username ? `@${payload.username}` : configString(integration, "handle") || instagramUserId;
  const followers = Number(payload.followers_count) || 0;
  const now = new Date().toISOString();
  const { error } = await supabase.from("socials").upsert({
    user_id: userId, platform: "instagram", handle, followers, views: 0, source: "api", last_synced_at: now
  }, { onConflict: "user_id,platform,handle" });
  if (error) throw error;
  return { followers, media: Number(payload.media_count) || 0, handle };
}

async function syncStripe({ supabase, integration, userId }: SyncContext): Promise<SyncSummary> {
  const secret = credential(integration, "credentialRef", "TCF_STRIPE_SECRET_KEY");
  const stripe = new Stripe(secret);
  const businessId = configString(integration, "businessId") || null;
  const since = Math.floor((Date.now() - 90 * 24 * 60 * 60 * 1000) / 1000);
  const transactions: Array<Record<string, unknown>> = [];
  const daily = new Map<string, { revenue: number; sales: number }>();
  let startingAfter: string | undefined;

  for (let page = 0; page < 10; page += 1) {
    const result = await stripe.balanceTransactions.list({ limit: 100, created: { gte: since }, ...(startingAfter ? { starting_after: startingAfter } : {}) });
    for (const item of result.data) {
      if (!['charge','payment','refund','payment_refund'].includes(item.type)) continue;
      const occurredAt = new Date(item.created * 1000).toISOString();
      const gross = item.amount / 100;
      const fee = item.fee / 100;
      const net = item.net / 100;
      transactions.push({
        user_id: userId,
        business_id: businessId,
        provider: "stripe",
        external_id: item.id,
        description: item.description || item.type,
        transaction_type: gross < 0 ? "refund" : "income",
        gross_amount: gross,
        fee_amount: fee,
        net_amount: net,
        currency: item.currency.toUpperCase(),
        occurred_at: occurredAt,
        metadata: { source: item.source || null, reporting_category: item.reporting_category }
      });
      const day = occurredAt.slice(0, 10);
      const current = daily.get(day) || { revenue: 0, sales: 0 };
      current.revenue += net;
      if (gross > 0) current.sales += 1;
      daily.set(day, current);
    }
    if (!result.has_more || !result.data.length) break;
    startingAfter = result.data[result.data.length - 1].id;
  }

  if (transactions.length) {
    const { error } = await supabase.from("transactions").upsert(transactions, { onConflict: "user_id,provider,external_id" });
    if (error) throw error;
  }
  const metrics = Array.from(daily.entries()).map(([metric_date, value]) => ({
    user_id: userId, source_kind: "revenue", source_id: integration.id, metric_date,
    revenue: Number(value.revenue.toFixed(2)), sales: value.sales
  }));
  if (metrics.length) {
    const { error } = await supabase.from("daily_metrics").upsert(metrics, { onConflict: "user_id,source_kind,source_id,metric_date" });
    if (error) throw error;
  }
  return { imported: transactions.length, days: metrics.length };
}

const adapters: Record<string, (context: SyncContext) => Promise<SyncSummary>> = {
  stripe: syncStripe,
  youtube: syncYouTube,
  tiktok: syncTikTok,
  instagram: syncInstagram
};

export async function runIntegrationSync(context: SyncContext) {
  const adapter = adapters[context.integration.provider];
  const startedAt = new Date().toISOString();
  const { data: run, error: runError } = await context.supabase.from("sync_runs").insert({
    user_id: context.userId,
    integration_id: context.integration.id,
    provider: context.integration.provider,
    status: "running",
    started_at: startedAt
  }).select("id").single();
  if (runError) throw runError;

  await context.supabase.from("integrations").update({ status: "syncing", last_error: null }).eq("id", context.integration.id);
  try {
    if (!adapter) throw new Error(`${context.integration.provider} needs a provider adapter or normalized webhook before it can sync automatically.`);
    const summary = await adapter(context);
    const completedAt = new Date().toISOString();
    const next = new Date(Date.now() + context.integration.sync_frequency_minutes * 60_000).toISOString();
    await Promise.all([
      context.supabase.from("sync_runs").update({ status: "success", completed_at: completedAt, summary }).eq("id", run.id),
      context.supabase.from("integrations").update({ status: "connected", last_synced_at: completedAt, next_sync_at: next, last_error: null }).eq("id", context.integration.id)
    ]);
    return summary;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed.";
    const completedAt = new Date().toISOString();
    await Promise.all([
      context.supabase.from("sync_runs").update({ status: "failed", completed_at: completedAt, error_message: message }).eq("id", run.id),
      context.supabase.from("integrations").update({ status: "attention", last_error: message }).eq("id", context.integration.id)
    ]);
    throw error;
  }
}
