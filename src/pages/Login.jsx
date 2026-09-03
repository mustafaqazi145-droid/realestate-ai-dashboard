import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [mode, setMode] = useState("signin"); // "signin" | "signup"

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      // If email confirmation is required, there's no session yet.
      if (!data.session) {
        setInfo("Account created — check your email to confirm before signing in.");
      }
      // If confirmation is disabled, Supabase already returns a session and
      // onAuthStateChange in App.jsx picks it up, which triggers self_provision_org.
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
  }

  async function handleGoogleSignIn() {
    setError("");
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
    // On success, Supabase redirects to Google — no further code runs here.
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="brand">Property Console</div>
        <div className="brand-sub">Agency Sign In</div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: "10px 0",
            border: "1px solid var(--line)",
            borderRadius: 6,
            background: "#fff",
            cursor: googleLoading ? "default" : "pointer",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--ink)",
            marginBottom: 20,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4c-7.8 0-14.5 4.4-17.7 10.7z"/>
            <path fill="#4CAF50" d="M24 44c5.4 0 10.3-2.1 14-5.4l-6.5-5.4C29.4 34.9 26.8 36 24 36c-5.3 0-9.7-3.1-11.3-7.6l-6.6 5.1C9.4 39.6 16.1 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.5 5.4C41.5 36.4 44 30.7 44 24c0-1.3-.1-2.7-.4-3.5z"/>
          </svg>
          {googleLoading ? "Redirecting…" : "Sign in with Google"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
          <div style={{ fontSize: 11, color: "var(--slate)" }}>or</div>
          <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ marginBottom: 14 }}
          />
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <div className="error-text">{error}</div>}
          {info && (
            <div style={{ fontSize: 12, color: "var(--slate)", marginTop: 8 }}>{info}</div>
          )}
          <button type="submit" className="btn btn-brass" style={{ width: "100%", marginTop: 20 }} disabled={loading}>
            {loading
              ? mode === "signup" ? "Creating account…" : "Signing in…"
              : mode === "signup" ? "Sign up" : "Sign in"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "var(--slate)" }}>
          {mode === "signin" ? (
            <>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => { setMode("signup"); setError(""); setInfo(""); }}
                style={{ background: "none", border: "none", padding: 0, color: "var(--brass, #b8860b)", cursor: "pointer", fontWeight: 600 }}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => { setMode("signin"); setError(""); setInfo(""); }}
                style={{ background: "none", border: "none", padding: 0, color: "var(--brass, #b8860b)", cursor: "pointer", fontWeight: 600 }}
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
