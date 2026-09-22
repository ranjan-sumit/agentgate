import { useState } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer } from "recharts";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Rule {
  name: string;
  target: string;
  rate: number;
  bundle: string;
  schedule: string;
  on: boolean;
}

const INIT_RULES: Rule[] = [
  { name: "prod-traffic-sample", target: "support-agent · prod", rate: 12, bundle: "RAG pack", schedule: "hourly roll-up", on: true },
  { name: "safety-always-on", target: "all endpoints", rate: 100, bundle: "ContentSafety bundle", schedule: "realtime", on: true },
  { name: "staging-canary", target: "qa-bot · staging", rate: 25, bundle: "QA bundle", schedule: "daily roll-up", on: false },
];

const ROLLING = Array.from({ length: 30 }, (_, i) => ({
  day: `D${i + 1}`,
  pass: +(96.2 + Math.sin(i / 4) * 1.1 + (i > 18 ? 0.8 : 0) + ((i * 37) % 10) / 14).toFixed(2),
}));

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={cn("relative h-5 w-9 rounded-full border transition-colors duration-150",
        on ? "border-aegis/60 bg-aegis-dim/60" : "border-line bg-bg-3")}
      aria-label="Toggle rule"
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className={cn("absolute top-0.5 h-3.5 w-3.5 rounded-full", on ? "right-0.5 bg-aegis" : "left-0.5 bg-ink-low")}
      />
    </button>
  );
}

export default function ContinuousBand() {
  const [rules, setRules] = useState(INIT_RULES);

  return (
    <div className="mt-8 grid grid-cols-1 gap-4 xl:grid-cols-3">
      <div className="overflow-hidden rounded-[10px] border border-line bg-bg-2 xl:col-span-2">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div>
            <div className="text-[15px] font-semibold text-ink-hi">Continuous evaluation</div>
            <div className="font-mono text-[11px] text-ink-low">sampling rules · live traffic</div>
          </div>
          <button
            onClick={() => setRules((r) => [...r, { name: `rule-${r.length + 1}`, target: "support-agent · prod", rate: 5, bundle: "QA bundle", schedule: "hourly roll-up", on: false }])}
            className="flex items-center gap-1 rounded-md border border-aegis/50 bg-aegis-dim/30 px-2.5 py-1.5 font-mono text-[11px] text-aegis hover:bg-aegis-dim/60"
          >
            <Plus size={12} /> New rule
          </button>
        </div>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-line bg-bg-1 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-ink-low">
              <th className="px-4 py-2.5">Rule</th>
              <th className="px-3 py-2.5">Target</th>
              <th className="px-3 py-2.5">Sample rate</th>
              <th className="px-3 py-2.5">Bundle</th>
              <th className="px-3 py-2.5">Schedule</th>
              <th className="px-3 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r, i) => (
              <motion.tr
                key={r.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.25 }}
                className="border-b border-line/60 last:border-0 hover:bg-bg-3"
              >
                <td className="px-4 py-2.5 font-mono text-[12px] text-ink-hi">{r.name}</td>
                <td className="px-3 py-2.5 text-ink-mid">{r.target}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="range" min={1} max={100} value={r.rate}
                      onChange={(e) => setRules((rs) => rs.map((x, j) => (j === i ? { ...x, rate: +e.target.value } : x)))}
                      className="h-1 w-24 cursor-pointer accent-azure"
                    />
                    <span className="font-mono text-[11px] text-azure">{r.rate}%</span>
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <span className="rounded border border-azure/40 bg-azure/10 px-1.5 py-px font-mono text-[10px] text-azure">{r.bundle}</span>
                </td>
                <td className="px-3 py-2.5 font-mono text-[11px] text-ink-low">{r.schedule}</td>
                <td className="px-3 py-2.5">
                  <Toggle on={r.on} onChange={() => setRules((rs) => rs.map((x, j) => (j === i ? { ...x, on: !x.on } : x)))} />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-[10px] border border-line bg-bg-2 p-4">
        <div className="mb-2 text-[12px] font-medium uppercase tracking-[0.08em] text-ink-low">Rolling safety pass rate · 30d</div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={ROLLING}>
            <defs>
              <linearGradient id="passGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5B8CFF" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#38E1C6" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fill: "#5C6B7F", fontSize: 10, fontFamily: "JetBrains Mono" }} interval={6} axisLine={{ stroke: "#1E2532" }} tickLine={false} />
            <YAxis domain={[94, 100]} tick={{ fill: "#5C6B7F", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} width={34} />
            <RTooltip
              contentStyle={{ background: "#161B26", border: "1px solid #2A3242", borderRadius: 8, fontSize: 12, fontFamily: "JetBrains Mono" }}
              labelStyle={{ color: "#9AA6B8" }}
              formatter={(v: unknown) => [`${v}%`, "pass rate"]}
            />
            <Area type="monotone" dataKey="pass" stroke="#5B8CFF" strokeWidth={1.5} fill="url(#passGrad)" isAnimationActive animationDuration={600} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="mt-3 border-t border-line pt-3 font-mono text-[11px] leading-relaxed text-ink-low">
          Powered by OTel GenAI trace harvesting — traces become datasets automatically.
        </div>
      </div>
    </div>
  );
}
