import type { View } from "../lib/types";
import { useI18n } from "../lib/useI18n";
import {
  BrandMark,
  IconActivity,
  IconClose,
  IconDocs,
  IconGrid,
  IconMarkets,
} from "./icons";
import { LanguageSwitch } from "./LanguageSwitch";

type Props = {
  view: View;
  onNavigate: (view: View) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

export function Sidebar({ view, onNavigate, mobileOpen, onCloseMobile }: Props) {
  const { t } = useI18n();

  const nav = [
    { id: "dashboard" as const, label: t("nav.overview"), hint: t("nav.overviewHint"), Icon: IconGrid },
    { id: "markets" as const, label: t("nav.markets"), hint: t("nav.marketsHint"), Icon: IconMarkets },
    { id: "activity" as const, label: t("nav.activity"), hint: t("nav.activityHint"), Icon: IconActivity },
    { id: "docs" as const, label: t("nav.docs"), hint: t("nav.docsHint"), Icon: IconDocs },
  ];

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-[#1f1f29]/30 backdrop-blur-sm lg:hidden ${
          mobileOpen ? "block" : "hidden"
        }`}
        onClick={onCloseMobile}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col border-r border-[rgba(90,70,180,0.08)] bg-white/95 backdrop-blur-xl transition-transform duration-200 lg:hidden ${
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
              <div className="truncate text-[15px] font-semibold tracking-tight text-ap-ink">
                {t("brand.name")}
              </div>
              <div className="text-[11px] text-ap-muted">{t("brand.tagline")}</div>
            </div>
          </a>
          <button
            type="button"
            className="rounded-full p-1.5 text-ap-muted hover:bg-[rgba(123,108,255,0.08)]"
            onClick={onCloseMobile}
            aria-label={t("top.closeMenu")}
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-1 flex flex-1 flex-col gap-1 px-3">
          {nav.map(({ id, label, hint, Icon }) => {
            const active = view === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onNavigate(id)}
                className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${
                  active
                    ? "bg-[rgba(123,108,255,0.12)] text-ap-purple-deep"
                    : "text-ap-body hover:bg-[rgba(123,108,255,0.06)] hover:text-ap-ink"
                }`}
              >
                <Icon
                  className={`h-[18px] w-[18px] ${
                    active ? "text-ap-purple" : "text-ap-muted group-hover:text-ap-ink"
                  }`}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="block truncate text-[11px] text-ap-muted">{hint}</span>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="mx-3 mb-4 space-y-3">
          <LanguageSwitch />
          <p className="rounded-2xl border border-[rgba(90,70,180,0.08)] bg-[rgba(123,108,255,0.05)] px-3 py-3 text-[12px] leading-relaxed text-ap-body">
            {t("overview.lead")}
          </p>
        </div>
      </aside>
    </>
  );
}
