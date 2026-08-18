"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, LoaderCircle, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (resetError) throw resetError;
      setSent(true);
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Password recovery could not be started.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="auth-success" role="status">
        <Mail size={20} />
        <div>
          <strong>Check your email</strong>
          <p>If that address belongs to the owner account, a secure password-reset link is on its way.</p>
        </div>
      </div>
    );
  }

  return (
    <form className="login-form" onSubmit={submit}>
      <label>
        <span>Email</span>
        <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Owner email address" required />
      </label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary-button login-button" disabled={loading}>
        {loading ? <LoaderCircle className="spin" size={17} /> : <Mail size={17} />}
        {loading ? "Sending secure link…" : "Send password-reset link"}
        {!loading && <ArrowRight size={17} />}
      </button>
    </form>
  );
}
