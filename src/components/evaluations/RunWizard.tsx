import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["Target", "Dataset", "Evaluators", "Review"];
const TARGETS = ["support-agent · v2.3", "qa-bot · nightly", "billing-agent · v1.9", "kb-search · exp-4", "copy-writer · v3"];
const DATASETS = ["prod-sample-2k.jsonl", "golden-set-500.jsonl", "redteam-regression.jsonl", "support-tickets-q3.jsonl"];

export default function RunWizard({
  open,
  onClose,
  added,
  onRemoveEvaluator,
  onLaunch,
}: {
  open: boolean;
  onClose: () => void;
  added: string[];
  onRemoveEvaluator: (name: string) => void;
  onLaunch: (name: string, target: string) => void;
}) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("support-agent v2.4 eval");
  const [target, setTarget] = useState(TARGETS[0]);
  const [dataset, setDataset] = useState(DATASETS[0]);

  const close = () => { setStep(0); onClose(); };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-40 bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} />
          <motion.div
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-[10px] border border-line bg-bg-1 shadow-2xl"
            initial={{ opacity: 0, y: 24, x: "-50%" }}
            animate={{ opacity: 1, y: "-50%", x: "-50%" }}
            exit={{ opacity: 0, y: 24, x: "-50%" }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
          >
            <div className="flex h-14 items-center justify-between border-b border-line px-5">
              <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-ink-low">New evaluation run</span>
              <button onClick={close} className="text-ink-low hover:text-ink-hi" aria-label="Close"><X size={16} /></button>
            </div>

            {/* Stepper */}
            <div className="flex items-center gap-2 border-b border-line px-5 py-3">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <span className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full border font-mono text-[10px]",
                    i < step ? "border-aegis bg-aegis-dim/40 text-aegis" : i === step ? "border-aegis text-aegis" : "border-line text-ink-low",
                  )}>{i + 1}</span>
                  <span className={cn("text-[12px]", i === step ? "text-ink-hi" : "text-ink-low")}>{s}</span>
                  {i < STEPS.length - 1 && <span className="mx-1 h-px w-6 bg-line" />}
                </div>
              ))}
            </div>

            <div className="p-5">
              {step === 0 && (
                <div>
                  <label className="mb-1 block text-[12px] font-medium uppercase tracking-[0.08em] text-ink-low">Run name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)}
                    className="mb-4 w-full rounded-md border border-line bg-bg-3 px-3 py-2 text-[13px] text-ink-hi focus:border-aegis/50 focus:outline-none" />
                  <label className="mb-1 block text-[12px] font-medium uppercase tracking-[0.08em] text-ink-low">Target</label>
                  <div className="space-y-1.5">
                    {TARGETS.map((t) => (
                      <button key={t} onClick={() => setTarget(t)}
                        className={cn("flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-[13px]",
                          target === t ? "border-aegis/60 bg-aegis-dim/20 text-ink-hi" : "border-line bg-bg-2 text-ink-mid hover:border-line-strong")}>
                        {t}
                        {target === t && <span className="font-mono text-[10px] text-aegis">selected</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {step === 1 && (
                <div>
                  <label className="mb-1 block text-[12px] font-medium uppercase tracking-[0.08em] text-ink-low">Dataset</label>
                  <div className="space-y-1.5">
                    {DATASETS.map((d) => (
                      <button key={d} onClick={() => setDataset(d)}
                        className={cn("flex w-full items-center justify-between rounded-md border px-3 py-2 text-left font-mono text-[13px]",
                          dataset === d ? "border-aegis/60 bg-aegis-dim/20 text-ink-hi" : "border-line bg-bg-2 text-ink-mid hover:border-line-strong")}>
                        {d}
                        <span className="font-mono text-[10px] text-ink-low">{d === "prod-sample-2k.jsonl" ? "2,000 rows" : "500 rows"}</span>
                      </button>
                    ))}
                  </div>
                  <button className="mt-3 font-mono text-[11px] text-azure hover:underline">+ Upload new dataset (.jsonl)</button>
                </div>
              )}
              {step === 2 && (
                <div>
                  <label className="mb-2 block text-[12px] font-medium uppercase tracking-[0.08em] text-ink-low">
                    Selected evaluators <span className="text-ink-low/70">(add more from the catalog)</span>
                  </label>
                  {added.length === 0 ? (
                    <div className="rounded-md border border-dashed border-line p-6 text-center text-[13px] text-ink-low">
                      No evaluators selected — open the Evaluator catalog to add some.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {added.map((a) => (
                        <span key={a} className="flex items-center gap-1.5 rounded-full border border-azure/40 bg-azure/10 px-3 py-1 font-mono text-[12px] text-azure">
                          {a}
                          <button onClick={() => onRemoveEvaluator(a)} aria-label={`Remove ${a}`}><X size={12} /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {step === 3 && (
                <div className="space-y-3 font-mono text-[13px]">
                  {[
                    ["name", name],
                    ["target", target],
                    ["dataset", dataset],
                    ["evaluators", added.length ? added.join(", ") : "—"],
                    ["estimated cost", "$4.60 · ~1.3M tokens"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 border-b border-line pb-2">
                      <span className="text-[12px] uppercase tracking-[0.08em] text-ink-low">{k}</span>
                      <span className="text-right text-ink-hi">{v}</span>
                    </div>
                  ))}
                  <div className="pt-1 text-[11px] text-ink-low">Run will be queued immediately and results stream into the dashboard.</div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-line px-5 py-3">
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="flex items-center gap-1 rounded-md border border-line px-3 py-1.5 text-[12px] text-ink-mid enabled:hover:border-line-strong disabled:opacity-40"
              >
                <ChevronLeft size={13} /> Back
              </button>
              {step < 3 ? (
                <button
                  onClick={() => setStep((s) => s + 1)}
                  className="flex items-center gap-1 rounded-md border border-aegis/50 bg-aegis-dim/30 px-4 py-1.5 font-mono text-[12px] text-aegis hover:bg-aegis-dim/60"
                >
                  Next <ChevronRight size={13} />
                </button>
              ) : (
                <button
                  onClick={() => { onLaunch(name, target); close(); }}
                  className="rounded-md border border-aegis/50 bg-aegis-dim/30 px-4 py-1.5 font-mono text-[12px] text-aegis hover:bg-aegis-dim/60"
                >
                  Launch run
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
