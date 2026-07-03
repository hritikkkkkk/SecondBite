import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

export function Navbar() {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-[13px] font-bold text-black">
            SB
          </div>
          <div className="leading-tight">
            <span className="block font-display text-lg font-semibold tracking-tight">SecondBite AI</span>
            <span className="block text-[9px] uppercase tracking-widest text-muted-foreground">Restaurant OS</span>
          </div>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#modules" className="transition hover:text-foreground">Modules</a>
          <a href="#how" className="transition hover:text-foreground">How it works</a>
          <a href="#pricing" className="transition hover:text-foreground">Pricing</a>
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              to="/dashboard"
              className="rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background transition hover:opacity-90"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-sm text-muted-foreground transition hover:text-foreground">
                Log in
              </Link>
              <Link
                to="/signup"
                className="rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background transition hover:opacity-90"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
