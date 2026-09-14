import { formatUsdc, quotesLeft, type MetricSource } from "../lib/format";
import { quotesLeftLabel } from "../lib/i18n";
import type { Budget } from "../lib/types";
import { useI18n } from "../lib/useI18n";
import { OnChainBadge } from "./OnChainBadge";

type Props = {
  budget: Budget | null;
  source: MetricSource;
  priceLabel: string;
  priceUsdc: number;
  loading: boolean;
};

export function MetricCards({ budget, source, priceLabel, priceUsdc, loading }: Props) {
  const { t, locale } = useI18n();
  const left = budget ? quotesLeft(budget.remainingUsdc, priceUsdc) : 0;
  const items = [
    {
      key: "cap",
      label: t("metric.dailyBudget"),
      value: formatUsdc(budget?.dailyCapUsdc, 4, locale),
      hint: source === "on-chain" ? t("metric.dailyBudgetHintOnChain") : t("metric.dailyBudgetHint"),
      valueClass: "text-ap-ink",
      badge: true,
    },
    {
      key: "spent",
      label: t("metric.spent"),
      value: formatUsdc(budget?.spentUsdc, 4, locale),
      hint: source === "on-chain" ? t("metric.spentHintOnChain") : t("metric.spentHint"),
      valueClass: "text-ap-ink",
      badge: true,
    },
    {
      key: "left",
      label: t("metric.remaining"),
      value: formatUsdc(budget?.remainingUsdc, 4, locale),
      hint:
        source === "unavailable"
          ? t("metric.remainingUnavailable")
          : quotesLeftLabel(left, locale),
      valueClass: "text-ap-mint",
      badge: true,
    },
    {
      key: "price",
      label: t("metric.price"),
      value: priceLabel || "—",
      hint: t("metric.priceHint"),
      valueClass: "text-ap-ink",
      badge: false,
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <article key={item.key} className="ap-card p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[12px] font-medium text-ap-muted">{item.label}</p>
            {item.badge ? <OnChainBadge source={source} /> : null}
          </div>
          {loading && !budget && source !== "unavailable" ? (
            <div className="mt-3 h-8 w-28 animate-pulse rounded-md bg-[rgba(123,108,255,0.1)]" />
          ) : (
            <p className={`ap-num mt-2 text-[1.7rem] font-semibold tracking-tight ${item.valueClass}`}>
              {item.value}
            </p>
          )}
          <p className="mt-1 text-[12px] text-ap-muted">{item.hint}</p>
        </article>
      ))}
    </section>
  );
}
