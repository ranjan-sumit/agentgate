import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Layers, Play, Search } from "lucide-react";
import ConsoleShell, { PageHeader } from "@/components/ConsoleShell";
import StatCard from "@/components/primitives/StatCard";
import DataTable from "@/components/primitives/DataTable";
import type { Column } from "@/components/primitives/DataTable";
import { cn } from "@/lib/utils";
import CatalogDrawer from "@/components/evaluations/CatalogDrawer";
import RunWizard from "@/components/evaluations/RunWizard";
import ResultsView from "@/components/evaluations/ResultsView";
import CompareView from "@/components/evaluations/CompareView";
import ContinuousBand from "@/components/evaluations/ContinuousBand";
import { RUNS } from "@/components/evaluations/data";
import type { DashRun } from "@/components/evaluations/data";

const FAMILIES = ["quality", "rag", "safety", "agent"] as const;
const STATUSES = ["all", "complete", "running", "failed"] as const;

const STATUS_STYLE: Record<DashRun["status"], string> = {
  complete: "border-aegis/40 bg-aegis/10 text-aegis",
  running: "border-azure/40 bg-azure/10 text-azure",
  failed: "border-danger/40 bg-danger/10 text-danger",
  queued: "border-line bg-bg-3 text-ink-low",
};

function AggBar({ score }: { score: number }) {
  return (
    <span className="flex items-center gap-2">
      <span className="font-mono text-[12px] text-ink-hi">{score.toFixed(1)}</span>
      <span className="h-1.5 w-14 overflow-hidden rounded-full bg-bg-3">
        <motion.span
          className={cn("block h-full rounded-full", score >= 4.2 ? "bg-aegis" : score >= 3.5 ? "bg-azure" : "bg-warn")}
          initial={{ width: 0 }}
          animate={{ width: `${(score / 5) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </span>
    </span>
  );
}

export default function Evaluations() {
  const [view, setView] = useState<"dashboard" | "results" | "compare">("dashboard");
  const [activeRun, setActiveRun] = useState<DashRun>(RUNS[0]);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [added, setAdded] = useState<string[]>(["groundedness", "relevance", "coherence", "safetyComposite"]);

  const [q, setQ] = useState("");
  const [fams, setFams] = useState<string[]>([]);
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("all");

  const filtered = useMemo(
    () =>
      RUNS.filter(
        (r) =>
          (!q || r.name.toLowerCase().includes(q.toLowerCase()) || r.id.includes(q)) &&
          (fams.length === 0 || fams.some((f) => r.family.includes(f))) &&
          (status === "all" || r.status === status),
      ),
    [q, fams, status],
  );

  const columns: Column<DashRun>[] = [
    { key: "id", header: "Run", mono: true, sortable: true, sortValue: (r) => r.id, render: (r) => <span className="font-mono text-[12px] text-azure">{r.id}</span> },
    {
      key: "name", header: "Name", render: (r) => (
        <span className="flex items-center gap-2">
          <span className="text-ink-hi">{r.name}</span>
          <span className="rounded border border-line px-1.5 py-px font-mono text-[10px] text-ink-low">{r.target}</span>
        </span>
      ),
    },
    {
      key: "bundles", header: "Evaluators", render: (r) => (
        <span className="flex flex-wrap gap-1">
          {r.bundles.map((b) => (
            <span key={b} className="rounded border border-azure/40 bg-azure/10 px-1.5 py-px font-mono text-[10px] text-azure">{b}</span>
          ))}
        </span>
      ),
    },
    { key: "rows", header: "Rows", sortable: true, sortValue: (r) => r.rows, render: (r) => <span className="font-mono text-[12px] text-ink-mid">{r.rows.toLocaleString()}</span> },
    { key: "score", header: "Agg score", sortable: true, sortValue: (r) => r.score, render: (r) => <AggBar score={r.score} /> },
    {
      key: "status", header: "Status", render: (r) => (
        <span className={cn("inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[10px] uppercase", STATUS_STYLE[r.status])}>
          {r.status === "running" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-azure" />}
          {r.status}
        </span>
      ),
    },
    {
      key: "progress", header: "Progress", render: (r) =>
        r.status === "running" ? (
          <span className="block w-24">
            <span className="h-1.5 w-full overflow-hidden rounded-full bg-bg-3">
              <motion.span
                className="block h-full rounded-full bg-azure"
                initial={{ width: 0 }}
                animate={{ width: `${r.progress ?? 0}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </span>
            <span className="mt-0.5 block font-mono text-[10px] text-azure">{r.progress}% · judging</span>
          </span>
        ) : (
          <span className="font-mono text-[11px] text-ink-low">{r.duration}</span>
        ),
    },
    { key: "cost", header: "Cost · tokens", render: (r) => <span className="font-mono text-[11px] text-ink-mid">{r.cost} · <span className="text-ink-low">{r.tokens}</span></span> },
    { key: "created", header: "Created", render: (r) => <span className="font-mono text-[11px] text-ink-low">{r.created}</span> },
  ];

  const openResults = (r: DashRun) => { setActiveRun(r); setView("results"); };

  return (
    <ConsoleShell breadcrumb="quality / evaluations">
      <PageHeader
        title="Evaluation Studio"
        subtitle="quality · RAG · safety · agent"
        actions={
          <>
            <button
              onClick={() => setCatalogOpen(true)}
              className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 font-mono text-[12px] text-ink-mid hover:border-line-strong hover:text-ink-hi"
            >
              <Layers size={13} /> Evaluator catalog
            </button>
            <button
              onClick={() => setWizardOpen(true)}
              className="flex items-center gap-1.5 rounded-md border border-aegis/50 bg-aegis-dim/30 px-3 py-1.5 font-mono text-[12px] text-aegis hover:bg-aegis-dim/60"
            >
              <Play size={13} /> New evaluation run
            </button>
          </>
        }
      />

      {view === "results" && <ResultsView run={activeRun} onBack={() => setView("dashboard")} onCompare={() => setView("compare")} />}
      {view === "compare" && <CompareView onBack={() => setView("results")} />}

      {view === "dashboard" && (
        <>
          {/* S1 — stat band */}
          <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
            <StatCard label="Runs this week" value="18" spark={[4, 6, 5, 8, 7, 10, 18]} />
            <StatCard label="Avg groundedness" value="4.3/5" delta="↑0.2 vs last week" deltaUp spark={[3.8, 3.9, 4.0, 4.1, 4.0, 4.2, 4.3]} />
            <StatCard label="Safety pass rate" value="98.1%" spark={[97.2, 97.6, 97.5, 98.0, 97.9, 98.2, 98.1]} />
            <StatCard label="Continuous eval coverage" value="12%" delta="↑4% of traffic" deltaUp spark={[6, 7, 8, 8, 10, 11, 12]} />
          </div>

          {/* S2 — filter bar + runs table */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-md border border-line bg-bg-2 px-3 py-1.5">
              <Search size={13} className="text-ink-low" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search runs…"
                className="w-44 bg-transparent text-[13px] text-ink-hi placeholder:text-ink-low focus:outline-none"
              />
            </div>
            {FAMILIES.map((f) => {
              const on = fams.includes(f);
              return (
                <motion.button
                  key={f}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  onClick={() => setFams((fs) => (on ? fs.filter((x) => x !== f) : [...fs, f]))}
                  className={cn(
                    "rounded-full border px-3 py-1 font-mono text-[11px] capitalize",
                    on ? "border-azure/60 bg-azure/15 text-azure" : "border-line text-ink-low hover:border-line-strong hover:text-ink-mid",
                  )}
                >
                  {f}
                </motion.button>
              );
            })}
            <button className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1 font-mono text-[11px] text-ink-low hover:border-line-strong">
              <Calendar size={11} /> last 7 days
            </button>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as (typeof STATUSES)[number])}
              className="rounded-md border border-line bg-bg-2 px-2 py-1.5 font-mono text-[11px] text-ink-mid focus:outline-none"
            >
              {STATUSES.map((s) => <option key={s} value={s}>{s === "all" ? "all statuses" : s}</option>)}
            </select>
            <span className="ml-auto font-mono text-[11px] text-ink-low">{filtered.length} runs</span>
          </div>

          <DataTable columns={columns} rows={filtered} onRowClick={openResults} />

          {/* S6 — continuous evaluation */}
          <ContinuousBand />
        </>
      )}

      <CatalogDrawer
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        added={added}
        onAdd={(n) => setAdded((a) => (a.includes(n) ? a : [...a, n]))}
      />
      <RunWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        added={added}
        onRemoveEvaluator={(n) => setAdded((a) => a.filter((x) => x !== n))}
        onLaunch={() => setWizardOpen(false)}
      />
    </ConsoleShell>
  );
}
