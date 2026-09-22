import type { ReactNode } from "react";
import { NavLink, Link } from "react-router";
import {
  LayoutDashboard, ShieldCheck, SlidersHorizontal, ListX, Swords, Library,
  FlaskConical, Layers, Activity, AlertTriangle, Plug, KeyRound, Search, Bell,
  BookOpen, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./Navbar";

const NAV_GROUPS: { title: string; items: { to: string; label: string; icon: typeof Activity }[] }[] = [
  { title: "OVERVIEW", items: [{ to: "/gate", label: "Dashboard", icon: LayoutDashboard }] },
  {
    title: "GATE",
    items: [
      { to: "/gate", label: "Scanner Playground", icon: ShieldCheck },
      { to: "/policies", label: "Policies", icon: SlidersHorizontal },
      { to: "/policies", label: "Blocklists", icon: ListX },
    ],
  },
  {
    title: "ADVERSARIAL",
    items: [
      { to: "/redteam", label: "Red Team Lab", icon: Swords },
      { to: "/redteam", label: "Attack Library", icon: Library },
    ],
  },
  {
    title: "QUALITY",
    items: [
      { to: "/evaluations", label: "Evaluations", icon: FlaskConical },
      { to: "/evaluations", label: "Evaluators Catalog", icon: Layers },
    ],
  },
  {
    title: "SIGNALS",
    items: [
      { to: "/observability", label: "Observability", icon: Activity },
      { to: "/observability", label: "Incidents", icon: AlertTriangle },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      { to: "/integrations", label: "Integrations", icon: Plug },
      { to: "/integrations", label: "API Keys", icon: KeyRound },
    ],
  },
];

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold text-ink-hi">{title}</h1>
        {subtitle && <div className="mt-1 font-mono text-[12px] text-ink-low">{subtitle}</div>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export default function ConsoleShell({
  children,
  breadcrumb,
}: {
  children: ReactNode;
  breadcrumb?: string;
}) {
  return (
    <div className="flex min-h-[100dvh] bg-bg-0 text-ink-hi">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-[64px] flex-col border-r border-line bg-bg-1 xl:w-[240px]">
        <div className="flex h-14 items-center border-b border-line px-3 xl:px-4">
          <Link to="/" className="hidden xl:block"><Logo size={20} /></Link>
          <Link to="/" className="xl:hidden"><img src="/logo.svg" width={20} height={20} alt="AegisGate" /></Link>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-4">
          {NAV_GROUPS.map((g) => (
            <div key={g.title} className="mb-4">
              <div className="mb-1 hidden px-2 text-[10px] font-medium uppercase tracking-[0.1em] text-ink-low xl:block">
                {g.title}
              </div>
              {g.items.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "relative mb-0.5 flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] text-ink-mid hover:bg-bg-2 hover:text-ink-hi",
                      isActive && "bg-aegis-dim/20 text-aegis",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-aegis" />}
                      <item.icon size={16} className="shrink-0" />
                      <span className="hidden xl:inline">{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="border-t border-line p-3">
          <div className="mb-2 hidden items-center gap-2 xl:flex">
            <span className="rounded-full border border-aegis/40 bg-aegis/10 px-2 py-0.5 font-mono text-[10px] text-aegis">prod</span>
            <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[10px] text-ink-low">staging</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-aegis-dim font-mono text-[11px] text-aegis">AG</span>
            <a href="/integrations" className="hidden items-center gap-1 text-[12px] text-ink-low hover:text-ink-hi xl:flex">
              <BookOpen size={12} /> Docs
            </a>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="ml-[64px] flex min-h-[100dvh] flex-1 flex-col xl:ml-[240px]">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-bg-1/90 px-6 backdrop-blur-md">
          <span className="font-mono text-[12px] text-ink-low">{breadcrumb ?? "gate.aegisgate.dev/v1"}</span>
          <div className="flex items-center gap-4">
            <button className="hidden items-center gap-2 rounded-md border border-line bg-bg-2 px-3 py-1.5 font-mono text-[11px] text-ink-low hover:border-line-strong md:flex">
              <Search size={12} /> Search <span className="rounded border border-line px-1 text-[10px]">⌘K</span>
            </button>
            <span className="hidden items-center gap-1.5 font-mono text-[11px] text-ink-low lg:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-aegis pulse-dot" /> gate p50 41ms
            </span>
            <Link
              to="/gate"
              className="flex items-center gap-1.5 rounded-md border border-aegis/50 bg-aegis-dim/30 px-3 py-1.5 font-mono text-[12px] text-aegis hover:bg-aegis-dim/60"
            >
              <Plus size={13} /> New scan
            </Link>
            <Bell size={15} className="text-ink-low" />
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-aegis-dim font-mono text-[11px] text-aegis">AG</span>
          </div>
        </header>
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
