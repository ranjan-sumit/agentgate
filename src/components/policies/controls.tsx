import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Severity } from "@/engines/ScanEngine";

/* ---------------- Toggle (snap 120ms) ---------------- */
export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex items-center gap-2 text-[13px]",
        disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
      )}
    >
      <span
        className={cn(
          "relative h-[18px] w-[32px] shrink-0 rounded-full border transition-colors duration-100",
          checked ? "border-aegis/60 bg-aegis-dim/60" : "border-line bg-bg-3",
        )}
      >
        <span
          className={cn(
            "absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full transition-all duration-100",
            checked ? "left-[17px] bg-aegis" : "left-[2px] bg-ink-low",
          )}
        />
      </span>
      {label && <span className="text-ink-mid">{label}</span>}
    </button>
  );
}

/* ---------------- Severity band slider (0/2/4/6) ---------------- */
const BANDS: Severity[] = [0, 2, 4, 6];
const BAND_LABELS: Record<Severity, string> = { 0: "Off", 2: "Low", 4: "Medium", 6: "High" };
const BAND_COLORS: Record<Severity, string> = { 0: "#5C6B7F", 2: "#F5B544", 4: "#F5823A", 6: "#F5586B" };

export function BandSlider({
  value,
  onChange,
  className,
}: {
  value: Severity;
  onChange: (v: Severity) => void;
  className?: string;
}) {
  const idx = BANDS.indexOf(value);
  const pct = (idx / (BANDS.length - 1)) * 100;
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative h-4 flex-1">
        {/* track */}
        <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-bg-3" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full transition-all duration-100"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg,#38E1C6,#F5B544 55%,#F5586B)",
          }}
        />
        <input
          type="range"
          min={0}
          max={3}
          step={1}
          value={idx}
          onChange={(e) => onChange(BANDS[Number(e.target.value)])}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label="severity threshold"
        />
        <span
          className="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-bg-0 transition-all duration-100"
          style={{ left: `${pct}%`, backgroundColor: BAND_COLORS[value] }}
        />
      </div>
      <span className="w-24 font-mono text-[11px]" style={{ color: BAND_COLORS[value] }}>
        {value === 0 ? "Off" : `≥ ${BAND_LABELS[value]} (${value})`}
      </span>
    </div>
  );
}

/* ---------------- Continuous slider (0.5–0.99 / 0–100) ---------------- */
export function MiniSlider({
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
  className,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  className?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative h-4 flex-1">
        <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-bg-3" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-aegis/70 transition-all duration-100"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        <span
          className="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-bg-0 bg-aegis transition-all duration-100"
          style={{ left: `${pct}%` }}
        />
      </div>
      <span className="w-12 text-right font-mono text-[11px] text-aegis">
        {format ? format(value) : value}
      </span>
    </div>
  );
}

/* ---------------- Action radio ---------------- */
export function ActionRadio<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: ReactNode; accent?: "azure" }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-line">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "px-2.5 py-1 font-mono text-[11px] transition-colors duration-100",
            value === o.value
              ? o.accent === "azure"
                ? "bg-azure/15 text-azure"
                : "bg-aegis-dim/50 text-aegis"
              : "bg-bg-2 text-ink-low hover:text-ink-mid",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------- Chip ---------------- */
export function Chip({ children, color = "aegis" }: { children: ReactNode; color?: "aegis" | "azure" | "violet" | "warn" | "danger" | "low" }) {
  const map = {
    aegis: "border-aegis/40 bg-aegis/10 text-aegis",
    azure: "border-azure/40 bg-azure/10 text-azure",
    violet: "border-violet/40 bg-violet/10 text-violet",
    warn: "border-warn/40 bg-warn/10 text-warn",
    danger: "border-danger/40 bg-danger/10 text-danger",
    low: "border-line bg-bg-3 text-ink-low",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px]", map[color])}>
      {children}
    </span>
  );
}
