import { formatRate, formatUsdc } from "../lib/format";
import type { PairRow, ProbeResult } from "../lib/types";
import { useI18n } from "../lib/useI18n";

type Props = {
  pairs: PairRow[];
  loading: boolean;
  busy: boolean;
  probe: ProbeResult | null;
  onProbe: (pair: string) => void;
  embedded?: boolean;
  priceUsdc?: number;
};

export function MarketsTable({
  pairs,
  loading,
  busy,
  probe,
  onProbe,
  embedded,
  priceUsdc = 0.001,
}: Props) {
  const { t, locale } = useI18n();

  return (
    <div className="space-y-4">
      {embedded ? null : (
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-[1.75rem] font-semibold tracking-tight text-ap-ink">
              {t("markets.title")}
            </h2>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ap-body">
              {t("markets.lead")}
            </p>
          </div>
        </div>
      )}

      <div className="ap-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-[rgba(90,70,180,0.08)] text-[11px] tracking-wide text-ap-muted uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">{t("markets.pair")}</th>
                <th className="px-4 py-3 font-medium">{t("markets.rate")}</th>
                <th className="px-4 py-3 font-medium">{t("markets.venue")}</th>
                <th className="px-4 py-3 font-medium text-right">{t("markets.action")}</th>
              </tr>
            </thead>
            <tbody>
              {loading && pairs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-ap-muted">
                    {t("markets.loading")}
                  </td>
                </tr>
              ) : null}
              {!loading && pairs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-ap-muted">
                    {t("markets.empty")}
                  </td>
                </tr>
              ) : null}
              {pairs.map((row) => (
                <tr
                  key={row.pair}
                  className="border-b border-[rgba(90,70,180,0.06)] last:border-0 hover:bg-[rgba(123,108,255,0.03)]"
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <PairGlyph pair={row.pair} />
                      <div>
                        <div className="font-medium text-ap-ink">{row.pair}</div>
                        <div className="text-[11px] text-ap-muted">
                          {row.base} → {row.quote}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="ap-num px-4 py-3.5 text-ap-ink">
                    {formatRate(row.rate, locale)}
                  </td>
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
                      {t("markets.pay")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {embedded ? null : <ProbePanel probe={probe} priceUsdc={priceUsdc} />}
    </div>
  );
}

function PairGlyph({ pair }: { pair: string }) {
  const [a, b] = pair.split("-");
  return (
    <div className="relative h-9 w-11 shrink-0">
      <span className="absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#ece7ff] text-[9px] font-semibold text-ap-purple-deep ring-2 ring-white">
        {(a ?? "?").slice(0, 2)}
      </span>
      <span className="absolute right-0 bottom-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#d9f5e8] text-[9px] font-semibold text-ap-mint ring-2 ring-white">
        {(b ?? "?").slice(0, 2)}
      </span>
    </div>
  );
}

function ProbePanel({ probe, priceUsdc }: { probe: ProbeResult | null; priceUsdc: number }) {
  const { t, locale } = useI18n();

  if (!probe) {
    return (
      <div className="rounded-2xl border border-dashed border-[rgba(90,70,180,0.16)] bg-white/60 px-4 py-8 text-center text-[13px] text-ap-muted">
        {t("markets.probeEmpty")}
      </div>
    );
  }

  const tone =
    probe.kind === "paid"
      ? "border-ap-ok/25 bg-ap-ok/5"
      : probe.kind === "cap"
        ? "border-ap-danger/25 bg-ap-danger/5"
        : probe.kind === "unpaid"
          ? "border-ap-warn/25 bg-ap-warn/5"
          : "border-ap-danger/20 bg-ap-danger/5";

  const kindLabel =
    probe.kind === "paid"
      ? t("markets.kindPaid")
      : probe.kind === "cap"
        ? t("markets.kindCap")
        : probe.kind === "unpaid"
          ? t("markets.kindUnpaid")
          : t("markets.kindError");

  const summary =
    probe.kind === "cap"
      ? t("markets.probeCap", {
          remaining: formatUsdc(probe.remainingUsdc ?? 0, 4, locale),
        })
      : probe.kind === "unpaid"
        ? t("markets.probeUnpaid", { price: formatUsdc(priceUsdc, 3, locale) })
        : probe.kind === "paid"
          ? t("markets.probePaid", {
              pair: probe.pair,
              rate: probe.rate ?? "—",
              source: probe.source ?? "FX",
            })
          : t("markets.probeError", { status: probe.httpStatus || "—" });

  return (
    <article className={`rounded-2xl border px-4 py-4 ${tone}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="ap-badge font-mono">{probe.httpStatus}</span>
        <span className="ap-badge">{kindLabel}</span>
        {probe.code === "DAILY_CAP_EXCEEDED" ? (
          <span className="ap-badge border-ap-danger/25 text-ap-danger">{t("activity.kindCap")}</span>
        ) : null}
        {probe.paymentRequiredHeader ? (
          <span className="ap-badge">{t("markets.paymentRequired")}</span>
        ) : null}
        <span className="font-mono text-[12px] text-ap-muted">{probe.pair}</span>
      </div>
      <p className="mt-3 text-sm text-ap-ink/90">{summary}</p>
      <pre className="mt-3 max-h-48 overflow-auto rounded-xl bg-[#f6f3ff] p-3 font-mono text-[11px] leading-relaxed text-ap-body">
        {JSON.stringify(probe.body, null, 2)}
      </pre>
    </article>
  );
}
