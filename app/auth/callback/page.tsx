"use client";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function safeDestination(value: string | null) {
  return value === "/reset-password" ? value : "/dashboard";
}

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("Securing your session…");

  useEffect(() => {
    let cancelled = false;

    async function finishSignIn() {
      const url = new URL(window.location.href);
      const destination = safeDestination(url.searchParams.get("next"));
      const code = url.searchParams.get("code");
      const hash = new URLSearchParams(url.hash.slice(1));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      const supabase = createClient();

      // Remove one-time credentials from browser history before any redirect.
      const cleanUrl = destination === "/reset-password"
        ? `${url.pathname}?next=/reset-password`
        : url.pathname;
      window.history.replaceState({}, "", cleanUrl);

      let error: Error | null = null;
      if (accessToken && refreshToken) {
        ({ error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        }));
      } else if (code) {
        ({ error } = await supabase.auth.exchangeCodeForSession(code));
      } else {
        const { data, error: sessionError } = await supabase.auth.getSession();
        error = sessionError || (data.session ? null : new Error("No sign-in session was returned."));
      }

      if (cancelled) return;
      if (error) {
        setMessage("This link could not finish signing you in. Return to login and request one new link.");
        window.setTimeout(() => window.location.replace("/login?recovery=invalid"), 1800);
        return;
      }

      setMessage("Access confirmed. Opening your command centre…");
      window.location.replace(destination);
    }

    void finishSignIn();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="login-page">
      <section className="login-card" aria-live="polite">
        <div className="brand-mark" aria-hidden="true"><span /></div>
        <p className="eyebrow">Private operator access</p>
        <h1>Signing you in</h1>
        <p className="login-copy">{message}</p>
        <LoaderCircle className="spin" size={24} aria-hidden="true" />
      </section>
    </main>
  );
}
