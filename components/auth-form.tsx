"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, ExternalLink, LoaderCircle, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function AuthForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function sendEmailLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ownerEmail = email.trim().toLowerCase();
    if (!ownerEmail) {
      setError("Enter the owner email address first.");
      return;
    }

    setEmailLoading(true);
    setEmailSent(false);
    setError("");
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: ownerEmail,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (authError) throw authError;
      setEmail(ownerEmail);
      setEmailSent(true);
    } catch (authError) {
      const message = authError instanceof Error ? authError.message.toLowerCase() : "";
      if (message.includes("rate limit") || message.includes("only request")) {
        setError("A sign-in email was already requested. Open Gmail and use the newest link. If it is not there, wait a few minutes, then refresh this page once.");
      } else if (message.includes("signup") || message.includes("not allowed")) {
        setError("That email is not enabled for private owner access.");
      } else {
        setError("The sign-in email could not be sent. Check the address and try once more.");
      }
    } finally {
      setEmailLoading(false);
    }
  }

  return (
    <form className="login-form" onSubmit={sendEmailLink}>
      <label>
        <span>Email</span>
        <input
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setError("");
          }}
          placeholder="tcfcommission@gmail.com"
          disabled={emailSent}
          required
        />
      </label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary-button login-button" disabled={emailLoading || emailSent}>
        {emailLoading ? <LoaderCircle className="spin" size={17} /> : <Mail size={17} />}
        {emailLoading ? "Sending your link…" : emailSent ? "Sign-in link sent" : "Email me a sign-in link"}
        {!emailLoading && !emailSent && <ArrowRight size={17} />}
      </button>
      {emailSent && <>
        <p className="form-success" role="status">Link sent. Open the newest TCF sign-in email and click it once. No password is required.</p>
        <a className="ghost-button auth-email-button" href="https://mail.google.com/mail/u/0/#inbox" target="_blank" rel="noreferrer">
          <Mail size={17} />
          Open Gmail
          <ExternalLink size={15} />
        </a>
      </>}
    </form>
  );
}
