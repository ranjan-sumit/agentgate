import { cn } from "@/lib/utils";

// ScanSweep overlay — 2px vertical gradient line sweeping left→right while scanning.
export default function ScanSweep({ active, className }: { active: boolean; className?: string }) {
  if (!active) return null;
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]", className)}>
      <div
        className="scan-sweep-line absolute top-0 h-full w-[2px]"
        style={{ background: "linear-gradient(180deg, transparent, #38E1C6 40%, #38E1C6 60%, transparent)" }}
      />
      <div className="absolute inset-0 bg-aegis/[0.03]" />
    </div>
  );
}
