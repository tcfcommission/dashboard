import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  let isAuthenticated = false;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    isAuthenticated = Boolean(user);
  } catch {
    // The form shows a configuration error if Supabase has not been connected yet.
  }
  if (isAuthenticated) redirect("/dashboard");

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="brand-mark" aria-hidden="true"><span /></div>
        <p className="eyebrow">Private operator access</p>
        <h1 id="login-title">TCF Command Centre</h1>
        <p className="login-copy">Your businesses, money, audience, priorities and automations—one secure operating view.</p>
        <AuthForm />
        <p className="login-foot">No public registration. Owner access is managed in Supabase Auth.</p>
      </section>
    </main>
  );
}
