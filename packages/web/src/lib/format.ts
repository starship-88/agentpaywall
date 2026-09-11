import type { Budget, EventKind, Status } from "./types";

export type MetricSource = "on-chain" | "stub" | "unavailable";

export function previewAddress(address?: string | null): string | null {
  const a = String(address || "");
  if (a.length < 12) return a || null;
  return `${a.slice(0, 5)}…${a.slice(-4)}`;
}

/** Cards use on-chain remaining/spent/limit when the C-account is live. */
export function metricBudget(status: Status | null): {
  budget: Budget | null;
  source: MetricSource;
  error?: string;
} {
  const sa = status?.spendAccount;
  const useChain =
    sa?.source === "on-chain" || Boolean(sa?.enforcesLiveTransfers);
  if (!useChain) {
    return { budget: status?.budget ?? null, source: "stub" };
  }
  if (sa.source === "on-chain") {
    return {
      budget: {
        dailyCapUsdc: sa.dailyLimitUsdc ?? 0,
        spentUsdc: sa.spentTodayUsdc ?? 0,
        remainingUsdc: sa.remainingUsdc ?? 0,
        remainingBaseUnits: String(sa.remainingBaseUnits ?? "0"),
        spentBaseUnits: String(sa.spentTodayBaseUnits ?? "0"),
        dailyCapBaseUnits: String(sa.dailyLimitBaseUnits ?? "0"),
        priceBaseUnits:
          status?.budget?.priceBaseUnits ?? status?.priceBaseUnits ?? "10000",
      },
      source: "on-chain",
    };
  }
  return { budget: null, source: "unavailable", error: sa.error };
}

export function formatUsdc(n?: number, digits = 4): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatRate(n?: number): string {
  if (n == null || Number.isNaN(n)) return "—";
  const digits = n >= 100 ? 2 : n >= 1 ? 4 : 6;
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: digits,
  });
}

export function formatUtc(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().replace("T", " ").replace(".000Z", " UTC").replace("Z", " UTC");
}

export function priceUsdcFromBudget(priceBaseUnits?: string, fallbackPrice?: string): number {
  if (priceBaseUnits != null && priceBaseUnits !== "") {
    const n = Number(priceBaseUnits) / 10_000_000;
    if (Number.isFinite(n)) return n;
  }
  if (fallbackPrice?.startsWith("$")) {
    const n = Number(fallbackPrice.slice(1));
    if (Number.isFinite(n)) return n;
  }
  return 0.001;
}

export function quotesLeft(remainingUsdc: number, priceUsdc: number): number {
  if (priceUsdc <= 0) return 0;
  return Math.max(0, Math.floor(remainingUsdc / priceUsdc + 1e-12));
}

export function utilizationPct(spent: number, cap: number): number {
  if (cap <= 0) return spent > 0 ? 100 : 0;
  return Math.min(100, Math.max(0, (spent / cap) * 100));
}

export function healthTone(remainingUsdc: number, capUsdc: number, priceUsdc: number) {
  if (capUsdc <= 0 || remainingUsdc <= 0 || remainingUsdc < priceUsdc) return "danger" as const;
  const ratio = remainingUsdc / capUsdc;
  if (ratio <= 0.15) return "warn" as const;
  return "ok" as const;
}

export function kindLabel(kind: EventKind): string {
  switch (kind) {
    case "paid":
      return "paid";
    case "402":
      return "402";
    case "cap":
      return "cap";
    case "error":
      return "error";
    default:
      return "info";
  }
}
