import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { generateRestaurantSlug } from "@/lib/auth";
import { AuthShell, Field, Divider } from "./login";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — SecondBite" }] }),
  component: SignupPage,
});

type Step = "account" | "restaurant" | "qr";

function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("account");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Account
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Restaurant
  const [restName, setRestName] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [hours, setHours] = useState("Tue–Sun, 5pm–11pm");

  // Result
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);

  async function handleAccount(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const redirect = `${window.location.origin}/dashboard`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirect, data: { full_name: fullName } },
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    // Email confirmation may be disabled by default in Lovable Cloud → session present.
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) {
      setError("Check your email to confirm your account, then log in.");
      return;
    }
    setStep("restaurant");
  }

  async function handleGoogle() {
    setError(null);
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res.error) setError(res.error.message ?? "Sign-in failed");
    // If we get back a session in-iframe we still need to onboard — push to /dashboard which will
    // redirect to onboarding if no restaurant exists. For simplicity, let the user re-enter signup
    // post-Google to add restaurant details, or send them straight to dashboard onboarding step.
    else if (!res.redirected) setStep("restaurant");
  }

  async function handleRestaurant(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { data: s } = await supabase.auth.getUser();
    if (!s.user) {
      setBusy(false);
      setError("Session expired. Please log in.");
      return;
    }
    const slug = generateRestaurantSlug(restName);
    const { data, error } = await supabase
      .from("restaurants")
      .insert({
        slug,
        owner_id: s.user.id,
        name: restName,
        cuisine,
        address,
        phone,
        opening_hours: hours,
      })
      .select()
      .single();
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setCreatedSlug(data.slug);
    setStep("qr");
  }

  if (step === "qr" && createdSlug) {
    const reviewUrl = `${window.location.origin}/review/${createdSlug}`;
    return (
      <AuthShell title="You're live." subtitle="Here's your unique review link and QR code. Print it, prop it on the table, you're in business.">
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <QRPreview value={reviewUrl} />
          <div className="mt-4 break-all rounded-lg bg-secondary p-3 text-xs text-foreground">{reviewUrl}</div>
          <div className="mt-2 text-xs text-muted-foreground">Restaurant ID: <code className="font-mono">{createdSlug}</code></div>
        </div>
        <button
          onClick={() => navigate({ to: "/dashboard" })}
          className="w-full rounded-lg bg-foreground py-2.5 text-sm font-medium text-background transition hover:opacity-90"
        >
          Go to dashboard →
        </button>
      </AuthShell>
    );
  }

  if (step === "restaurant") {
    return (
      <AuthShell title="Tell us about your venue" subtitle="We'll generate your QR and dashboard in a moment.">
        <form onSubmit={handleRestaurant} className="space-y-3">
          <Field label="Restaurant name" value={restName} onChange={setRestName} placeholder="Gusto Bistro" />
          <Field label="Cuisine" value={cuisine} onChange={setCuisine} placeholder="Modern Italian" />
          <Field label="Address" value={address} onChange={setAddress} placeholder="14 Hawthorn St, London" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone" value={phone} onChange={setPhone} placeholder="+44 …" />
            <Field label="Opening hours" value={hours} onChange={setHours} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            disabled={busy}
            className="mt-2 w-full rounded-lg bg-foreground py-2.5 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create my dashboard"}
          </button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Create your account" subtitle="Two minutes. No credit card.">
      <button
        onClick={handleGoogle}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background py-2.5 text-sm font-medium transition hover:bg-secondary"
      >
        Continue with Google
      </button>
      <Divider />
      <form onSubmit={handleAccount} className="space-y-3">
        <Field label="Your name" value={fullName} onChange={setFullName} placeholder="Mira Anand" />
        <Field label="Work email" type="email" value={email} onChange={setEmail} />
        <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="At least 8 characters" />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button
          disabled={busy}
          className="mt-2 w-full rounded-lg bg-foreground py-2.5 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Creating…" : "Continue"}
        </button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-foreground hover:underline">Log in</Link>
      </p>
    </AuthShell>
  );
}

export function QRPreview({ value, color = "#1a1410" }: { value: string; color?: string }) {
  // Deterministic decorative QR-style grid (not a real QR — preview only)
  const size = 21;
  const seed = Array.from(value).reduce((a, c) => a + c.charCodeAt(0), 0);
  const cells: boolean[] = [];
  let s = seed;
  for (let i = 0; i < size * size; i++) {
    s = (s * 9301 + 49297) % 233280;
    cells.push(s / 233280 > 0.5);
  }
  const isFinder = (x: number, y: number) => {
    const inBox = (x0: number, y0: number) => x >= x0 && x < x0 + 7 && y >= y0 && y < y0 + 7;
    return inBox(0, 0) || inBox(size - 7, 0) || inBox(0, size - 7);
  };
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto h-48 w-48">
      <rect width={size} height={size} fill="white" />
      {cells.map((on, i) => {
        const x = i % size;
        const y = Math.floor(i / size);
        if (isFinder(x, y)) return null;
        if (!on) return null;
        return <rect key={i} x={x} y={y} width={1} height={1} fill={color} />;
      })}
      {[[0, 0], [size - 7, 0], [0, size - 7]].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width={7} height={7} fill={color} />
          <rect x={x + 1} y={y + 1} width={5} height={5} fill="white" />
          <rect x={x + 2} y={y + 2} width={3} height={3} fill={color} />
        </g>
      ))}
    </svg>
  );
}
