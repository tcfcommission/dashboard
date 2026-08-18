import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="forgot-password-title">
        <div className="brand-mark" aria-hidden="true"><span /></div>
        <p className="eyebrow">Owner account recovery</p>
        <h1 id="forgot-password-title">Reset your password</h1>
        <p className="login-copy">Enter the email used for TCF Command Centre. We will send a secure, single-use recovery link.</p>
        <ForgotPasswordForm />
        <Link className="auth-back-link" href="/login"><ArrowLeft size={15} /> Back to sign in</Link>
      </section>
    </main>
  );
}
