import { formatRate } from "../lib/format";
import type { PairRow, ProbeResult } from "../lib/types";

type Props = {
  pairs: PairRow[];
  loading: boolean;
  busy: boolean;
  probe: ProbeResult | null;
  onProbe: (pair: string) => void;
  embedded?: boolean;
};

export function MarketsTable({ pairs, loading, busy, probe, onProbe, embedded }: Props) {
  return (
    <div className="space-y-4">
      {embedded ? null : (
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white">Markets</h2>
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-ap-muted">
            Mock FX pairs behind <span className="font-mono text-ap-mint/90">GET /v1/fx</span>.
            Pay & quote from this browser is unpaid — expect{" "}
            <span className="text-ap-warn">402 PAYMENT-REQUIRED</span>. The agent CLI signs and retries.
          </p>
        </div>
      </div>
      )}

      <div className="ap-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-white/8 text-[11px] tracking-wide text-ap-muted uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Pair</th>
                <th className="px-4 py-3 font-medium">Rate</th>
                <th className="px-4 py-3 font-medium">Venue</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && pairs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-ap-muted">
                    Loading markets…
                  </td>
                </tr>
              ) : null}
              {!loading && pairs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-ap-muted">
                    No pairs from the API. Confirm GET /v1/pairs.
                  </td>
                </tr>
              ) : null}
              {pairs.map((row) => (
                <tr
                  key={row.pair}
                  className="border-b border-white/6 last:border-0 hover:bg-white/3"
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <PairGlyph pair={row.pair} />
                      <div>
                        <div className="font-medium text-white">{row.pair}</div>
                        <div className="text-[11px] text-ap-muted">
                          {row.base} → {row.quote}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="ap-num px-4 py-3.5 text-white">{formatRate(row.rate)}</td>
                  <td className="px-4 py-3.5">
                    <span className="ap-badge">{row.venue}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      className="ap-btn-primary h-9 px-3 text-[13px]"
                      disabled={busy}
                      onClick={() => onProbe(row.pair)}
                    >
                      Pay & quote
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {embedded ? null : <ProbePanel probe={probe} />}
    </div>
  );
}

function PairGlyph({ pair }: { pair: string }) {
  const [a, b] = pair.split("-");
  return (
    <div className="relative h-9 w-11 shrink-0">
      <span className="absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#1a2740] text-[9px] font-semibold text-ap-mint ring-2 ring-ap-card">
        {(a ?? "?").slice(0, 2)}
      </span>
      <span className="absolute right-0 bottom-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#243018] text-[9px] font-semibold text-ap-cyan ring-2 ring-ap-card">
        {(b ?? "?").slice(0, 2)}
      </span>
    </div>
  );
}

function ProbePanel({ probe }: { probe: ProbeResult | null }) {
  if (!probe) {
    return (
      <div className="rounded-2xl border border-dashed border-white/12 px-4 py-8 text-center text-[13px] text-ap-muted">
        No quote yet. Pay & quote probes an unpaid GET /v1/fx and should return 402.
      </div>
    );
  }

  const tone =
    probe.kind === "paid"
      ? "border-ap-ok/30 bg-ap-ok/8"
      : probe.kind === "cap"
        ? "border-ap-danger/35 bg-ap-danger/8"
        : probe.kind === "unpaid"
          ? "border-ap-warn/30 bg-ap-warn/8"
          : "border-ap-danger/30 bg-ap-danger/8";

  return (
    <article className={`rounded-2xl border px-4 py-4 ${tone}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="ap-badge font-mono">{probe.httpStatus}</span>
        <span className="ap-badge">{probe.kind}</span>
        {probe.paymentRequiredHeader ? (
          <span className="ap-badge border-ap-cyan/30 text-ap-mint">PAYMENT-REQUIRED</span>
        ) : null}
        <span className="font-mono text-[12px] text-ap-muted">{probe.pair}</span>
      </div>
      <p className="mt-3 text-sm text-white/90">{probe.summary}</p>
      <pre className="mt-3 max-h-48 overflow-auto rounded-xl bg-black/35 p-3 font-mono text-[11px] leading-relaxed text-white/65">
        {JSON.stringify(probe.body, null, 2)}
      </pre>
    </article>
  );
}
