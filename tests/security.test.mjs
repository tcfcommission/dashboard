import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("production UI does not contain the legacy default password", async () => {
  const source = `${await read("components/dashboard-shell.tsx")}\n${await read("app/login/page.tsx")}`;
  assert.equal(source.includes("shadow2026"), false);
  assert.equal(source.includes("localStorage"), false);
});

test("scheduled automation requires CRON_SECRET", async () => {
  const source = await read("app/api/cron/sync/route.ts");
  assert.match(source, /CRON_SECRET/);
  assert.match(source, /authorization/);
  assert.match(source, /status: 401/);
});

test("generic ingest requires a server-side secret", async () => {
  const source = await read("app/api/webhooks/ingest/route.ts");
  assert.match(source, /TCF_INGEST_SECRET/);
  assert.match(source, /status: 401/);
});

test("database tables are owner scoped with RLS", async () => {
  const migration = await read("supabase/migrations/20260817230000_production_foundation.sql");
  for (const table of ["profiles", "socials", "businesses", "goals", "tasks", "integrations", "transactions", "daily_metrics", "sync_runs", "automation_rules"]) {
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
  }
  assert.match(migration, /\(select auth\.uid\(\)\)/);
  assert.match(migration, /access_enabled boolean not null default false/i);
  assert.doesNotMatch(migration, /revoke all on all tables in schema public from anon/i);
  assert.match(migration, /revoke all on public\.profiles[\s\S]+from anon/i);
  assert.match(migration, /grant all on public\.profiles[\s\S]+to service_role/i);
});

test("auth refresh responses cannot be cached", async () => {
  const source = await read("proxy.ts");
  assert.match(source, /getClaims\(\)/);
  assert.match(source, /Object\.entries\(headers\)/);
  assert.doesNotMatch(source, /supabase\.auth\.getSession\(\)/);
});

test("password recovery uses an allowlisted internal callback", async () => {
  const form = await read("components/forgot-password-form.tsx");
  const callback = await read("app/auth/callback/route.ts");
  const reset = await read("components/reset-password-form.tsx");
  assert.match(form, /resetPasswordForEmail/);
  assert.match(form, /\/auth\/callback\?next=\/reset-password/);
  assert.match(callback, /requestedNext === "\/reset-password"/);
  assert.doesNotMatch(callback, /NextResponse\.redirect\(requestedNext/);
  assert.match(reset, /updateUser\(\{ password \}\)/);
});

test("passwordless owner access cannot create public users", async () => {
  const login = await read("components/auth-form.tsx");
  const dashboard = await read("components/dashboard-shell.tsx");
  assert.match(login, /signInWithOtp/);
  assert.match(login, /shouldCreateUser: false/);
  assert.match(login, /emailRedirectTo: `\$\{window\.location\.origin\}\/auth\/callback`/);
  assert.doesNotMatch(login, /signInWithPassword/);
  assert.match(dashboard, /supabase\.auth\.updateUser\(\{ password \}\)/);
});

test("current Supabase runtime baseline uses Node 22 or later", async () => {
  const pkg = JSON.parse(await read("package.json"));
  assert.match(pkg.engines.node, />=22/);
});

test("automation configuration rejects embedded secrets", async () => {
  const source = await read("lib/resources.ts");
  assert.match(source, /\["integrations", "automation_rules"\]/);
  assert.match(source, /containsSecret\(output\.config\)/);
});

test("real secret values are not present in tracked environment template", async () => {
  const env = await read(".env.example");
  assert.equal(/sk_(live|test)_[A-Za-z0-9]+/.test(env), false);
  assert.equal(/eyJ[A-Za-z0-9_-]{20,}/.test(env), false);
  assert.match(env, /replace_in_vercel_only/);
});
