import { NextRequest, NextResponse } from "next/server";
import { runIntegrationSync } from "@/lib/integrations/sync";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { Integration } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    if (!body.integrationId || typeof body.integrationId !== "string") return NextResponse.json({ error: "integrationId is required." }, { status: 400 });

    const service = createServiceClient();
    const { data: integration, error } = await service.from("integrations").select("*").eq("id", body.integrationId).eq("user_id", user.id).single();
    if (error || !integration) return NextResponse.json({ error: "Integration not found." }, { status: 404 });
    const summary = await runIntegrationSync({ supabase: service, integration: integration as Integration, userId: user.id });
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Sync failed." }, { status: 500 });
  }
}
