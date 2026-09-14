import type { MetricSource } from "../lib/format";
import { useI18n } from "../lib/useI18n";

type Props = {
  source: MetricSource;
};

export function OnChainBadge({ source }: Props) {
  const { t } = useI18n();
  if (source === "stub") return null;
  if (source === "on-chain") {
    return (
      <span className="ap-badge border-ap-mint/25 bg-ap-mint/10 px-1.5 py-0 text-[10px] font-medium text-ap-mint">
        {t("badge.onChain")}
      </span>
    );
  }
  return (
    <span className="ap-badge border-ap-warn/30 bg-ap-warn/10 px-1.5 py-0 text-[10px] font-medium text-ap-warn">
      {t("badge.unavailable")}
    </span>
  );
}
