import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ChartNoAxesCombined,
  ShieldCheck,
  Target,
  Trophy,
} from "lucide-react";
import { useAuth } from "./AuthContext.jsx";
import { Brand } from "../components/Shell.jsx";
import { ErrorMessage, Field } from "../components/ui.jsx";

export function Login() {
  const auth = useAuth();
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      await auth.login(form.get("email"), form.get("password"));
    } catch (failure) {
      setError(failure);
    } finally {
      setPending(false);
    }
  }
  return (
    <main className="login-page">
      <section className="login-story">
        <Brand />
        <div className="login-story-content">
          <span className="eyebrow">PERFORMANCE, WITH PURPOSE</span>
          <h1>
            Great work.
            <br />
            Recognized.
          </h1>
          <p>
            A clearer view of your performance. A focused path to your targets.
            Recognition for every step forward.
          </p>
          <div className="login-principles">
            <span>
              <ChartNoAxesCombined />
              Clarity in every number
            </span>
            <span>
              <Target />
              Focus on what matters
            </span>
            <span>
              <Trophy />
              Progress worth celebrating
            </span>
          </div>
          <Link
            to="/showcase"
            className="button secondary"
            style={{ marginTop: 28 }}
          >
            Explore the design series <ArrowRight size={16} />
          </Link>
        </div>
        <div className="login-story-footer">
          CHAMPIONSCLUB<span>Sales performance & incentives</span>
        </div>
      </section>
      <section className="login-form-area">
        <div className="login-card">
          <span className="eyebrow">YOUR NEXT CHAPTER</span>
          <h2>Welcome back.</h2>
          <p>Sign in to your ChampionsClub workspace.</p>
          {auth.status === "checking" ? (
            <p role="status">Verifying your session…</p>
          ) : auth.status === "error" ? (
            <ErrorMessage error={{ message: auth.error }} retry={auth.retry} />
          ) : (
            <form onSubmit={submit}>
              <Field
                label="Email address"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="you@company.com"
                required
                maxLength={160}
              />
              <Field
                label="Password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                required
                maxLength={72}
              />
              {auth.error && !error && (
                <p className="form-error" role="status">
                  {auth.error}
                </p>
              )}
              <ErrorMessage error={error} />
              <button
                className="button primary login-submit"
                disabled={pending}
              >
                {pending ? "Signing in…" : "Sign in"}
                <ArrowRight size={17} />
              </button>
            </form>
          )}
          <div className="login-security">
            <ShieldCheck size={16} />
            <span>Your workspace. Your authorized access.</span>
          </div>
          <p className="login-help">
            Need access? Contact your program coordinator.
          </p>
        </div>
        <span className="login-copyright">
          ChampionsClub · Performance made meaningful
        </span>
      </section>
    </main>
  );
}
