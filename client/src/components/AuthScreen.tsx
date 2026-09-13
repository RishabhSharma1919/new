import { type FormEvent, useState } from "react";

type Props = {
  onSubmit: (
    payload: { name?: string; email: string; password: string },
    mode: "login" | "register",
  ) => Promise<void>;
};

const DEMO_ACCOUNTS = [
  { name: "Arya Patel", role: "Product Lead", email: "arya@example.com", avatar: "AP", color: "#0f766e" },
  { name: "Zoe Kim", role: "Design Specialist", email: "zoe@example.com", avatar: "ZK", color: "#b45309" },
  { name: "Liam Chen", role: "Senior Engineer", email: "liam@example.com", avatar: "LC", color: "#7c3aed" },
];

export function AuthScreen({ onSubmit }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const passwordStrength = getPasswordStrength(password);
  const strengthLabels = ["Very weak", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["#f87168", "#f87168", "#d3a90a", "#579dff", "#22a06b"];

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (mode === "register" && !cleanName) {
      setError("Please enter your full name.");
      return;
    }

    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setError("Please provide a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setBusy(true);
    try {
      await onSubmit({ name: cleanName, email: cleanEmail, password }, mode);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not sign in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function handleDemoLogin(demoEmail: string, demoName: string) {
    setMode("login");
    setEmail(demoEmail);
    setPassword("password123");
    setName(demoName);
    setError(null);
  }

  return (
    <main className="auth-page">
      <section className="auth-hero">
        <div className="brand-mark">W</div>
        <p className="workspace-view__eyebrow">HIGH-PERFORMANCE WORKSPACE</p>
        <h1>Work moves faster when teams share the same context.</h1>
        <p>
          Working Place brings boards, planning views, card details, and team activity into a calm project workspace.
        </p>

        <div className="auth-feature-list">
          <span>Real-time boards</span>
          <span>Command palette</span>
          <span>Kanban, calendar, and planner views</span>
          <span>Light and dark themes</span>
        </div>

        <div className="auth-demo-picker">
          <p className="auth-demo-picker__title">
            <span>Quick demo accounts</span>
            <small>Password: password123</small>
          </p>
          <div className="auth-demo-grid">
            {DEMO_ACCOUNTS.map((demo) => (
              <button
                key={demo.email}
                type="button"
                className="auth-demo-card"
                onClick={() => handleDemoLogin(demo.email, demo.name)}
              >
                <span className="avatar-chip" style={{ backgroundColor: demo.color }}>
                  {demo.avatar}
                </span>
                <span className="auth-demo-card__info">
                  <strong>{demo.name}</strong>
                  <span>{demo.role}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="auth-card" aria-label="Authentication form">
        <div className="auth-card__brand">
          <div className="brand-mark">W</div>
          <div>
            <strong>Working Place</strong>
            <span className="auth-card__badge">Secure</span>
          </div>
        </div>

        <h2>{mode === "register" ? "Create your account" : "Welcome back"}</h2>
        <p>
          {mode === "register"
            ? "Create a protected workspace account and start organizing your boards."
            : "Sign in to continue working with your team boards."}
        </p>

        <form onSubmit={submit} className="auth-form">
          {mode === "register" ? (
            <label className="field">
              <span>Full name</span>
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Sarah Connor"
                autoComplete="name"
              />
            </label>
          ) : null}

          <label className="field">
            <span>Work email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
            />
          </label>

          <label className="field">
            <span className="auth-password-label">
              Password
              <button
                type="button"
                className="auth-toggle-pwd"
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </span>
            <input
              required
              minLength={8}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              autoComplete={mode === "register" ? "new-password" : "current-password"}
            />
          </label>

          {mode === "register" && password ? (
            <div className="pwd-strength-container">
              <div className="pwd-strength-bars">
                {[1, 2, 3, 4].map((step) => (
                  <span
                    key={step}
                    className="pwd-strength-bar"
                    style={{
                      backgroundColor: passwordStrength >= step ? strengthColors[passwordStrength] : undefined,
                    }}
                  />
                ))}
              </div>
              <span style={{ color: strengthColors[passwordStrength] }} className="pwd-strength-label">
                {strengthLabels[passwordStrength]}
              </span>
            </div>
          ) : null}

          {error ? (
            <div className="auth-error-banner">
              <span>{error}</span>
            </div>
          ) : null}

          <button className="primary-button auth-submit" disabled={busy} type="submit">
            {busy ? "Authenticating..." : mode === "register" ? "Create account" : "Sign in to workspace"}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button
          className="auth-switch-btn"
          onClick={() => {
            setMode(mode === "register" ? "login" : "register");
            setError(null);
          }}
          type="button"
        >
          {mode === "register" ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>
      </section>
    </main>
  );
}

function getPasswordStrength(password: string) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}
