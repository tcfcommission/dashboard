import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  const expected = process.env.TCF_INGEST_SECRET;
  if (!expected || request.headers.get("authorization") !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = process.env.TCF_OWNER_USER_ID;
  if (!userId) return NextResponse.json({ error: "TCF_OWNER_USER_ID is not configured." }, { status: 500 });

  try {
    const body = await request.json();
    const service = createServiceClient();
    if (body.type === "transaction") {
      const row = body.data || {};
      const { error } = await service.from("transactions").upsert({
        user_id: userId,
        provider: String(row.provider || "custom"),
        external_id: String(row.externalId || crypto.randomUUID()),
        description: String(row.description || "Imported transaction"),
        transaction_type: row.transactionType || "income",
        gross_amount: Number(row.grossAmount) || 0,
        fee_amount: Number(row.feeAmount) || 0,
        net_amount: Number(row.netAmount ?? row.grossAmount) || 0,
        currency: String(row.currency || "GBP").toUpperCase().slice(0, 3),
        occurred_at: row.occurredAt || new Date().toISOString(),
        metadata: row.metadata || {}
      }, { onConflict: "user_id,provider,external_id" });
      if (error) throw error;
      return NextResponse.json({ ok: true, type: "transaction" });
    }
    if (body.type === "social_metric") {
      const row = body.data || {};
      const { error } = await service.from("socials").upsert({
        user_id: userId,
        platform: String(row.platform || "other"),
        handle: String(row.handle || "Imported account"),
        profile_url: row.profileUrl || null,
        followers: Number(row.followers) || 0,
        views: Number(row.views) || 0,
        engagement_rate: Number(row.engagementRate) || 0,
        growth: Number(row.growth) || 0,
        source: "api",
        last_synced_at: new Date().toISOString()
      }, { onConflict: "user_id,platform,handle" });
      if (error) throw error;
      return NextResponse.json({ ok: true, type: "social_metric" });
    }
    return NextResponse.json({ error: "Unsupported event type." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Ingest failed." }, { status: 400 });
  }
}
