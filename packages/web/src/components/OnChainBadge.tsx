import type { MetricSource } from "../lib/format";

type Props = {
  source: MetricSource;
};

export function OnChainBadge({ source }: Props) {
  if (source === "stub") return null;
  if (source === "on-chain") {
    return (
      <span className="ap-badge border-ap-cyan/30 bg-ap-cyan/10 px-1.5 py-0 text-[10px] font-medium tracking-wide text-ap-cyan uppercase">
        on-chain
      </span>
    );
  }
  return (
    <span className="ap-badge border-ap-warn/30 bg-ap-warn/10 px-1.5 py-0 text-[10px] font-medium tracking-wide text-ap-warn uppercase">
      unavailable
    </span>
  );
}
