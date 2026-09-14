import { formatDateTime, previewAddress } from "../lib/format";
import type { Status, View } from "../lib/types";
import { useI18n } from "../lib/useI18n";
import { LanguageSwitch } from "./LanguageSwitch";
import { BrandMark, IconMenu, IconRefresh } from "./icons";

const NAV: View[] = ["dashboard", "markets", "activity", "docs"];

type Props = {
  view: View;
  status: Status | null;
  loading: boolean;
  onRefresh: () => void;
  onOpenMenu: () => void;
  onNavigate: (view: View) => void;
  updatedAt: string | null;
};

function navLabel(view: View, t: ReturnType<typeof useI18n>["t"]) {
  switch (view) {
    case "dashboard":
      return t("nav.overview");
    case "markets":
      return t("nav.markets");
    case "activity":
      return t("nav.activity");
    default:
      return t("nav.docs");
  }
}

export function TopBar({
  view,
  status,
  loading,
  onRefresh,
  onOpenMenu,
  onNavigate,
  updatedAt,
}: Props) {
  const { t, locale } = useI18n();
  const mode = status?.mode;
  const network = status?.network ?? "stellar:testnet";
  const settle = status?.settle;
  const contractId = status?.spendAccount?.contractId;
  const contractPreview = contractId ? previewAddress(contractId) : null;
  const refreshTitle = updatedAt
    ? t("top.refreshTitle", { time: formatDateTime(updatedAt, locale) })
    : t("top.refresh");

  return (
    <header className="sticky top-0 z-20 border-b border-[rgba(90,70,180,0.08)] bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="rounded-full p-2 text-ap-body hover:bg-[rgba(123,108,255,0.08)] lg:hidden"
            onClick={onOpenMenu}
            aria-label={t("top.menu")}
          >
            <IconMenu className="h-5 w-5" />
          </button>
          <a
            href="#/dashboard"
            className="flex min-w-0 items-center gap-2.5"
            onClick={() => onNavigate("dashboard")}
          >
            <BrandMark className="h-9 w-9 shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold tracking-tight text-ap-ink">
                {t("brand.name")}
              </p>
              <p className="hidden truncate text-[11px] text-ap-muted sm:block">
                {t("top.subtitle")}
              </p>
            </div>
          </a>
        </div>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label={t("brand.name")}>
          {NAV.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className={`ap-nav-link ${view === id ? "is-active" : ""}`}
            >
              {navLabel(id, t)}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitch />
          <span className="ap-badge hidden font-mono sm:inline-flex">{network}</span>
          {mode ? (
            <span
              className={`ap-badge hidden sm:inline-flex ${
                mode === "live"
                  ? "border-ap-ok/25 bg-ap-ok/10 text-ap-ok"
                  : "border-ap-purple/20 bg-[rgba(123,108,255,0.08)] text-ap-purple-deep"
              }`}
              title={settle ? `settle: ${settle}` : undefined}
            >
              {mode === "live" ? t("badge.live") : t("badge.stub")}
            </span>
          ) : (
            <span className="ap-badge hidden text-ap-muted sm:inline-flex">
              {t("badge.connecting")}
            </span>
          )}
          {contractPreview ? (
            <span
              className="ap-badge hidden font-mono text-ap-purple-deep xl:inline-flex"
              title={contractId ?? undefined}
            >
              {contractPreview}
            </span>
          ) : null}
          <button
            type="button"
            className="ap-btn-ghost h-9 px-3"
            onClick={onRefresh}
            disabled={loading}
            title={refreshTitle}
          >
            <IconRefresh className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{t("top.refresh")}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
