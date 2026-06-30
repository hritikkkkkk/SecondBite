import { useState } from "react";

export function StarSelector({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">{value ? `${value} / 5` : "Tap a star"}</span>
      </div>
      <div className="flex gap-1.5" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onClick={() => onChange(n)}
            className="group rounded-md p-1 transition active:scale-95"
            aria-label={`${label} ${n} stars`}
          >
            <svg
              viewBox="0 0 24 24"
              className={`h-9 w-9 transition-all ${
                n <= active
                  ? "fill-[oklch(0.78_0.18_70)] stroke-[oklch(0.55_0.15_55)] drop-shadow-[0_2px_6px_oklch(0.78_0.18_70/0.4)]"
                  : "fill-transparent stroke-border group-hover:stroke-muted-foreground"
              }`}
              strokeWidth={1.6}
            >
              <path d="M12 2.5l2.95 6.18 6.8.79-5.03 4.68 1.36 6.68L12 17.55l-6.08 3.28 1.36-6.68L2.25 9.47l6.8-.79z" strokeLinejoin="round" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
