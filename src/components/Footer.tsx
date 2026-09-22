import { Link } from "react-router";
import { Logo } from "./Navbar";

const COLS: { title: string; links: { label: string; to: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Gate API", to: "/gate" },
      { label: "Policy Studio", to: "/policies" },
      { label: "Red Team Lab", to: "/redteam" },
      { label: "Evaluation Studio", to: "/evaluations" },
      { label: "Observability", to: "/observability" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Docs", to: "/integrations" },
      { label: "PyRIT adapter", to: "/redteam" },
      { label: "OWASP mapping", to: "/integrations" },
      { label: "Changelog", to: "/" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", to: "/" },
      { label: "Security", to: "/" },
      { label: "Careers", to: "/" },
      { label: "Contact", to: "/" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-line bg-bg-1">
      <div className="mx-auto max-w-[1200px] px-6 py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2">
            <Logo />
            <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-ink-mid">
              One gate. Every model. Total control. Guardrails, red teaming and evaluation as a service.
            </p>
            <div className="mt-4 flex items-center gap-2 font-mono text-[11px] text-ink-low">
              <span className="h-1.5 w-1.5 rounded-full bg-aegis pulse-dot" />
              All systems nominal
            </div>
          </div>
          {COLS.map((c) => (
            <div key={c.title}>
              <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-ink-low">{c.title}</div>
              <ul className="mt-3 space-y-2">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-[13px] text-ink-mid hover:text-aegis">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
          <span className="font-mono text-[11px] text-ink-low">© 2025 AegisGate · aegis-gate v2.4.1</span>
          <div className="flex gap-2">
            {["SOC 2 Type II", "ISO 27001", "EU AI Act ready"].map((b) => (
              <span key={b} className="rounded-full border border-line px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-low">
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
