import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Ticket, ScanLine, Search, CheckCircle2, XCircle, Clock, AlertTriangle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/coupons")({
  head: () => ({ meta: [{ title: "Coupon Verification — SecondBite AI" }] }),
  component: CouponsPage,
});

// Reward validity window (days) from issue date.
const EXPIRY_DAYS = 30;
const REWARD_LABEL = "10% off next visit";

type Row = {
  id: string;
  reward_code: string;
  reward_redeemed: boolean;
  created_at: string;
  comment: string | null;
  rating_food: number;
  rating_service: number;
  rating_ambience: number;
  updated_at?: string | null;
};

type Status = "active" | "used" | "expired" | "invalid";

type Coupon = {
  id: string;
  code: string;
  customer: string;
  reward: string;
  issued: Date;
  expiry: Date;
  status: Status;
  redeemedAt: Date | null;
  raw: Row;
};

function toCoupon(r: Row): Coupon {
  const issued = new Date(r.created_at);
  const expiry = new Date(issued.getTime() + EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  const now = Date.now();
  let status: Status;
  if (r.reward_redeemed) status = "used";
  else if (expiry.getTime() < now) status = "expired";
  else status = "active";
  return {
    id: r.id,
    code: r.reward_code,
    customer: "Guest reviewer",
    reward: REWARD_LABEL,
    issued,
    expiry,
    status,
    redeemedAt: r.reward_redeemed ? new Date(r.updated_at ?? r.created_at) : null,
    raw: r,
  };
}

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const fmtTime = (d: Date) =>
  d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

function statusPill(status: Status) {
  const map: Record<Status, { label: string; cls: string; icon: React.ReactNode }> = {
    active: {
      label: "Active",
      cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    },
    used: {
      label: "Used",
      cls: "bg-rose-500/10 text-rose-400 border-rose-500/30",
      icon: <XCircle className="h-3.5 w-3.5" />,
    },
    expired: {
      label: "Expired",
      cls: "bg-muted text-muted-foreground border-border",
      icon: <Clock className="h-3.5 w-3.5" />,
    },
    invalid: {
      label: "Invalid",
      cls: "bg-orange-500/10 text-orange-400 border-orange-500/30",
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
    },
  };
  const s = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${s.cls}`}>
      {s.icon}
      {s.label}
    </span>
  );
}

function CouponsPage() {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<Coupon | { status: "invalid"; code: string } | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [filter, setFilter] = useState<"all" | Status>("all");

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: r } = await supabase
        .from("restaurants")
        .select("id")
        .eq("owner_id", u.user.id)
        .maybeSingle();
      if (!r) {
        setLoading(false);
        return;
      }
      setRestaurantId(r.id);
      await loadCoupons(r.id);
    })();
  }, []);

  async function loadCoupons(rid: string) {
    setLoading(true);
    const { data } = await supabase
      .from("reviews")
      .select("id, reward_code, reward_redeemed, created_at, comment, rating_food, rating_service, rating_ambience")
      .eq("restaurant_id", rid)
      .order("created_at", { ascending: false })
      .limit(200);
    setCoupons(((data ?? []) as Row[]).map(toCoupon));
    setLoading(false);
  }

  function showToast(t: { type: "success" | "error"; msg: string }) {
    setToast(t);
    setTimeout(() => setToast(null), 3200);
  }

  async function verify() {
    const code = query.trim().toUpperCase();
    if (!code) return;
    setVerifying(true);
    setResult(null);
    // Search local list first (already scoped to this restaurant by RLS on load)
    const found = coupons.find((c) => c.code.toUpperCase() === code);
    if (found) {
      setResult(found);
    } else if (restaurantId) {
      // Fallback fetch in case it was issued after last load
      const { data } = await supabase
        .from("reviews")
        .select("id, reward_code, reward_redeemed, created_at, comment, rating_food, rating_service, rating_ambience")
        .eq("restaurant_id", restaurantId)
        .eq("reward_code", code)
        .maybeSingle();
      if (data) setResult(toCoupon(data as Row));
      else setResult({ status: "invalid", code });
    } else {
      setResult({ status: "invalid", code });
    }
    setVerifying(false);
  }

  async function redeem() {
    if (!result || !("id" in result)) return;
    setRedeeming(true);
    const { error } = await supabase
      .from("reviews")
      .update({ reward_redeemed: true })
      .eq("id", result.id);
    setRedeeming(false);
    setConfirmOpen(false);
    if (error) {
      showToast({ type: "error", msg: "Could not redeem coupon. Please try again." });
      return;
    }
    const updated: Coupon = {
      ...result,
      status: "used",
      redeemedAt: new Date(),
      raw: { ...result.raw, reward_redeemed: true },
    };
    setResult(updated);
    setCoupons((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    showToast({ type: "success", msg: "Coupon redeemed successfully." });
  }

  const filtered = useMemo(
    () => (filter === "all" ? coupons : coupons.filter((c) => c.status === filter)),
    [coupons, filter],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <header className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-500/10 text-amber-400">
          <Ticket className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Coupon Verification</h1>
          <p className="text-xs text-muted-foreground">
            Verify and redeem guest reward codes at the counter.
          </p>
        </div>
      </header>

      {/* Search */}
      <section className="rounded-xl border border-border/60 bg-card p-4 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && verify()}
              placeholder="Enter coupon code (e.g. SB-A7X9K)"
              className="h-12 w-full rounded-lg border border-border bg-background pl-10 pr-3 text-base tracking-wider outline-none placeholder:text-muted-foreground focus:border-amber-500/60"
            />
          </div>
          <Button
            onClick={verify}
            disabled={verifying || !query.trim()}
            className="h-12 min-w-[120px] bg-amber-500 text-ink hover:bg-amber-400"
          >
            {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
          </Button>
          <Button
            variant="outline"
            disabled
            title="QR scanning coming soon"
            className="h-12 gap-2"
          >
            <ScanLine className="h-4 w-4" /> Scan QR
          </Button>
        </div>
      </section>

      {/* Result */}
      {result && (
        <section className="animate-in fade-in-50 slide-in-from-top-2">
          {"id" in result ? (
            <CouponCard
              c={result}
              onRedeemClick={() => setConfirmOpen(true)}
            />
          ) : (
            <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-6">
              <div className="mb-2 flex items-center gap-2 text-orange-400">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-semibold">Coupon not found.</span>
              </div>
              <p className="text-sm text-muted-foreground">
                We couldn't find code <span className="font-mono text-foreground">{result.code}</span>.
                Please check and try again.
              </p>
            </div>
          )}
        </section>
      )}

      {/* History */}
      <section className="rounded-xl border border-border/60 bg-card">
        <div className="flex flex-col gap-3 border-b border-border/60 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-sm font-semibold">Coupon History</h2>
            <p className="text-xs text-muted-foreground">
              {coupons.length} total • scoped to this restaurant
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(["all", "active", "used", "expired"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full border px-3 py-1 text-xs capitalize transition ${
                  filter === f
                    ? "border-amber-500/60 bg-amber-500/10 text-amber-400"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Offer</th>
                <th className="px-4 py-3">Issued</th>
                <th className="px-4 py-3">Expiry</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Redeemed</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                    No coupons in this view yet.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="border-b border-border/40 last:border-0 hover:bg-secondary/40">
                    <td className="px-4 py-3 font-mono text-xs">{c.code}</td>
                    <td className="px-4 py-3">{c.customer}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.reward}</td>
                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(c.issued)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(c.expiry)}</td>
                    <td className="px-4 py-3">{statusPill(c.status)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.redeemedAt ? `${fmtDate(c.redeemedAt)} ${fmtTime(c.redeemedAt)}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setQuery(c.code);
                          setResult(c);
                        }}
                        className="text-xs text-amber-400 hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redeem this coupon?</DialogTitle>
            <DialogDescription>
              This will mark the coupon as used. It cannot be redeemed again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={redeeming}>
              Cancel
            </Button>
            <Button
              onClick={redeem}
              disabled={redeeming}
              className="bg-amber-500 text-ink hover:bg-amber-400"
            >
              {redeeming ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Redeem"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-lg border px-4 py-3 text-sm shadow-lg animate-in slide-in-from-bottom-4 ${
            toast.type === "success"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              : "border-rose-500/40 bg-rose-500/10 text-rose-300"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function CouponCard({ c, onRedeemClick }: { c: Coupon; onRedeemClick: () => void }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-6">
      {c.status === "active" && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-300">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-medium">Coupon is valid.</span>
        </div>
      )}
      {c.status === "used" && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-rose-300">
          <XCircle className="h-5 w-5" />
          <span className="font-medium">This coupon has already been used.</span>
        </div>
      )}
      {c.status === "expired" && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3 text-muted-foreground">
          <Clock className="h-5 w-5" />
          <span className="font-medium">This coupon expired on {fmtDate(c.expiry)}.</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-3">
        <Field label="Coupon Code" value={<span className="font-mono text-base">{c.code}</span>} />
        <Field label="Customer" value={c.customer} />
        <Field label="Reward" value={c.reward} />
        <Field label="Date Issued" value={fmtDate(c.issued)} />
        <Field label="Expiry Date" value={fmtDate(c.expiry)} />
        <Field label="Status" value={statusPill(c.status)} />
        {c.status === "used" && c.redeemedAt && (
          <>
            <Field label="Redeemed Date" value={fmtDate(c.redeemedAt)} />
            <Field label="Redeemed Time" value={fmtTime(c.redeemedAt)} />
            <Field label="Redeemed By" value={<span className="text-muted-foreground">Staff (coming soon)</span>} />
          </>
        )}
      </div>

      {c.status === "active" && (
        <div className="mt-6 border-t border-border/60 pt-5">
          <Button
            onClick={onRedeemClick}
            className="h-12 w-full bg-amber-500 text-base font-semibold text-ink hover:bg-amber-400 md:w-auto md:px-8"
          >
            Redeem Coupon
          </Button>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm text-foreground">{value}</div>
    </div>
  );
}
