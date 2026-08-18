"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, LoaderCircle, LockKeyhole } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <form className="login-form" onSubmit={submit}>
      <label>
        <span>Email</span>
        <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="owner@tcf…" required />
      </label>
      <label>
        <span>Password</span>
        <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your Supabase password" required minLength={8} />
      </label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary-button login-button" disabled={loading}>
        {loading ? <LoaderCircle className="spin" size={17} /> : <LockKeyhole size={17} />}
        {loading ? "Signing in…" : "Enter command centre"}
        {!loading && <ArrowRight size={17} />}
      </button>
    </form>
  );
}
