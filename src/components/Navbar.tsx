import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

export function Navbar() {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-md gradient-amber text-[15px] font-bold text-ink">
            S
          </div>
          <span className="font-display text-xl font-semibold tracking-tight">SecondBite</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#features" className="transition hover:text-foreground">Features</a>
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
