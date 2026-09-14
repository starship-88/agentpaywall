import { humanizeEvent, kindMessageKey } from "../lib/events";
import { formatDateTime } from "../lib/format";
import type { EventKind, EventRow } from "../lib/types";
import { useI18n } from "../lib/useI18n";

type Props = {
  events: EventRow[];
  compact?: boolean;
};

export function ActivityTable({ events, compact }: Props) {
  const { t, locale } = useI18n();

  if (!events.length) {
    return (
      <div className="rounded-2xl border border-dashed border-[rgba(90,70,180,0.16)] bg-white/60 px-4 py-12 text-center text-[13px] text-ap-muted">
        {t("activity.empty")}
      </div>
    );
  }

  const rows = compact ? events.slice(0, 8) : events;

  return (
    <div className="ap-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-[rgba(90,70,180,0.08)] text-[11px] tracking-wide text-ap-muted uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">{t("activity.kind")}</th>
              <th className="px-4 py-3 font-medium">{t("activity.event")}</th>
              <th className="px-4 py-3 font-medium">{t("activity.pair")}</th>
              <th className="px-4 py-3 font-medium text-right">{t("activity.time")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr
                key={e.id}
                className="border-b border-[rgba(90,70,180,0.06)] last:border-0 hover:bg-[rgba(123,108,255,0.03)]"
              >
                <td className="px-4 py-3">
                  <KindChip kind={e.kind} />
                </td>
                <td className="max-w-[420px] px-4 py-3 text-ap-ink/90">
                  {humanizeEvent(e, locale)}
                </td>
                <td className="px-4 py-3 font-mono text-[12px] text-ap-muted">
                  {e.pair ?? "—"}
                </td>
                <td className="ap-num px-4 py-3 text-right text-[12px] text-ap-muted">
                  {formatDateTime(e.at, locale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function KindChip({ kind }: { kind: EventKind }) {
  const { t } = useI18n();
  const styles: Record<EventKind, string> = {
    paid: "border-ap-ok/25 bg-ap-ok/10 text-ap-ok",
    "402": "border-ap-warn/30 bg-ap-warn/10 text-ap-warn",
    cap: "border-ap-danger/30 bg-ap-danger/10 text-ap-danger",
    error: "border-ap-danger/30 bg-ap-danger/10 text-ap-danger",
    info: "border-ap-purple/20 bg-[rgba(123,108,255,0.08)] text-ap-purple-deep",
  };
  return <span className={`ap-badge ${styles[kind]}`}>{t(kindMessageKey(kind))}</span>;
}
