export type Mode = "stub" | "live";
export type EventKind = "info" | "402" | "paid" | "cap" | "error";
export type View = "dashboard" | "markets" | "activity" | "docs";

export type Budget = {
  dailyCapUsdc: number;
  spentUsdc: number;
  remainingUsdc: number;
  remainingBaseUnits: string;
  spentBaseUnits: string;
  dailyCapBaseUnits: string;
  priceBaseUnits: string;
  windowDay?: number;
};

export type PairRow = {
  pair: string;
  base: string;
  quote: string;
  rate: number;
  venue: string;
  note?: string;
};

export type EventRow = {
  id: string;
  at: string;
  kind: EventKind;
  message: string;
  pair?: string | null;
  price?: string;
  note?: string;
  remainingBaseUnits?: string;
};

export type Status = {
  service: string;
  mode: Mode;
  settle?: "stub" | "oz-facilitator";
  network: string;
  price: string;
  priceBaseUnits?: string;
  usdc: { issuer: string; sac: string };
  facilitatorUrl?: string;
  budget: Budget;
  verify: string[];
  docs: Record<string, string>;
  ozKeyGen: string;
  live?: {
    envReady: boolean;
    ozApiKey: boolean;
    recipientSet: boolean;
    recipientClassic: boolean;
    recipientPreview: string | null;
    recipient: string | null;
    payerSecretConfigured: boolean;
    facilitator: {
      url: string;
      probed: boolean;
      ok: boolean;
      error: string | null;
      kinds: string[];
    };
  };
  spendAccount?: {
    contractId: string | null;
    enforcesLiveTransfers: boolean;
    expectedFrom?: string | null;
    note: string;
    dailyLimitBaseUnits?: string | null;
    spentTodayBaseUnits?: string | null;
    remainingBaseUnits?: string | null;
    dailyLimitUsdc?: number | null;
    spentTodayUsdc?: number | null;
    remainingUsdc?: number | null;
    usdcBalanceBaseUnits?: string | null;
    usdcBalanceUsdc?: number | null;
    source?: "on-chain" | "unavailable";
    error?: string;
  };
  recipientHorizon?: unknown;
};

export type ProbeKind = "unpaid" | "paid" | "cap" | "error";

export type ProbeResult = {
  pair: string;
  httpStatus: number;
  kind: ProbeKind;
  paymentRequiredHeader: boolean;
  summary: string;
  body: unknown;
  at: string;
};
