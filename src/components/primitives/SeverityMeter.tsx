import type { Severity } from "@/engines/ScanEngine";
import { cn } from "@/lib/utils";

const LABELS: Record<Severity, string> = { 0: "Safe", 2: "Low", 4: "Medium", 6: "High" };
const COLORS: Record<Severity, string> = { 0: "#38E1C6", 2: "#F5B544", 4: "#F5823A", 6: "#F5586B" };

export default function SeverityMeter({
  severity,
  showLabel = true,
  className,
}: {
  severity: Severity;
  showLabel?: boolean;
  className?: string;
}) {
  const filled = severity === 0 ? 1 : severity === 2 ? 2 : severity === 4 ? 3 : 4;
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="h-1.5 w-4 rounded-sm"
            style={{ backgroundColor: i < filled ? COLORS[severity] : "#1E2532" }}
          />
        ))}
      </div>
      {showLabel && (
        <span className="font-mono text-[11px]" style={{ color: COLORS[severity] }}>
          {LABELS[severity]} · {severity}
        </span>
      )}
    </div>
  );
}
