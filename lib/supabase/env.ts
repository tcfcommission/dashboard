export function getPublicSupabaseEnv() {
  // The URL and publishable key are public client configuration (RLS remains
  // the security boundary). Keeping a production fallback means direct Vercel
  // deployments and fresh Git imports can still reach Auth and the API before
  // project-level environment variables are added.
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://khbobffksmlmkjxwvodo.supabase.co";
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "sb_publishable_d89-pBZo_8Icvf3z2-T8Iw_pyEgcZJ9";
  if (!url || !publishableKey) {
    throw new Error("Supabase public environment variables are not configured.");
  }
  return { url, publishableKey };
}

export function getServiceSupabaseEnv() {
  const { url } = getPublicSupabaseEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  return { url, serviceRoleKey };
}
