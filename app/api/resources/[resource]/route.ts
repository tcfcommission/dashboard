import { NextRequest, NextResponse } from "next/server";
import { isResourceName, sanitizeResource } from "@/lib/resources";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest, context: { params: Promise<{ resource: string }> }) {
  try {
    const { resource } = await context.params;
    if (!isResourceName(resource)) return NextResponse.json({ error: "Unsupported resource." }, { status: 404 });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = sanitizeResource(resource, await request.json());
    const { data, error } = await supabase.from(resource).insert({ ...payload, user_id: user.id } as never).select().single();
    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Create failed." }, { status: 400 });
  }
}
