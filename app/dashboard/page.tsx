import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { loadDashboardData } from "@/lib/data";
import { emptyDashboard } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let supabase;
  try {
    supabase = await createClient();
  } catch (error) {
    return <DashboardShell initialData={emptyDashboard} email="TCF owner" setupError={error instanceof Error ? error.message : "Supabase is not configured."} />;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  try {
    const data = await loadDashboardData(supabase, user.id);
    return <DashboardShell initialData={data} email={user.email || "TCF owner"} />;
  } catch (error) {
    return <DashboardShell initialData={emptyDashboard} email="TCF owner" setupError={error instanceof Error ? error.message : "The dashboard could not load."} />;
  }
}
