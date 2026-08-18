"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      window.location.assign("/dashboard");
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Sign-in failed.");
      setLoading(false);
    }
  }

  async function sendEmailLink() {
    if (!email) {
      setError("Enter the owner email address first.");
      return;
    }

    setEmailLoading(true);
    setEmailSent(false);
    setError("");
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (authError) throw authError;
      setEmailSent(true);
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "The secure sign-in link could not be sent.");
    } finally {
      setEmailLoading(false);
    }
  }

  return (
    <form className="login-form" onSubmit={(event) => {
      if (showPassword) void submit(event);
      else {
        event.preventDefault();
        void sendEmailLink();
      }
    }}>
      <label>
        <span>Email</span>
        <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="owner@tcf…" required />
      </label>
      {showPassword && <label>
        <span className="field-label-row"><span>Password</span><Link href="/forgot-password">Forgot password?</Link></span>
        <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your Supabase password" required minLength={8} />
      </label>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {showPassword ? <button className="primary-button login-button" disabled={loading || emailLoading}>
          {loading ? <LoaderCircle className="spin" size={17} /> : <LockKeyhole size={17} />}
          {loading ? "Signing in…" : "Enter command centre"}
          {!loading && <ArrowRight size={17} />}
        </button> : <button className="primary-button login-button" disabled={emailLoading || loading}>
          {emailLoading ? <LoaderCircle className="spin" size={17} /> : <Mail size={17} />}
          {emailLoading ? "Sending secure link…" : "Email me a sign-in link"}
          {!emailLoading && <ArrowRight size={17} />}
        </button>}
      {!showPassword && emailSent && <p className="form-success" role="status">Check your email and open the one-time sign-in link. No password is required.</p>}
      <div className="auth-option-divider"><span>or</span></div>
      <button type="button" className="ghost-button auth-email-button" disabled={emailLoading || loading} onClick={() => {
        setShowPassword((visible) => !visible);
        setError("");
        setEmailSent(false);
      }}>
        {showPassword ? <Mail size={17} /> : <LockKeyhole size={17} />}
        {showPassword ? "Use an email sign-in link" : "Use a password instead"}
      </button>
    </form>
  );
}
