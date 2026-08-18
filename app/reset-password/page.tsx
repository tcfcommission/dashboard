import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { createClient } from "@/lib/supabase/server";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?recovery=expired");

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="reset-password-title">
        <div className="brand-mark" aria-hidden="true"><span /></div>
        <p className="eyebrow">Secure owner access</p>
        <h1 id="reset-password-title">Choose a new password</h1>
        <p className="login-copy">Your recovery link has been verified. Set a strong password to enter TCF Command Centre.</p>
        <ResetPasswordForm />
        <p className="login-foot">This recovery session expires automatically.</p>
      </section>
    </main>
  );
}
