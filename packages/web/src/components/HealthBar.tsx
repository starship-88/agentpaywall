import { formatUsdc, healthTone, utilizationPct, type MetricSource } from "../lib/format";
import type { Budget } from "../lib/types";
import { useI18n } from "../lib/useI18n";
import { OnChainBadge } from "./OnChainBadge";

type Props = {
  budget: Budget | null;
  source: MetricSource;
  priceUsdc: number;
};

export function HealthBar({ budget, source, priceUsdc }: Props) {
  const { t, locale } = useI18n();
  const spent = budget?.spentUsdc ?? 0;
  const cap = budget?.dailyCapUsdc ?? 0;
  const remaining = budget?.remainingUsdc ?? 0;
  const pct = utilizationPct(spent, cap);
  const tone = source === "unavailable" ? "warn" : healthTone(remaining, cap, priceUsdc);
  const bar =
    tone === "danger" ? "bg-ap-danger" : tone === "warn" ? "bg-ap-warn" : "bg-ap-purple";
  const label =
    source === "unavailable"
      ? t("health.unavailable")
      : tone === "danger"
        ? remaining <= 0
          ? t("health.dangerEmpty")
          : t("health.dangerLow")
        : tone === "warn"
          ? t("health.warn")
          : t("health.ok");

  return (
    <article className="ap-card p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-ap-ink">{t("health.title")}</h2>
            <OnChainBadge source={source} />
          </div>
          <p className="mt-1 text-[13px] text-ap-body">{label}</p>
        </div>
        <p className="ap-num text-sm font-medium text-ap-ink">
          {t("health.utilized", { pct: pct.toFixed(1) })}
        </p>
      </div>
      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[rgba(123,108,255,0.1)]">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[12px] text-ap-muted">
        <span>{t("health.spent", { amount: budget ? formatUsdc(spent, 4, locale) : "—" })}</span>
        <span>{t("health.cap", { amount: budget ? formatUsdc(cap, 4, locale) : "—" })}</span>
      </div>
    </article>
  );
}
