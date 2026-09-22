import type { Verdict } from "@/engines/ScanEngine";
import { cn } from "@/lib/utils";

const STYLES: Record<Verdict, { dot: string; text: string; border: string; bg: string }> = {
  PASS: { dot: "bg-aegis", text: "text-aegis", border: "border-aegis/40", bg: "bg-aegis/10" },
  FLAG: { dot: "bg-warn", text: "text-warn", border: "border-warn/40", bg: "bg-warn/10" },
  MASK: { dot: "bg-azure", text: "text-azure", border: "border-azure/40", bg: "bg-azure/10" },
  BLOCK: { dot: "bg-danger", text: "text-danger", border: "border-danger/40", bg: "bg-danger/10" },
};

export default function VerdictBadge({ verdict, className }: { verdict: Verdict; className?: string }) {
  const s = STYLES[verdict];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wider",
        s.border, s.bg, s.text, className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {verdict}
    </span>
  );
}
