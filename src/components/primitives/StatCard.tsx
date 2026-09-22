import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

export function Sparkline({ points, color = "#38E1C6", width = 80, height = 24 }: { points: number[]; color?: string; width?: number; height?: number }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(height - 2 - ((p - min) / range) * (height - 4)).toFixed(1)}`).join(" ");
  return (
    <svg width={width} height={height} className="overflow-visible">
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export default function StatCard({
  label,
  value,
  delta,
  deltaUp,
  spark,
  className,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaUp?: boolean;
  spark?: number[];
  className?: string;
}) {
  return (
    <div className={cn("rounded-[10px] border border-line bg-bg-2 p-4", className)}>
      <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-ink-low">{label}</div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="font-mono text-2xl font-semibold text-ink-hi">{value}</div>
        {spark && <Sparkline points={spark} />}
      </div>
      {delta && (
        <div className={cn("mt-2 inline-flex items-center gap-1 font-mono text-[11px]", deltaUp ? "text-aegis" : "text-danger")}>
          {deltaUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {delta}
        </div>
      )}
    </div>
  );
}
