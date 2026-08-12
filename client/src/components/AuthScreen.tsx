import { type FormEvent, useState } from "react";

type Props = { onSubmit: (payload: { name?: string; email: string; password: string }, mode: "login" | "register") => Promise<void> };

export function AuthScreen({ onSubmit }: Props) {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(null); setBusy(true);
    try { await onSubmit({ name, email, password }, mode); } catch (e) { setError(e instanceof Error ? e.message : "Could not continue."); } finally { setBusy(false); }
  }
  return <main className="auth-page"><section className="auth-hero"><div className="brand-mark">W</div><p className="workspace-view__eyebrow">COLLABORATE WITH CLARITY</p><h1>Work moves better when everyone shares the same place.</h1><p>Working Place brings your team, projects, and live decisions into one focused workspace.</p><div className="auth-feature-list"><span>Live board updates</span><span>Team spaces</span><span>Focused planning</span></div></section><section className="auth-card"><div className="auth-card__brand"><div className="brand-mark">W</div><strong>Working Place</strong></div><h2>{mode === "register" ? "Create your workspace" : "Welcome back"}</h2><p>{mode === "register" ? "Start coordinating work with your team today." : "Sign in to pick up where your team left off."}</p><form onSubmit={submit} className="auth-form">{mode === "register" && <label className="field"><span>Your name</span><input required value={name} onChange={e => setName(e.target.value)} placeholder="Alex Morgan" /></label>}<label className="field"><span>Work email</span><input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" /></label><label className="field"><span>Password</span><input required minLength={8} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" /></label>{error && <p className="auth-error">{error}</p>}<button className="primary-button auth-submit" disabled={busy} type="submit">{busy ? "Please wait..." : mode === "register" ? "Create account" : "Sign in"}</button></form><button className="auth-switch" onClick={() => { setMode(mode === "register" ? "login" : "register"); setError(null); }} type="button">{mode === "register" ? "Already have an account? Sign in" : "New here? Create an account"}</button></section></main>;
}
