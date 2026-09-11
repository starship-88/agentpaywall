import { formatUsdc, quotesLeft, type MetricSource } from "../lib/format";
import type { Budget } from "../lib/types";
import { OnChainBadge } from "./OnChainBadge";

type Props = {
  budget: Budget | null;
  source: MetricSource;
  priceLabel: string;
  priceUsdc: number;
  loading: boolean;
};

export function MetricCards({ budget, source, priceLabel, priceUsdc, loading }: Props) {
  const left = budget ? quotesLeft(budget.remainingUsdc, priceUsdc) : 0;
  const items = [
    {
      label: "Daily cap",
      value: formatUsdc(budget?.dailyCapUsdc),
      hint: source === "on-chain" ? "USDC / UTC day on-chain" : "USDC / UTC day",
      accent: "from-ap-cyan/25",
      badge: true,
    },
    {
      label: "Spent",
      value: formatUsdc(budget?.spentUsdc),
      hint: source === "on-chain" ? "spent_today" : "This window",
      accent: "from-indigo-400/20",
      badge: true,
    },
    {
      label: "Remaining",
      value: formatUsdc(budget?.remainingUsdc),
      hint:
        source === "unavailable"
          ? "RPC did not return remaining"
          : `${left} quote${left === 1 ? "" : "s"} left`,
      accent: "from-ap-ok/20",
      badge: true,
    },
    {
      label: "Price / request",
      value: priceLabel || "—",
      hint: "x402 Exact USDC",
      accent: "from-ap-mint/15",
      badge: false,
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <article key={item.label} className="ap-card relative overflow-hidden p-4">
          <div
            className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${item.accent} to-transparent`}
          />
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-medium tracking-wide text-ap-muted uppercase">
              {item.label}
            </p>
            {item.badge ? <OnChainBadge source={source} /> : null}
          </div>
          {loading && !budget && source !== "unavailable" ? (
            <div className="mt-3 h-8 w-28 animate-pulse rounded-md bg-white/8" />
          ) : (
            <p className="ap-num mt-2 text-[1.65rem] font-semibold tracking-tight text-white">
              {item.value}
            </p>
          )}
          <p className="mt-1 text-[12px] text-ap-muted">{item.hint}</p>
        </article>
      ))}
    </section>
  );
}
