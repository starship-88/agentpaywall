import type { View } from "../lib/types";
import {
  BrandMark,
  IconActivity,
  IconClose,
  IconDocs,
  IconGrid,
  IconMarkets,
} from "./icons";

const NAV: { id: View; label: string; hint: string; Icon: typeof IconGrid }[] = [
  { id: "dashboard", label: "Dashboard", hint: "Cap, spend, health", Icon: IconGrid },
  { id: "markets", label: "Markets", hint: "FX pairs · unpaid 402", Icon: IconMarkets },
  { id: "activity", label: "Activity", hint: "Paid / 402 / cap log", Icon: IconActivity },
  { id: "docs", label: "Docs", hint: "x402 + Stellar constants", Icon: IconDocs },
];

type Props = {
  view: View;
  onNavigate: (view: View) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

export function Sidebar({ view, onNavigate, mobileOpen, onCloseMobile }: Props) {
  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-black/55 backdrop-blur-sm lg:hidden ${
          mobileOpen ? "block" : "hidden"
        }`}
        onClick={onCloseMobile}
      />
      <aside
        className={`ap-sidebar fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-white/8 bg-ap-sidebar/95 backdrop-blur-xl transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-5">
          <a
            href="#/dashboard"
            className="flex items-center gap-3"
            onClick={() => onNavigate("dashboard")}
          >
            <BrandMark className="h-9 w-9 shrink-0" />
            <div className="min-w-0">
              <div className="truncate text-[15px] font-semibold tracking-tight text-white">
                AgentPaywall
              </div>
              <div className="text-[11px] tracking-wide text-ap-muted uppercase">
                Daily cap console
              </div>
            </div>
          </a>
          <button
            type="button"
            className="rounded-lg p-1.5 text-ap-muted hover:bg-white/5 lg:hidden"
            onClick={onCloseMobile}
            aria-label="Close menu"
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-1 flex flex-1 flex-col gap-1 px-3">
          {NAV.map(({ id, label, hint, Icon }) => {
            const active = view === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onNavigate(id)}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                  active
                    ? "bg-ap-cyan/12 text-white shadow-[inset_0_0_0_1px_rgba(46,199,192,0.28)]"
                    : "text-ap-muted hover:bg-white/4 hover:text-white"
                }`}
              >
                <Icon
                  className={`h-[18px] w-[18px] ${active ? "text-ap-cyan" : "text-ap-muted group-hover:text-white"}`}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="block truncate text-[11px] text-ap-muted/90">{hint}</span>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="mx-3 mb-4 rounded-xl border border-white/8 bg-white/3 px-3 py-3">
          <p className="text-[11px] leading-relaxed text-ap-muted">
            Humans set the USDC cap here. Agents pay per request with x402 on{" "}
            <span className="font-mono text-ap-mint/90">stellar:testnet</span>.
          </p>
        </div>
      </aside>
    </>
  );
}
