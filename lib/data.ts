import type { SupabaseClient } from "@supabase/supabase-js";
import type { DashboardData } from "./types";
import { emptyDashboard } from "./types";

type QueryResult = { data: unknown; error: { message: string } | null };

function assertQuery(name: string, result: QueryResult) {
  if (result.error) throw new Error(`${name}: ${result.error.message}`);
  return result.data;
}

function numeric<T extends Record<string, unknown>>(rows: T[], fields: string[]) {
  return rows.map((row) => {
    const next = { ...row };
    fields.forEach((field) => {
      if (field in next) (next as Record<string, unknown>)[field] = Number(next[field]) || 0;
    });
    return next;
  });
}

export async function loadDashboardData(supabase: SupabaseClient, userId: string): Promise<DashboardData> {
  const [profile, socials, businesses, goals, tasks, transactions, integrations, syncRuns, dailyRevenue] = await Promise.all([
    supabase.from("profiles").select("display_name,timezone,base_currency").eq("id", userId).maybeSingle(),
    supabase.from("socials").select("*").eq("user_id", userId).order("platform"),
    supabase.from("businesses").select("*").eq("user_id", userId).order("name"),
    supabase.from("goals").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("tasks").select("*").eq("user_id", userId).order("status").order("due_date", { nullsFirst: false }).limit(100),
    supabase.from("transactions").select("*").eq("user_id", userId).order("occurred_at", { ascending: false }).limit(40),
    supabase.from("integrations").select("*").eq("user_id", userId).order("provider"),
    supabase.from("sync_runs").select("*").eq("user_id", userId).order("started_at", { ascending: false }).limit(12),
    supabase.from("daily_metrics").select("metric_date,revenue,sales").eq("user_id", userId).eq("source_kind", "revenue").order("metric_date", { ascending: false }).limit(30)
  ]);

  const profileData = assertQuery("profile", profile as QueryResult) as DashboardData["profile"] | null;
  if (!profileData) throw new Error("Dashboard access is not enabled for this account.");
  const socialRows = assertQuery("socials", socials as QueryResult) as Array<Record<string, unknown>>;
  const businessRows = assertQuery("businesses", businesses as QueryResult) as Array<Record<string, unknown>>;
  const goalRows = assertQuery("goals", goals as QueryResult) as Array<Record<string, unknown>>;
  const taskRows = assertQuery("tasks", tasks as QueryResult) as Array<Record<string, unknown>>;
  const transactionRows = assertQuery("transactions", transactions as QueryResult) as Array<Record<string, unknown>>;
  const integrationRows = assertQuery("integrations", integrations as QueryResult) as Array<Record<string, unknown>>;
  const syncRows = assertQuery("sync runs", syncRuns as QueryResult) as Array<Record<string, unknown>>;
  const metricRows = assertQuery("daily metrics", dailyRevenue as QueryResult) as Array<Record<string, unknown>>;

  return {
    profile: profileData || emptyDashboard.profile,
    socials: numeric(socialRows, ["followers", "views", "engagement_rate", "growth"]) as DashboardData["socials"],
    businesses: businessRows as DashboardData["businesses"],
    goals: numeric(goalRows, ["current_value", "target_value"]) as DashboardData["goals"],
    tasks: taskRows as DashboardData["tasks"],
    transactions: numeric(transactionRows, ["gross_amount", "fee_amount", "net_amount"]) as DashboardData["transactions"],
    integrations: integrationRows as DashboardData["integrations"],
    syncRuns: syncRows as DashboardData["syncRuns"],
    dailyRevenue: numeric(metricRows, ["revenue", "sales"]).reverse() as DashboardData["dailyRevenue"]
  };
}
