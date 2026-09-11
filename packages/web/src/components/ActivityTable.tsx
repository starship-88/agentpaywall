import { formatUtc, kindLabel } from "../lib/format";
import type { EventKind, EventRow } from "../lib/types";

type Props = {
  events: EventRow[];
  compact?: boolean;
};

export function ActivityTable({ events, compact }: Props) {
  if (!events.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/12 px-4 py-12 text-center text-[13px] text-ap-muted">
        No payments yet. Run the agent CLI, or probe a market to log a 402.
      </div>
    );
  }

  const rows = compact ? events.slice(0, 8) : events;

  return (
    <div className="ap-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-white/8 text-[11px] tracking-wide text-ap-muted uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Kind</th>
              <th className="px-4 py-3 font-medium">Event</th>
              <th className="px-4 py-3 font-medium">Pair</th>
              <th className="px-4 py-3 font-medium text-right">Time</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id} className="border-b border-white/6 last:border-0 hover:bg-white/3">
                <td className="px-4 py-3">
                  <KindChip kind={e.kind} />
                </td>
                <td className="max-w-[420px] px-4 py-3 text-white/90">{e.message}</td>
                <td className="px-4 py-3 font-mono text-[12px] text-ap-muted">
                  {e.pair ?? "—"}
                </td>
                <td className="ap-num px-4 py-3 text-right text-[12px] text-ap-muted">
                  {formatUtc(e.at)}
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
  const styles: Record<EventKind, string> = {
    paid: "border-ap-ok/30 bg-ap-ok/12 text-ap-ok",
    "402": "border-ap-warn/35 bg-ap-warn/12 text-ap-warn",
    cap: "border-ap-danger/35 bg-ap-danger/12 text-ap-danger",
    error: "border-ap-danger/35 bg-ap-danger/12 text-ap-danger",
    info: "border-ap-cyan/25 bg-ap-cyan/10 text-ap-mint",
  };
  return <span className={`ap-badge ${styles[kind]}`}>{kindLabel(kind)}</span>;
}
