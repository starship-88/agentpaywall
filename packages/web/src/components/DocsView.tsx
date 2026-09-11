import type { Status } from "../lib/types";
import { IconExternal } from "./icons";

const LABELS: Record<string, string> = {
  x402: "x402 on Stellar",
  builtOnStellar: "Built on Stellar",
  quickstart: "Quickstart",
  spendLimits: "Spend limits pattern",
  complexAccount: "Complex account",
  demo: "Stellar x402 demo",
  npm: "@x402/stellar",
};

type Props = {
  status: Status | null;
};

export function DocsView({ status }: Props) {
  const docs = status?.docs ?? {};
  const entries = Object.entries(docs);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-white">Docs</h2>
        <p className="mt-1 text-[13px] text-ap-muted">
          Official Stellar x402 links from the API. No extra issuer, SAC, or facilitator URLs.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {entries.length === 0 ? (
          <div className="ap-card px-4 py-8 text-center text-sm text-ap-muted md:col-span-2">
            Docs appear once GET /v1/status succeeds.
          </div>
        ) : (
          entries.map(([key, href]) => (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="ap-card flex items-center justify-between gap-3 p-4 transition hover:border-ap-cyan/30 hover:bg-white/4"
            >
              <span>
                <span className="block text-sm font-medium text-white">
                  {LABELS[key] ?? key}
                </span>
                <span className="mt-1 block truncate font-mono text-[11px] text-ap-muted">
                  {href}
                </span>
              </span>
              <IconExternal className="h-4 w-4 shrink-0 text-ap-muted" />
            </a>
          ))
        )}
      </div>

      {status ? (
        <article className="ap-card space-y-3 p-5">
          <h3 className="text-sm font-semibold text-white">Network constants</h3>
          <dl className="grid gap-3 text-[13px] sm:grid-cols-2">
            <Row label="Network" value={status.network} />
            <Row label="Mode / settle" value={`${status.mode} · ${status.settle ?? "—"}`} />
            <Row label="USDC issuer" value={status.usdc.issuer} mono />
            <Row label="USDC SAC" value={status.usdc.sac} mono />
            <Row
              label="Facilitator"
              value={status.live?.facilitator.url ?? status.facilitatorUrl ?? "—"}
              mono
            />
            <Row
              label="Spend-account"
              value={status.spendAccount?.contractId ?? "not set"}
              mono
            />
            <Row
              label="On-chain cap"
              value={
                status.spendAccount?.enforcesLiveTransfers ||
                status.spendAccount?.source === "on-chain"
                  ? "yes — live from is the C…; cap-hit is DailyCapExceeded"
                  : "no — stub or classic G payer"
              }
            />
            <Row
              label="remaining (on-chain)"
              value={
                status.spendAccount?.source === "on-chain"
                  ? `${status.spendAccount.remainingUsdc ?? "—"} USDC (${status.spendAccount.remainingBaseUnits ?? "—"} base)`
                  : status.spendAccount?.error || "not simulated"
              }
              mono
            />
          </dl>
          {status.ozKeyGen ? (
            <p className="text-[12px] text-ap-muted">
              OZ API key:{" "}
              <a className="text-ap-cyan underline-offset-2 hover:underline" href={status.ozKeyGen}>
                {status.ozKeyGen}
              </a>
            </p>
          ) : null}
          {status.verify?.length ? (
            <ul className="list-disc space-y-1 pl-5 text-[13px] text-white/75">
              {status.verify.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          ) : null}
        </article>
      ) : null}
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-[11px] tracking-wide text-ap-muted uppercase">{label}</dt>
      <dd className={`mt-1 break-all text-white/85 ${mono ? "font-mono text-[12px]" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
