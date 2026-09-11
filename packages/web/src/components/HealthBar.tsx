import { healthTone, utilizationPct, type MetricSource } from "../lib/format";
import type { Budget } from "../lib/types";
import { OnChainBadge } from "./OnChainBadge";

type Props = {
  budget: Budget | null;
  source: MetricSource;
  priceUsdc: number;
};

export function HealthBar({ budget, source, priceUsdc }: Props) {
  const spent = budget?.spentUsdc ?? 0;
  const cap = budget?.dailyCapUsdc ?? 0;
  const remaining = budget?.remainingUsdc ?? 0;
  const pct = utilizationPct(spent, cap);
  const tone =
    source === "unavailable" ? "warn" : healthTone(remaining, cap, priceUsdc);
  const bar =
    tone === "danger" ? "bg-ap-danger" : tone === "warn" ? "bg-ap-warn" : "bg-ap-cyan";
  const label =
    source === "unavailable"
      ? "On-chain remaining unavailable — RPC timed out or failed"
      : tone === "danger"
        ? remaining <= 0
          ? "Cap exhausted — next pay is refused"
          : "Below one quote — next request hits the cap"
        : tone === "warn"
          ? "Low remaining — watch the agent loop"
          : "Healthy remaining vs daily cap";

  return (
    <article className="ap-card p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white">Cap health</h2>
            <OnChainBadge source={source} />
          </div>
          <p className="mt-1 text-[12px] text-ap-muted">{label}</p>
        </div>
        <p className="ap-num text-sm text-white">
          {pct.toFixed(1)}
          <span className="text-ap-muted">% utilized</span>
        </p>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between font-mono text-[11px] text-ap-muted">
        <span>spent {budget ? spent.toFixed(4) : "—"}</span>
        <span>cap {budget ? `${cap.toFixed(4)} USDC` : "—"}</span>
      </div>
    </article>
  );
}
