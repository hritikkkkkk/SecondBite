import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log in — SecondBite" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setError(error.message);
    else navigate({ to: "/dashboard" });
  }

  async function handleGoogle() {
    setError(null);
    const res = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (res.error) setError(res.error.message ?? "Sign-in failed");
    else if (!res.redirected) navigate({ to: "/dashboard" });
  }

  return (
    <AuthShell title="Welcome back" subtitle="Log in to your SecondBite dashboard.">
      <button
        onClick={handleGoogle}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background py-2.5 text-sm font-medium transition hover:bg-secondary"
      >
        <GoogleIcon /> Continue with Google
      </button>
      <Divider />
      <form onSubmit={handleEmail} className="space-y-3">
        <Field label="Email" type="email" value={email} onChange={setEmail} />
        <Field label="Password" type="password" value={password} onChange={setPassword} />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button
          disabled={busy}
          className="mt-2 w-full rounded-lg bg-foreground py-2.5 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Log in"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to SecondBite?{" "}
        <Link to="/signup" className="font-medium text-foreground underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen max-w-6xl px-6 lg:grid-cols-2">
        <div className="hidden flex-col justify-between border-r border-border/60 py-12 pr-12 lg:flex">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md gradient-amber text-sm font-bold text-ink">S</div>
            <span className="font-display text-xl font-semibold">SecondBite</span>
          </Link>
          <div>
            <p className="font-display text-3xl leading-tight tracking-tight">
              "We replaced three feedback tools with SecondBite and lifted repeat visits by 38% in a quarter."
            </p>
            <div className="mt-6 text-sm text-muted-foreground">— Mira Anand, GM at Gusto Bistro</div>
          </div>
          <div className="text-xs text-muted-foreground">© {new Date().getFullYear()} SecondBite</div>
        </div>
        <div className="flex items-center py-12 lg:pl-12">
          <div className="w-full max-w-sm">
            <h1 className="font-display text-3xl font-medium tracking-tight">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-8 space-y-4">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Field({
  label, type = "text", value, onChange, placeholder,
}: { label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:border-foreground focus:ring-2 focus:ring-[oklch(0.78_0.18_70/0.3)]"
      />
    </label>
  );
}

export function Divider() {
  return (
    <div className="relative my-1">
      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
      <div className="relative flex justify-center"><span className="bg-background px-2 text-xs text-muted-foreground">or continue with email</span></div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 18 18" className="h-4 w-4">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.13 4.13 0 01-1.8 2.71v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.61z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34A9 9 0 009 18z"/>
      <path fill="#FBBC05" d="M3.97 10.72A5.41 5.41 0 013.68 9c0-.6.1-1.18.29-1.72V4.94H.96A9 9 0 000 9c0 1.45.35 2.82.96 4.06l3.01-2.34z"/>
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 009 0 9 9 0 00.96 4.94L3.97 7.28C4.68 5.16 6.66 3.58 9 3.58z"/>
    </svg>
  );
}
