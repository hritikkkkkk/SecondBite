import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SecondBite — The Restaurant Customer Experience Platform" },
      {
        name: "description",
        content:
          "Turn every meal into measurable signal. SecondBite captures real-time guest feedback at the table and gives operators a single command center for reviews, rewards, and revenue.",
      },
      { property: "og:title", content: "SecondBite — Restaurant Experience Platform" },
      {
        property: "og:description",
        content: "QR-powered guest feedback, AI insights, and reward redemption in one elegant dashboard.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <LogoStrip />
      <Features />
      <HowItWorks />
      <Pricing />
      <FAQ />
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 grid-fade" aria-hidden />
      <div className="relative mx-auto grid max-w-7xl gap-16 px-6 pb-24 pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:pt-28">
        <div className="animate-slide-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.78_0.18_70)] animate-pulse-glow" />
            Now in early access · 200+ venues
          </span>
          <h1 className="mt-6 font-display text-5xl font-medium leading-[0.95] tracking-tight md:text-7xl">
            The customer experience{" "}
            <span className="text-gradient-amber">command center</span>{" "}
            for restaurants.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            SecondBite captures honest guest feedback at the table, rewards loyal diners instantly, and
            surfaces the operational signals that drive your next great review.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/signup"
              className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition hover:opacity-90"
            >
              Start free — no card required
              <svg viewBox="0 0 20 20" className="h-4 w-4 transition group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 10h10M10 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <a
              href="#how"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-6 py-3 text-sm font-medium text-foreground transition hover:bg-secondary"
            >
              See it in action
            </a>
          </div>
          <div className="mt-10 flex items-center gap-6 text-xs text-muted-foreground">
            <Metric value="4.9★" label="Avg dashboard rating" />
            <span className="h-8 w-px bg-border" />
            <Metric value="38%" label="More repeat visits" />
            <span className="h-8 w-px bg-border" />
            <Metric value="< 60s" label="To collect feedback" />
          </div>
        </div>

        <PhoneMockup />
      </div>
    </section>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display text-xl font-medium text-foreground">{value}</div>
      <div className="text-[11px] uppercase tracking-wider">{label}</div>
    </div>
  );
}

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-tr from-[oklch(0.78_0.18_70/0.18)] via-transparent to-[oklch(0.6_0.18_30/0.12)] blur-2xl" aria-hidden />
      <div className="relative rounded-[2.5rem] border border-ink/15 bg-ink p-3 shadow-2xl">
        <div className="rounded-[2rem] bg-cream p-6">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>9:41</span>
            <span>•••</span>
          </div>
          <div className="mt-4 text-center">
            <div className="mx-auto h-12 w-12 rounded-full gradient-amber" />
            <div className="mt-3 font-display text-xl font-medium">Gusto Bistro</div>
            <div className="text-xs text-muted-foreground">Table 7 · Tonight</div>
          </div>
          <div className="mt-6 space-y-3">
            <Bar label="Food" />
            <Bar label="Service" />
            <Bar label="Ambience" />
          </div>
          <div className="mt-5 flex flex-wrap gap-1.5">
            {["Cosy", "Quick service", "Worth it"].map((t) => (
              <span key={t} className="rounded-full bg-secondary px-2.5 py-1 text-[11px] text-foreground">{t}</span>
            ))}
          </div>
          <button className="mt-6 w-full rounded-xl bg-foreground py-3 text-sm font-medium text-background">
            Submit & claim reward
          </button>
        </div>
      </div>
      <div className="absolute -right-6 top-12 hidden w-64 rotate-3 rounded-2xl border border-border bg-card p-4 shadow-soft lg:block">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Live · Just now</div>
        <div className="mt-2 text-sm font-medium">New 5★ review from Table 7</div>
        <div className="mt-1 text-xs text-muted-foreground">"Loved the cacio e pepe."</div>
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full bg-[oklch(0.65_0.18_145)] animate-pulse-glow" />
          <span className="text-muted-foreground">Reward SB-K4M2X issued</span>
        </div>
      </div>
    </div>
  );
}

function Bar({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-xs text-muted-foreground">{label}</span>
      <div className="flex flex-1 gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <div
            key={n}
            className={`h-2 flex-1 rounded-full ${n <= 4 ? "bg-[oklch(0.78_0.18_70)]" : "bg-border"}`}
          />
        ))}
      </div>
    </div>
  );
}

function LogoStrip() {
  return (
    <div className="border-y border-border/60 bg-surface/40">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <p className="text-center text-xs uppercase tracking-widest text-muted-foreground">
          Trusted by independent operators and growing groups
        </p>
        <div className="mt-6 grid grid-cols-2 items-center gap-8 text-center font-display text-xl text-muted-foreground/80 sm:grid-cols-3 md:grid-cols-6">
          {["Gusto", "Pinegrove", "Maison 14", "Olive&Ash", "Salt Yard", "Ember"].map((n) => (
            <span key={n} className="opacity-70">{n}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Features() {
  const items = [
    {
      title: "Frictionless QR feedback",
      body: "Guests scan, rate three dimensions, drop a tag. Done in under a minute, no app, no login.",
      icon: (
        <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h3v3h-3zM18 18h2v2h-2zM14 18h2v2h-2z" />
      ),
    },
    {
      title: "Reward on the spot",
      body: "Every submission generates a unique SB-XXXXX code your team validates in one tap.",
      icon: <path d="M12 2l2.6 6.3L21 9l-5 4.4 1.4 6.6L12 16.8 6.6 20 8 13.4 3 9l6.4-.7z" />,
    },
    {
      title: "AI that earns its keep",
      body: "We surface what your team should change next — by daypart, by section, by dish.",
      icon: <path d="M12 3v3M12 18v3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M3 12h3M18 12h3M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />,
    },
    {
      title: "Owner-grade analytics",
      body: "Beautiful trend charts, category breakdowns, daily volume — without spreadsheet gymnastics.",
      icon: <path d="M4 19V5M4 19h16M8 15v-4M12 15V9M16 15v-7" />,
    },
  ];
  return (
    <section id="features" className="mx-auto max-w-7xl px-6 py-24">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Built for operators</p>
        <h2 className="mt-3 font-display text-4xl font-medium tracking-tight md:text-5xl">
          Everything you need to run a five-star floor.
        </h2>
      </div>
      <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {items.map((it) => (
          <div key={it.title} className="group rounded-2xl border border-border bg-card p-6 transition hover:border-foreground/20 hover:shadow-soft">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-foreground">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                {it.icon}
              </svg>
            </div>
            <h3 className="mt-5 font-display text-lg font-medium">{it.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{it.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", t: "Place your QR", d: "Print and clip it to the bill folder, the menu, or the receipt." },
    { n: "02", t: "Guests rate in 60 seconds", d: "Three ratings, smart tags, and an optional note." },
    { n: "03", t: "Reward + retain", d: "Issue a one-time code redeemable on their next visit." },
  ];
  return (
    <section id="how" className="border-y border-border/60 bg-surface/50">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <h2 className="max-w-2xl font-display text-4xl font-medium tracking-tight md:text-5xl">
          Set up before service. Insight by dessert.
        </h2>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="rounded-2xl border border-border bg-background p-8">
              <div className="font-display text-5xl text-gradient-amber">{s.n}</div>
              <h3 className="mt-6 font-display text-xl font-medium">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    {
      name: "Starter",
      price: "Free",
      tag: "For single-location restaurants getting started.",
      features: ["Up to 100 reviews / mo", "QR code generator", "Email support"],
      cta: "Get started",
      highlight: false,
    },
    {
      name: "Growth",
      price: "$49",
      tag: "Everything you need to run service at a higher bar.",
      features: ["Unlimited reviews", "AI insights & weekly digest", "Reward redemption terminal", "Custom branding"],
      cta: "Start 14-day trial",
      highlight: true,
    },
    {
      name: "Group",
      price: "Talk to us",
      tag: "Multi-location, SSO, and dedicated success.",
      features: ["Unlimited locations", "Roles & permissions", "SLA + dedicated CSM"],
      cta: "Contact sales",
      highlight: false,
    },
  ];
  return (
    <section id="pricing" className="mx-auto max-w-7xl px-6 py-24">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Pricing</p>
        <h2 className="mt-3 font-display text-4xl font-medium tracking-tight md:text-5xl">
          Honest pricing. No per-seat surprises.
        </h2>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`rounded-2xl border p-8 ${
              p.highlight
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-lg">{p.name}</span>
              {p.highlight && (
                <span className="rounded-full bg-[oklch(0.78_0.18_70)] px-2.5 py-0.5 text-[11px] font-medium text-ink">
                  Most popular
                </span>
              )}
            </div>
            <div className="mt-6">
              <span className="font-display text-5xl font-medium">{p.price}</span>
              {p.price !== "Free" && p.price !== "Talk to us" && (
                <span className={p.highlight ? "text-background/70" : "text-muted-foreground"}>/ mo</span>
              )}
            </div>
            <p className={`mt-2 text-sm ${p.highlight ? "text-background/70" : "text-muted-foreground"}`}>{p.tag}</p>
            <ul className="mt-6 space-y-2 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/signup"
              className={`mt-8 inline-flex w-full items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium transition ${
                p.highlight
                  ? "bg-[oklch(0.78_0.18_70)] text-ink hover:opacity-90"
                  : "border border-border bg-background text-foreground hover:bg-secondary"
              }`}
            >
              {p.cta}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

function FAQ() {
  const qs = [
    ["Do my guests need an app?", "No. They scan the QR with their phone camera. The review form loads instantly — no app, no account."],
    ["Can I export my reviews?", "Yes, every plan exports to CSV. Group plans add scheduled email digests and webhooks."],
    ["What happens if a reward code is misused?", "Each code is one-time and tied to a single review. Your team marks it redeemed in the dashboard."],
    ["Is feedback anonymous?", "By default, yes. Guests can choose to leave a name or email if they want a personal follow-up."],
  ];
  return (
    <section className="border-t border-border/60 bg-surface/40">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 md:grid-cols-[1fr_2fr]">
        <h2 className="font-display text-3xl font-medium tracking-tight md:text-4xl">Frequently asked.</h2>
        <div className="divide-y divide-border">
          {qs.map(([q, a]) => (
            <details key={q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-base font-medium">
                {q}
                <span className="text-muted-foreground transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-muted-foreground md:flex-row">
        <div className="flex items-center gap-2">
          <div className="grid h-6 w-6 place-items-center rounded gradient-amber text-[11px] font-bold text-ink">S</div>
          <span>© {new Date().getFullYear()} SecondBite</span>
        </div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-foreground">Privacy</a>
          <a href="#" className="hover:text-foreground">Terms</a>
          <a href="mailto:hello@secondbite.app" className="hover:text-foreground">hello@secondbite.app</a>
        </div>
      </div>
    </footer>
  );
}
