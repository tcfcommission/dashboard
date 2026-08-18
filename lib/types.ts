export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type SocialAccount = {
  id: string;
  platform: string;
  handle: string;
  profile_url: string | null;
  followers: number;
  views: number;
  engagement_rate: number;
  growth: number;
  source: "manual" | "api";
  last_synced_at: string | null;
};

export type Business = {
  id: string;
  name: string;
  emoji: string;
  source: "manual" | "stripe" | "bank" | "custom";
  currency: string;
  is_active: boolean;
};

export type Goal = {
  id: string;
  name: string;
  current_value: number;
  target_value: number;
  unit: string;
  due_date: string | null;
  status: "active" | "completed" | "paused";
  auto_source: string | null;
};

export type Task = {
  id: string;
  title: string;
  details: string | null;
  status: "todo" | "doing" | "done";
  priority: "high" | "normal" | "low";
  due_date: string | null;
  completed_at: string | null;
};

export type Transaction = {
  id: string;
  provider: string;
  description: string;
  transaction_type: "income" | "expense" | "refund" | "transfer";
  gross_amount: number;
  fee_amount: number;
  net_amount: number;
  currency: string;
  occurred_at: string;
  business_id: string | null;
};

export type Integration = {
  id: string;
  provider: string;
  label: string;
  status: "disconnected" | "connected" | "attention" | "syncing";
  account_reference: string | null;
  config: Record<string, Json>;
  sync_frequency_minutes: number;
  is_enabled: boolean;
  last_synced_at: string | null;
  next_sync_at: string | null;
  last_error: string | null;
};

export type SyncRun = {
  id: string;
  provider: string;
  status: "running" | "success" | "failed" | "skipped";
  started_at: string;
  completed_at: string | null;
  summary: Record<string, Json> | null;
  error_message: string | null;
};

export type DashboardData = {
  profile: { display_name: string; timezone: string; base_currency: string };
  socials: SocialAccount[];
  businesses: Business[];
  goals: Goal[];
  tasks: Task[];
  transactions: Transaction[];
  integrations: Integration[];
  syncRuns: SyncRun[];
  dailyRevenue: Array<{ metric_date: string; revenue: number; sales: number }>;
};

export const emptyDashboard: DashboardData = {
  profile: { display_name: "TCF", timezone: "Europe/London", base_currency: "GBP" },
  socials: [],
  businesses: [],
  goals: [],
  tasks: [],
  transactions: [],
  integrations: [],
  syncRuns: [],
  dailyRevenue: []
};
