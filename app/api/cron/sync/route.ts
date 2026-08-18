import { NextRequest, NextResponse } from "next/server";
import { runIntegrationSync } from "@/lib/integrations/sync";
import { createServiceClient } from "@/lib/supabase/service";
import type { Integration } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();
  const now = new Date().toISOString();
  const { data, error } = await service.from("integrations").select("*").eq("is_enabled", true).or(`next_sync_at.is.null,next_sync_at.lte.${now}`).limit(25);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results = [];
  for (const integration of data || []) {
    try {
      const summary = await runIntegrationSync({ supabase: service, integration: integration as Integration, userId: integration.user_id });
      results.push({ id: integration.id, provider: integration.provider, ok: true, summary });
    } catch (syncError) {
      results.push({ id: integration.id, provider: integration.provider, ok: false, error: syncError instanceof Error ? syncError.message : "Sync failed." });
    }
  }
  return NextResponse.json({ ok: true, ranAt: now, results });
}
