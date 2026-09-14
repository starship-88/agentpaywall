import type { Status } from "../lib/types";
import { useI18n } from "../lib/useI18n";
import { IconExternal } from "./icons";

const DOC_KEYS = [
  ["x402", "docs.linkX402"],
  ["builtOnStellar", "docs.linkBuilt"],
  ["quickstart", "docs.linkQuick"],
  ["spendLimits", "docs.linkSpend"],
  ["complexAccount", "docs.linkComplex"],
  ["demo", "docs.linkDemo"],
  ["npm", "docs.linkNpm"],
] as const;

type Props = {
  status: Status | null;
};

export function DocsView({ status }: Props) {
  const { t } = useI18n();
  const docs = status?.docs ?? {};
  const entries = DOC_KEYS.map(([key, labelKey]) => ({
    key,
    href: docs[key],
    label: t(labelKey),
  })).filter((e) => Boolean(e.href));
  const leftover = Object.entries(docs).filter(
    ([key]) => !DOC_KEYS.some(([known]) => known === key),
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[1.75rem] font-semibold tracking-tight text-ap-ink">
          {t("docs.title")}
        </h2>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ap-body">
          {t("docs.lead")}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Explain title={t("docs.whatTitle")} body={t("docs.whatBody")} />
        <Explain title={t("docs.humanTitle")} body={t("docs.humanBody")} />
        <Explain title={t("docs.agentTitle")} body={t("docs.agentBody")} />
        <Explain title={t("docs.chainTitle")} body={t("docs.chainBody")} />
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-ap-ink">{t("docs.links")}</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {entries.length === 0 && leftover.length === 0 ? (
            <div className="ap-card px-4 py-8 text-center text-sm text-ap-muted md:col-span-2">
              {t("docs.empty")}
            </div>
          ) : (
            <>
              {entries.map((entry) => (
                <DocLink key={entry.key} href={entry.href!} label={entry.label} />
              ))}
              {leftover.map(([key, href]) => (
                <DocLink key={key} href={href} label={key} />
              ))}
            </>
          )}
        </div>
      </div>

      {status ? (
        <article className="ap-card space-y-3 p-5">
          <h3 className="text-sm font-semibold text-ap-ink">{t("docs.constants")}</h3>
          <dl className="grid gap-3 text-[13px] sm:grid-cols-2">
            <Row label={t("docs.network")} value={status.network} />
            <Row
              label={t("docs.modeSettle")}
              value={`${status.mode} · ${status.settle ?? "—"}`}
            />
            <Row label={t("docs.usdcIssuer")} value={status.usdc.issuer} mono />
            <Row label={t("docs.usdcSac")} value={status.usdc.sac} mono />
            <Row
              label={t("docs.facilitator")}
              value={status.live?.facilitator.url ?? status.facilitatorUrl ?? "—"}
              mono
            />
            <Row
              label={t("docs.spendAccount")}
              value={status.spendAccount?.contractId ?? t("docs.notSet")}
              mono
            />
            <Row
              label={t("docs.onChainCap")}
              value={
                status.spendAccount?.enforcesLiveTransfers ||
                status.spendAccount?.source === "on-chain"
                  ? t("docs.onChainCapYes")
                  : t("docs.onChainCapNo")
              }
            />
            <Row
              label={t("docs.remainingOnChain")}
              value={
                status.spendAccount?.source === "on-chain"
                  ? `${status.spendAccount.remainingUsdc ?? "—"} USDC (${status.spendAccount.remainingBaseUnits ?? "—"} base)`
                  : status.spendAccount?.error || t("docs.remainingNone")
              }
              mono
            />
          </dl>
          {status.ozKeyGen ? (
            <p className="text-[12px] text-ap-muted">
              {t("docs.ozKey")}:{" "}
              <a
                className="text-ap-purple-deep underline-offset-2 hover:underline"
                href={status.ozKeyGen}
              >
                {status.ozKeyGen}
              </a>
            </p>
          ) : null}
          {status.verify?.length ? (
            <ul className="list-disc space-y-1 pl-5 text-[13px] text-ap-body">
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

function Explain({ title, body }: { title: string; body: string }) {
  return (
    <article className="ap-card p-5">
      <h3 className="text-sm font-semibold text-ap-ink">{title}</h3>
      <p className="mt-2 text-[13px] leading-relaxed text-ap-body">{body}</p>
    </article>
  );
}

function DocLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="ap-card flex items-center justify-between gap-3 p-4 transition hover:border-ap-purple/25"
    >
      <span>
        <span className="block text-sm font-medium text-ap-ink">{label}</span>
        <span className="mt-1 block truncate font-mono text-[11px] text-ap-muted">{href}</span>
      </span>
      <IconExternal className="h-4 w-4 shrink-0 text-ap-muted" />
    </a>
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
      <dd className={`mt-1 break-all text-ap-ink/85 ${mono ? "font-mono text-[12px]" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
