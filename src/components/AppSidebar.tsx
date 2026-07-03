import { Link, useRouterState } from "@tanstack/react-router";
import { Brain, LayoutDashboard, MessageSquare, Star, TrendingUp, Users, ChefHat, Package, Megaphone, Target, Activity, Lock, LogOut } from "lucide-react";
import { signOut } from "@/lib/auth";
import { useNavigate } from "@tanstack/react-router";

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
    <aside className="hidden w-64 shrink-0 flex-col border-r border-white/5 bg-[oklch(0.13_0.008_60)] p-3 text-white/90 md:flex">
      <Link to="/dashboard" className="mb-6 flex items-center gap-2 px-2 pt-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-bold text-black">
          SB
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight">SecondBite AI</div>
          <div className="text-[10px] uppercase tracking-widest text-white/40">Restaurant OS</div>
        </div>
      </Link>

      {restaurantName && (
        <div className="mb-4 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-xs">
          <div className="text-white/40">Workspace</div>
          <div className="mt-0.5 truncate font-medium text-white">{restaurantName}</div>
        </div>
      )}

      <div className="mb-2 px-2 text-[10px] font-medium uppercase tracking-widest text-white/40">
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
                  ? "bg-white/[0.08] text-white"
                  : "text-white/60 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <m.icon className="h-4 w-4" />
              <span>{m.title}</span>
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-400" />}
            </Link>
          );
        })}
      </nav>

      <div className="mb-2 mt-6 flex items-center justify-between px-2">
        <span className="text-[10px] font-medium uppercase tracking-widest text-white/40">
          AI Modules
        </span>
        <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] font-medium text-white/50">
          Q1 rollout
        </span>
      </div>
      <nav className="space-y-0.5">
        {COMING.map((m) => (
          <div
            key={m.title}
            className="flex cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-white/30"
            title="Rolling out — request access from the Executive Brief"
          >
            <m.icon className="h-4 w-4" />
            <span>{m.title}</span>
            <Lock className="ml-auto h-3 w-3" />
          </div>
        ))}
      </nav>

      <div className="mt-auto space-y-2 pt-6">
        <div className="rounded-xl border border-amber-400/20 bg-gradient-to-br from-amber-400/10 to-orange-500/5 p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            AI Online
          </div>
          <div className="mt-1 text-xs text-white/70">
            Gemini 3 · streaming · India context
          </div>
        </div>
        <button
          onClick={async () => { await signOut(); navigate({ to: "/" }); }}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-white/50 transition hover:bg-white/[0.04] hover:text-white"
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
    <div className="flex items-center justify-between border-b border-white/5 bg-[oklch(0.13_0.008_60)] px-4 py-3 text-white md:hidden">
      <div className="flex items-center gap-2">
        <div className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-amber-400 to-orange-500 text-[11px] font-bold text-black">SB</div>
        <div>
          <div className="text-sm font-semibold">SecondBite AI</div>
          {restaurantName && <div className="text-[10px] text-white/40">{restaurantName}</div>}
        </div>
      </div>
      <nav className="flex gap-1 text-xs">
        {MODULES.map((m) => (
          <Link key={m.to} to={m.to} className={`rounded-md px-2 py-1 ${pathname === m.to ? "bg-white/10 text-white" : "text-white/50"}`}>
            {m.title.split(" ")[0]}
          </Link>
        ))}
      </nav>
    </div>
  );
}
