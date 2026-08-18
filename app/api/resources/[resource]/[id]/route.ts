import { NextRequest, NextResponse } from "next/server";
import { isResourceName, sanitizeResource } from "@/lib/resources";
import { createClient } from "@/lib/supabase/server";

type Context = { params: Promise<{ resource: string; id: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const { resource, id } = await context.params;
    if (!isResourceName(resource)) return NextResponse.json({ error: "Unsupported resource." }, { status: 404 });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = sanitizeResource(resource, await request.json(), true);
    const { data, error } = await supabase.from(resource).update(payload as never).eq("id", id).eq("user_id", user.id).select().single();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Update failed." }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, context: Context) {
  try {
    const { resource, id } = await context.params;
    if (!isResourceName(resource)) return NextResponse.json({ error: "Unsupported resource." }, { status: 404 });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { error } = await supabase.from(resource).delete().eq("id", id).eq("user_id", user.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Delete failed." }, { status: 400 });
  }
}
