import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { getServiceSupabaseEnv } from "./env";

export function createServiceClient() {
  const { url, serviceRoleKey } = getServiceSupabaseEnv();
  return createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
