import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Brain, LayoutDashboard, MessageSquare, Star, TrendingUp, Users, ChefHat, Package, Megaphone, Target, Activity, Lock, LogOut } from "lucide-react";
import { signOut } from "@/lib/auth";

const MODULES = [
  { title: "Executive Brief", to: "/dashboard", icon: LayoutDashboard, ready: true },
  { title: "Restaurant Copilot", to: "/copilot", icon: Brain, ready: true },
  { title: "Review Intelligence", to: "/reviews", icon: Star, ready: true },
] as const;

const COMING = [
  { title: "Demand Forecasting", icon: TrendingUp },
  { title: "Staff Intelligence", icon: Users },
  { title: "Menu Intelligence", icon: ChefHat },
  { title: "Kitchen Intelligence", icon: Activity },
  { title: "Inventory & Waste", icon: Package },
  { title: "Customer Intelligence", icon: Users },
  { title: "Marketing", icon: Megaphone },
  { title: "Competitor Intel", icon: Target },
] as const;

export function AppSidebar({ restaurantName }: { restaurantName?: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border/60 bg-background p-3 md:flex">
      <Link to="/dashboard" className="mb-6 flex items-center gap-2 px-2 pt-2">
        <div className="grid h-8 w-8 place-items-center rounded-md gradient-amber text-sm font-bold text-ink">S</div>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight">SecondBite AI</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Restaurant OS</div>
        </div>
      </Link>

      {restaurantName && (
        <div className="mb-4 rounded-lg border border-border/60 bg-secondary/50 px-3 py-2 text-xs">
          <div className="text-muted-foreground">Workspace</div>
          <div className="mt-0.5 truncate font-medium text-foreground">{restaurantName}</div>
        </div>
      )}

      <div className="mb-2 px-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        Command Center
      </div>
      <nav className="space-y-0.5">
        {MODULES.map((m) => {
          const active = pathname === m.to;
          return (
            <Link
              key={m.to}
              to={m.to}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                active
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              }`}
            >
              <m.icon className="h-4 w-4" />
              <span>{m.title}</span>
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-500" />}
            </Link>
          );
        })}
      </nav>

      <div className="mb-2 mt-6 flex items-center justify-between px-2">
        <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          AI Modules
        </span>
        <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
          Q1 rollout
        </span>
      </div>
      <nav className="space-y-0.5">
        {COMING.map((m) => (
          <div
            key={m.title}
            className="flex cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground/60"
            title="Rolling out — request access from the Executive Brief"
          >
            <m.icon className="h-4 w-4" />
            <span>{m.title}</span>
            <Lock className="ml-auto h-3 w-3" />
          </div>
        ))}
      </nav>

      <div className="mt-auto space-y-2 pt-6">
        <div className="rounded-xl border border-amber-500/30 bg-amber-50/60 p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-amber-700">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            AI Online
          </div>
          <div className="mt-1 text-xs text-foreground/70">
            Gemini 3 · streaming · India context
          </div>
        </div>
        <button
          onClick={async () => { await signOut(); navigate({ to: "/" }); }}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground transition hover:bg-secondary/60 hover:text-foreground"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

export function MobileTopbar({ restaurantName }: { restaurantName?: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex items-center justify-between border-b border-border/60 bg-background px-4 py-3 md:hidden">
      <div className="flex items-center gap-2">
        <div className="grid h-7 w-7 place-items-center rounded-md gradient-amber text-[11px] font-bold text-ink">S</div>
        <div>
          <div className="text-sm font-semibold">SecondBite AI</div>
          {restaurantName && <div className="text-[10px] text-muted-foreground">{restaurantName}</div>}
        </div>
      </div>
      <nav className="flex gap-1 text-xs">
        {MODULES.map((m) => (
          <Link key={m.to} to={m.to} className={`rounded-md px-2 py-1 ${pathname === m.to ? "bg-secondary text-foreground" : "text-muted-foreground"}`}>
            {m.title.split(" ")[0]}
          </Link>
        ))}
      </nav>
    </div>
  );
}
