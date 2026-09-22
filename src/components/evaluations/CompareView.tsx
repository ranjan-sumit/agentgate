import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer,
} from "recharts";
import { ArrowLeft, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface CmpRow {
  metric: string;
  baseline: number;
  current: number;
  delta: number;
  p: number;
  sig: boolean;
  fmt?: (v: number) => string;
}

const ROWS: CmpRow[] = [
  { metric: "Groundedness", baseline: 4.0, current: 4.3, delta: 0.3, p: 0.003, sig: true },
  { metric: "Relevance", baseline: 4.5, current: 4.6, delta: 0.1, p: 0.041, sig: true },
  { metric: "Coherence", baseline: 4.4, current: 4.5, delta: 0.1, p: 0.18, sig: false },
  { metric: "Retrieval", baseline: 0.83, current: 0.87, delta: 0.04, p: 0.008, sig: true },
  { metric: "Task adherence", baseline: 90.2, current: 92.0, delta: 1.8, p: 0.027, sig: true, fmt: (v) => v.toFixed(1) + "%" },
  { metric: "Safety pass rate", baseline: 98.2, current: 98.1, delta: -0.1, p: 0.41, sig: false, fmt: (v) => v.toFixed(1) + "%" },
];

function distCurve(mean: number, spread: number, key: string) {
  return Array.from({ length: 41 }, (_, i) => {
    const x = 2.5 + i * 0.0625; // 2.5..5
    const y = Math.exp(-Math.pow(x - mean, 2) / (2 * spread * spread));
    return { x: +x.toFixed(2), [key]: +y.toFixed(3) };
  });
}

const OVERLAY = distCurve(4.0, 0.42, "baseline").map((p, i) => ({ ...p, current: distCurve(4.3, 0.36, "c")[i].c }));

export default function CompareView({ onBack }: { onBack: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: "easeOut" }}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-1 rounded-md border border-line px-2.5 py-1.5 text-[12px] text-ink-mid hover:border-line-strong">
            <ArrowLeft size={13} /> Results
          </button>
          <div>
            <div className="text-lg font-semibold text-ink-hi">Run comparison</div>
            <div className="mt-0.5 flex items-center gap-2 font-mono text-[11px] text-ink-low">
              baseline
              <select className="rounded border border-line bg-bg-3 px-1.5 py-0.5 text-ink-mid">
                <option>ev_3280 · v2.2</option>
                <option>ev_3288 · exp-4</option>
                <option>ev_3308 · v2.3 agent</option>
              </select>
              → current
              <span className="rounded border border-azure/40 bg-azure/10 px-1.5 py-0.5 text-azure">ev_3312 · v2.3</span>
            </div>
          </div>
        </div>
        <button className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 font-mono text-[12px] text-ink-mid hover:border-line-strong">
          <Download size={13} /> Comparison report PDF
        </button>
      </div>

      {/* Comparison table */}
      <div className="mb-4 overflow-hidden rounded-[10px] border border-line bg-bg-2">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-line bg-bg-1 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-ink-low">
              <th className="px-3 py-2.5">Metric</th>
              <th className="px-3 py-2.5">ev_3280 baseline</th>
              <th className="px-3 py-2.5">ev_3312 current</th>
              <th className="px-3 py-2.5">Δ</th>
              <th className="px-3 py-2.5">Significance</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => {
              const fmt = r.fmt ?? ((v: number) => v.toFixed(r.baseline < 10 ? (r.baseline < 1 ? 2 : 1) : 1));
              return (
                <tr key={r.metric} className="border-b border-line/60 last:border-0 hover:bg-bg-3">
                  <td className="px-3 py-2.5 text-ink-hi">{r.metric}</td>
                  <td className="px-3 py-2.5 font-mono text-ink-mid">{fmt(r.baseline)}</td>
                  <td className="px-3 py-2.5 font-mono text-azure">{fmt(r.current)}</td>
                  <td className={cn("px-3 py-2.5 font-mono", r.delta >= 0 ? "text-aegis" : "text-danger")}>
                    {r.delta >= 0 ? "+" : ""}{r.fmt ? r.delta.toFixed(1) + "%" : r.delta.toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={cn(
                      "rounded border px-2 py-0.5 font-mono text-[11px]",
                      r.sig ? "border-aegis/40 bg-aegis/10 text-aegis" : "border-line bg-bg-3 text-ink-low",
                    )}>
                      p={r.p.toFixed(r.p < 0.01 ? 3 : 2)} · {r.sig ? "significant" : "n.s."}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="border-t border-line px-3 py-2 font-mono text-[11px] text-ink-low">
          Comparisons persist and are shareable via link. · welch's t-test, α=0.05
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Overlaid distributions */}
        <div className="rounded-[10px] border border-line bg-bg-2 p-4 xl:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-ink-low">Distribution overlay · groundedness</span>
            <span className="flex items-center gap-3 font-mono text-[10px] text-ink-low">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#5C6B7F]" /> baseline</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-azure" /> current</span>
            </span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={OVERLAY}>
              <XAxis dataKey="x" tick={{ fill: "#5C6B7F", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={{ stroke: "#1E2532" }} tickLine={false} />
              <YAxis hide domain={[0, 1.1]} />
              <RTooltip
                contentStyle={{ background: "#161B26", border: "1px solid #2A3242", borderRadius: 8, fontSize: 12, fontFamily: "JetBrains Mono" }}
                labelStyle={{ color: "#9AA6B8" }}
              />
              <Area type="monotone" dataKey="baseline" stroke="#5C6B7F" fill="#5C6B7F" fillOpacity={0.12} strokeWidth={1.5} isAnimationActive animationDuration={500} />
              <Area type="monotone" dataKey="current" stroke="#5B8CFF" fill="#5B8CFF" fillOpacity={0.15} strokeWidth={1.5} isAnimationActive animationDuration={500} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Summary callout */}
        <div className="rounded-[10px] border border-azure/30 bg-azure/5 p-4">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.08em] text-azure">Summary</div>
          <p className="text-[14px] leading-relaxed text-ink-hi">
            v2.3 significantly improves groundedness (<span className="font-mono text-aegis">+0.3, p&lt;0.01</span>) with{" "}
            <span className="font-mono text-ink-mid">no safety regression</span>.
          </p>
          <div className="mt-3 space-y-1.5 border-t border-line pt-3 font-mono text-[11px] text-ink-low">
            <div>4 metrics improved significantly</div>
            <div>0 regressions at α=0.05</div>
            <div>recommendation: <span className="text-aegis">promote v2.3 to prod</span></div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
