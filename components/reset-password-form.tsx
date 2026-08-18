"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, KeyRound, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (password.length < 12) {
      setError("Use at least 12 characters for your new password.");
      return;
    }
    if (password !== confirmation) {
      setError("The two passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      window.location.assign("/dashboard");
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Your password could not be updated.");
      setLoading(false);
    }
  }

  return (
    <form className="login-form" onSubmit={submit}>
      <label>
        <span>New password</span>
        <input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 12 characters" required minLength={12} />
      </label>
      <label>
        <span>Confirm new password</span>
        <input type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Enter it again" required minLength={12} />
      </label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary-button login-button" disabled={loading}>
        {loading ? <LoaderCircle className="spin" size={17} /> : <KeyRound size={17} />}
        {loading ? "Securing account…" : "Set new password"}
        {!loading && <ArrowRight size={17} />}
      </button>
    </form>
  );
}
