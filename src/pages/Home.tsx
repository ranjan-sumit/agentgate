import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { motion, useInView, animate } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import {
  ShieldCheck, Fingerprint, Languages, ArrowUpRight, Zap, ShieldAlert,
  SlidersHorizontal, Swords, FlaskConical, Activity,
} from "lucide-react";
import LiveDemo from "@/components/home/LiveDemo";
import { Sparkline } from "@/components/primitives";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);
const HeroCanvas = lazy(() => import("@/components/home/HeroCanvas"));

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* ---------------- count-up hook ---------------- */
function useCountUp(target: number, decimals = 0, duration = 0.6) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, target, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setVal(v),
    });
    return () => controls.stop();
  }, [inView, target, duration]);
  return { ref, text: val.toFixed(decimals) };
}

/* ---------------- S1 Hero ---------------- */
function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scanRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: sectionRef.current, start: "top top", end: "+=150%", pin: true, scrub: 0.5 },
      });
      tl.to(contentRef.current, { scale: 0.94, opacity: 0.7, ease: "none" }, 0);
      tl.fromTo(scanRef.current, { top: "-2%", opacity: 1 }, { top: "102%", opacity: 0.6, ease: "none" }, 0.25);
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const words: { text: string; className?: string }[] = [
    { text: "One" }, { text: "gate." },
    { text: "Every" }, { text: "model.", className: "text-gradient-aegis" },
    { text: "Total" }, { text: "control." },
  ];

  return (
    <section ref={sectionRef} className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden">
      <img src="/hero-grid.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
      <div className="absolute inset-0 bg-gradient-to-b from-bg-0/60 via-transparent to-bg-0" />
      <Suspense fallback={null}>
        <HeroCanvas />
      </Suspense>
      {/* scan line driven by scroll */}
      <div
        ref={scanRef}
        className="pointer-events-none absolute left-0 z-10 h-[2px] w-full opacity-0"
        style={{ background: "linear-gradient(90deg, transparent, #38E1C6 30%, #38E1C6 70%, transparent)" }}
      />
      <div ref={contentRef} className="relative z-10 mx-auto max-w-[880px] px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-line px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-mid"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-aegis pulse-dot" />
          Guardrails · Red Team · Evaluation — as a service
        </motion.div>
        <h1 className="text-[clamp(42px,7vw,80px)] font-bold leading-[1.02] tracking-[-0.03em] text-ink-hi">
          {words.map((w, i) => (
            <span key={i} className="inline-block overflow-hidden pb-1 align-bottom">
              <motion.span
                className={cn("inline-block", w.className)}
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 + i * 0.09, duration: 0.6, ease: EASE }}
              >
                {w.text}{"\u00A0"}
              </motion.span>
            </span>
          ))}
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5, ease: EASE }}
          className="mx-auto mt-6 max-w-[620px] text-[18px] leading-relaxed text-ink-mid"
        >
          AegisGate is the embeddable safety gate for any LLM. Scan inputs and outputs in 40ms,
          red-team your agents with 40+ attack strategies, and evaluate quality continuously — behind one API.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.5, ease: EASE }}
          className="mt-8 flex items-center justify-center gap-4"
        >
          <Link
            to="/integrations"
            className="rounded-md border border-aegis/60 bg-aegis-dim/30 px-6 py-3 font-mono text-[14px] font-medium text-aegis transition-all hover:bg-aegis-dim/60 hover:shadow-[0_0_24px_rgba(56,225,198,0.2)]"
          >
            Get an API key
          </Link>
          <Link
            to="/gate"
            className="flex items-center gap-1.5 rounded-md border border-line px-6 py-3 font-mono text-[14px] text-ink-mid transition-colors hover:border-line-strong hover:text-ink-hi"
          >
            Open the live playground <ArrowUpRight size={14} />
          </Link>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.6 }}
          className="mx-auto mt-14 flex max-w-[720px] flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-wider text-ink-low"
        >
          {["p50 41ms", "40+ attack strategies", "OWASP LLM Top 10 mapped", "SOC 2 Type II"].map((s, i) => (
            <span key={s} className={cn("flex items-center gap-6", i > 0 && "border-l border-line pl-6")}>{s}</span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------- S2 Live demo ---------------- */
function LiveDemoSection() {
  return (
    <section className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-12 px-6 py-28 lg:grid-cols-[55fr_45fr]">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-20% 0px" }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-aegis">Live demo</div>
        <h2 className="mt-3 text-3xl font-semibold text-ink-hi">Watch it judge a prompt in real time</h2>
        <p className="mt-4 max-w-[520px] text-[15px] leading-relaxed text-ink-mid">
          Every request flows through input shields before your model and output shields after it.
          The gate returns a deterministic verdict, per-category severities, and a confidence-scored
          prompt shield verdict — in one call.
        </p>
        <ul className="mt-8 space-y-5">
          {[
            { icon: ShieldCheck, title: "Prompt Shields with confidence scores", body: "Attack subtype and a 0–1 confidence — not just a boolean." },
            { icon: Fingerprint, title: "PII block or mask", body: "Emails, SSNs, cards, phones — redacted inline or blocked outright." },
            { icon: Languages, title: "36 languages, not just English", body: "The same policies hold across every language your users speak." },
          ].map((f) => (
            <li key={f.title} className="flex gap-3">
              <f.icon size={16} className="mt-1 shrink-0 text-aegis" />
              <div>
                <div className="text-[15px] font-medium text-ink-hi">{f.title}</div>
                <div className="text-[13px] text-ink-mid">{f.body}</div>
              </div>
            </li>
          ))}
        </ul>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-20% 0px" }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <LiveDemo />
      </motion.div>
    </section>
  );
}

/* ---------------- S3 Pinned pipeline ---------------- */
const STAGES = [
  { n: "01", title: "Intercept", body: "Drop in as a proxy (one-line base-URL change) or call /v1/scan directly. Input, output, and document channels." },
  { n: "02", title: "Evaluate", body: "Composable policy blocks: 4 harm categories with 0/2/4/6 severities, Prompt Shields (direct + indirect injection), groundedness, protected material, PII, denied topics, custom blocklists." },
  { n: "03", title: "Decide", body: "Per-block actions: annotate, block, or mask. Streaming-aware. Deterministic verdicts with confidence + reasons." },
  { n: "04", title: "Learn", body: "Every production block becomes a red-team regression case. The loop closes itself." },
];

function Pipeline() {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: ref.current,
        start: "top top",
        end: "+=200%",
        pin: true,
        scrub: true,
        onUpdate: (self) => {
          const idx = Math.min(3, Math.floor(self.progress * 4));
          setActive((prev) => (prev === idx ? prev : idx));
        },
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="flex min-h-[100dvh] items-center bg-bg-1">
      <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2">
        <div className="rounded-[10px] border border-line bg-bg-1 p-4">
          <img src="/gate-diagram.svg" alt="AegisGate pipeline diagram" className="w-full" />
        </div>
        <div className="space-y-4">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-aegis">How the gate works</div>
          {STAGES.map((s, i) => (
            <div
              key={s.n}
              className={cn(
                "rounded-[10px] border border-line border-l-2 bg-bg-2 p-5 transition-all duration-300",
                i === active ? "border-l-aegis opacity-100" : "border-l-line opacity-25",
              )}
            >
              <div className="flex items-baseline gap-3">
                <span className={cn("font-mono text-[13px]", i === active ? "text-aegis" : "text-ink-low")}>{s.n}</span>
                <h3 className="text-[17px] font-semibold text-ink-hi">{s.title}</h3>
              </div>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-mid">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- S4 Feature grid ---------------- */
const FEATURES = [
  { icon: Zap, title: "Gate API", body: "One /v1/scan endpoint for text, images, and multimodal docs. Annotate, block, or mask.", tag: "REST · gRPC · WS streaming" },
  { icon: ShieldAlert, title: "Prompt Shields+", body: "Direct & indirect injection with attack subtype and confidence — the score Azure never gave you.", tag: "rule-change · DAN · base64 · XPIA" },
  { icon: SlidersHorizontal, title: "Policy Studio", body: "Composable blocks, severity sliders, 10k-term regex blocklists, versioned & instant-publish.", tag: "v14 live →" },
  { icon: Swords, title: "Red Team Lab", body: "40+ converters from Base64 to Crescendo multi-turn. ASR scorecards with judge reasons.", tag: "powered by a PyRIT-compatible engine" },
  { icon: FlaskConical, title: "Evaluation Studio", body: "Quality, RAG, safety & agent evaluators. Run comparison with significance tests that persist.", tag: "t-test p<0.05" },
  { icon: Activity, title: "Observability", body: "OTel-native traces, severity trends, continuous eval sampling, incident queues.", tag: "OpenTelemetry GenAI" },
];

function FeatureGrid() {
  return (
    <section className="mx-auto max-w-[1200px] px-6 py-28">
      <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-aegis">The full stack of control</div>
      <h2 className="mt-3 text-3xl font-semibold text-ink-hi">Everything between your users and your model</h2>
      <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15% 0px" }}
            transition={{ delay: i * 0.08, duration: 0.5, ease: EASE }}
            className="group rounded-[10px] border border-line bg-bg-2 p-5 transition-all hover:-translate-y-[3px] hover:border-line-strong"
          >
            <f.icon size={16} className="text-aegis transition-shadow group-hover:drop-shadow-[0_0_8px_rgba(56,225,198,0.6)]" />
            <h3 className="mt-3 text-[17px] font-semibold text-ink-hi">{f.title}</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-mid">{f.body}</p>
            <div className="mt-4 font-mono text-[11px] text-ink-low">{f.tag}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- S5 Red team spotlight ---------------- */
const ASR_BARS = [
  { label: "Hate", value: 4.1 },
  { label: "Violence", value: 8.8 },
  { label: "XPIA", value: 21.3 },
  { label: "Jailbreak", value: 15.6 },
  { label: "PII leak", value: 6.2 },
];

function RedTeamSpotlight() {
  const [tier, setTier] = useState<"Easy" | "Moderate" | "Difficult">("Moderate");
  const asr = useCountUp(12.4, 1, 0.9);
  return (
    <section className="border-y border-line bg-bg-1 py-28">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-20% 0px" }}
          transition={{ duration: 0.6, ease: EASE }}
          className="rounded-[10px] border border-line bg-bg-2 p-6"
        >
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-ink-low">Overall attack success rate</div>
              <div className="mt-1 font-mono text-5xl font-semibold text-violet">
                <span ref={asr.ref}>{asr.text}</span>%
              </div>
            </div>
            <div className="flex gap-1">
              {(["Easy", "Moderate", "Difficult"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTier(t)}
                  className={cn(
                    "rounded px-2.5 py-1 font-mono text-[11px]",
                    tier === t ? "bg-bg-3 text-violet" : "text-ink-low hover:text-ink-mid",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {ASR_BARS.map((b, i) => (
              <div key={b.label} className="flex items-center gap-3">
                <span className="w-20 font-mono text-[12px] text-ink-mid">{b.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-sm bg-bg-3">
                  <motion.div
                    className="h-full rounded-sm bg-violet"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(b.value / 25) * 100}%` }}
                    viewport={{ once: true, margin: "-15% 0px" }}
                    transition={{ delay: i * 0.06, duration: 0.7, ease: "easeOut" }}
                  />
                </div>
                <span className="w-14 text-right font-mono text-[12px] text-ink-hi">{b.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-20% 0px" }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-violet">Adversarial</div>
          <h2 className="mt-3 text-3xl font-semibold text-ink-hi">Break yourself before they do</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-mid">
            Seed objectives flow through converter strategies into multi-turn attacks against your target,
            then an LLM judge scores every transcript. The result is an OWASP-mapped ASR scorecard and a
            regression suite that runs on every deploy.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["Crescendo", "TAP", "UnicodeConfusable", "Flip", "Tense+Base64"].map((s) => (
              <span key={s} className="rounded-full border border-violet/40 bg-violet/10 px-3 py-1 font-mono text-[11px] text-violet">
                {s}
              </span>
            ))}
          </div>
          <Link to="/redteam" className="mt-8 inline-flex items-center gap-1.5 font-mono text-[13px] text-aegis hover:underline">
            Open Red Team Lab <ArrowUpRight size={14} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------- S6 Benchmarks ---------------- */
function BenchStat({ label, value, suffix, decimals = 0, spark }: { label: string; value: number; suffix: string; decimals?: number; spark?: number[] }) {
  const c = useCountUp(value, decimals);
  return (
    <div className="flex flex-col gap-2 px-8 py-6">
      <div className="flex items-center gap-3">
        <span ref={c.ref} className="font-mono text-4xl font-semibold text-ink-hi">{c.text}</span>
        <span className="font-mono text-lg text-ink-mid">{suffix}</span>
        {spark && <Sparkline points={spark} width={80} height={24} />}
      </div>
      <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-ink-low">{label}</span>
    </div>
  );
}

function Benchmarks() {
  return (
    <section className="mx-auto max-w-[1200px] px-6 py-20">
      <div className="grid grid-cols-1 divide-y divide-line rounded-[10px] border border-line bg-bg-2 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
        <BenchStat label="p50 scan latency" value={41} suffix="ms" spark={[52, 48, 45, 47, 43, 41, 44, 40, 41]} />
        <BenchStat label="shield precision" value={0.97} suffix="" decimals={2} />
        <BenchStat label="uptime 90d" value={99.99} suffix="%" decimals={2} spark={[99.9, 99.95, 99.99, 99.98, 99.99, 100, 99.99]} />
        <BenchStat label="scans served" value={2.1} suffix="B" decimals={1} />
      </div>
      <div className="mt-3 text-center font-mono text-[11px] text-ink-low">
        Benchmarks on aegis-gate v2.4.1, us-east, text≤2k chars.
      </div>
    </section>
  );
}

/* ---------------- S7 Compliance + quotes ---------------- */
const FRAMEWORKS = ["OWASP LLM Top 10", "MITRE ATLAS", "NIST AI RMF", "EU AI Act", "SOC 2", "ISO 27001"];
const QUOTES = [
  {
    quote: "We replaced three Azure-only tools with one gate. The confidence scores on prompt shields ended weeks of false-positive triage.",
    name: "M. Okafor", role: "Head of AI Platform, fintech", avatar: "/avatar-1.png",
  },
  {
    quote: "The red-team loop is the first one that actually closes — production blocks show up as regression cases the same day.",
    name: "L. Varga", role: "Red team lead, frontier lab", avatar: "/avatar-2.png",
  },
];

function Compliance() {
  return (
    <section className="mx-auto grid max-w-[1200px] grid-cols-1 gap-12 px-6 py-28 lg:grid-cols-2">
      <div>
        <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-aegis">Compliance</div>
        <h2 className="mt-3 text-3xl font-semibold text-ink-hi">Mapped to the frameworks that matter</h2>
        <div className="mt-8 flex flex-wrap gap-2">
          {FRAMEWORKS.map((f, i) => (
            <motion.span
              key={f}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-15% 0px" }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="rounded-full border border-line px-4 py-1.5 font-mono text-[12px] text-ink-mid transition-colors hover:border-aegis/50 hover:text-aegis"
            >
              {f}
            </motion.span>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        {QUOTES.map((q, i) => (
          <motion.figure
            key={q.name}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15% 0px" }}
            transition={{ delay: i * 0.1, duration: 0.5, ease: EASE }}
            className="rounded-[10px] border border-line bg-bg-2 p-5"
          >
            <blockquote className="text-[14px] leading-relaxed text-ink-mid">“{q.quote}”</blockquote>
            <figcaption className="mt-4 flex items-center gap-3">
              <img src={q.avatar} alt={q.name} className="h-9 w-9 rounded-full border border-line object-cover" />
              <div>
                <div className="text-[13px] font-medium text-ink-hi">{q.name}</div>
                <div className="font-mono text-[11px] text-ink-low">{q.role}</div>
              </div>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}

/* ---------------- S8 Final CTA ---------------- */
const CURL = "$ curl -X POST https://gate.aegisgate.dev/v1/scan";

function FinalCta() {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-25% 0px" });
  const [typed, setTyped] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => setTyped((t) => (t >= CURL.length ? (clearInterval(id), t) : t + 1)), 28);
    return () => clearInterval(id);
  }, [inView]);

  return (
    <section className="mx-auto max-w-[1200px] px-6 pb-32 pt-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-25% 0px" }}
        transition={{ duration: 0.5, ease: EASE }}
        className="relative overflow-hidden rounded-[12px] border border-line bg-bg-1 px-6 py-20 text-center"
      >
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-full w-[300px] -translate-x-1/2"
          style={{ background: "radial-gradient(ellipse at center, rgba(56,225,198,0.12), transparent 70%)" }}
        />
        <h2 className="relative text-4xl font-semibold text-ink-hi">Put a gate in front of every model.</h2>
        <div className="relative mx-auto mt-6 inline-block rounded-md border border-line bg-bg-3 px-4 py-2.5 font-mono text-[13px] text-aegis">
          <span ref={ref}>{CURL.slice(0, typed)}</span>
          <span className="caret-block ml-0.5 inline-block h-4 w-2 translate-y-0.5 bg-aegis" />
        </div>
        <div className="relative mt-8 flex items-center justify-center gap-4">
          <Link
            to="/integrations"
            className="rounded-md border border-aegis/60 bg-aegis-dim/30 px-6 py-3 font-mono text-[14px] font-medium text-aegis transition-all hover:bg-aegis-dim/60 hover:shadow-[0_0_24px_rgba(56,225,198,0.2)]"
          >
            Get an API key
          </Link>
          <Link
            to="/integrations"
            className="rounded-md border border-line px-6 py-3 font-mono text-[14px] text-ink-mid hover:border-line-strong hover:text-ink-hi"
          >
            Read the docs
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

/* ---------------- Page ---------------- */
export default function Home() {
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.09 });
    const raf = (time: number) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    const id = requestAnimationFrame(raf);
    lenis.on("scroll", ScrollTrigger.update);
    return () => {
      cancelAnimationFrame(id);
      lenis.destroy();
    };
  }, []);

  return (
    <div>
      <Hero />
      <LiveDemoSection />
      <Pipeline />
      <FeatureGrid />
      <RedTeamSpotlight />
      <Benchmarks />
      <Compliance />
      <FinalCta />
    </div>
  );
}
