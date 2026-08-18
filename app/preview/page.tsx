import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import type { DashboardData } from "@/lib/types";

export default function PreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const now = new Date();
  const iso = (daysAgo = 0) => new Date(now.getTime() - daysAgo * 86_400_000).toISOString();
  const data: DashboardData = {
    profile: { display_name: "TCF", timezone: "Europe/London", base_currency: "GBP" },
    socials: [
      { id: "s1", platform: "youtube", handle: "@tcf", profile_url: null, followers: 4200, views: 68200, engagement_rate: 4.2, growth: 6.4, source: "api", last_synced_at: iso() },
      { id: "s2", platform: "instagram", handle: "@tcf", profile_url: null, followers: 2180, views: 28400, engagement_rate: 5.1, growth: 3.2, source: "manual", last_synced_at: iso(1) }
    ],
    businesses: [
      { id: "b1", name: "TCF Systems", emoji: "◆", source: "stripe", currency: "GBP", is_active: true },
      { id: "b2", name: "Shadow Global", emoji: "◈", source: "manual", currency: "GBP", is_active: true }
    ],
    goals: [{ id: "g1", name: "First £10k month", current_value: 4850, target_value: 10000, unit: "GBP", due_date: iso(-30).slice(0,10), status: "active", auto_source: "revenue_total" }],
    tasks: [
      { id: "t1", title: "Send the priority client proposal", details: "Review scope and send before 16:00.", status: "todo", priority: "high", due_date: iso().slice(0,10), completed_at: null },
      { id: "t2", title: "Publish today’s proof post", details: "Use the dashboard build as the case study.", status: "doing", priority: "normal", due_date: iso().slice(0,10), completed_at: null }
    ],
    transactions: [
      { id: "x1", provider: "stripe", description: "Automation system deposit", transaction_type: "income", gross_amount: 750, fee_amount: 12.25, net_amount: 737.75, currency: "GBP", occurred_at: iso(), business_id: "b1" },
      { id: "x2", provider: "manual", description: "Software tools", transaction_type: "expense", gross_amount: -95, fee_amount: 0, net_amount: -95, currency: "GBP", occurred_at: iso(2), business_id: "b1" }
    ],
    integrations: [
      { id: "i1", provider: "stripe", label: "TCF Stripe", status: "connected", account_reference: "Primary account", config: {}, sync_frequency_minutes: 1440, is_enabled: true, last_synced_at: iso(), next_sync_at: iso(-1), last_error: null },
      { id: "i2", provider: "youtube", label: "TCF YouTube", status: "connected", account_reference: "Channel", config: {}, sync_frequency_minutes: 1440, is_enabled: true, last_synced_at: iso(), next_sync_at: iso(-1), last_error: null },
      { id: "i3", provider: "instagram", label: "TCF Instagram", status: "attention", account_reference: "Professional account", config: {}, sync_frequency_minutes: 1440, is_enabled: false, last_synced_at: null, next_sync_at: null, last_error: "Meta OAuth approval required." }
    ],
    syncRuns: [{ id: "r1", provider: "stripe", status: "success", started_at: iso(), completed_at: iso(), summary: { imported: 12 }, error_message: null }],
    dailyRevenue: Array.from({ length: 14 }, (_, index) => ({ metric_date: iso(13 - index).slice(0,10), revenue: 180 + index * 38 + (index % 3) * 75, sales: 1 + (index % 3) }))
  };
  return <DashboardShell initialData={data} email="owner@tcf.local" />;
}
