import type { Budget, EventRow, PairRow, ProbeResult, Status } from "./types";

export const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:40211";

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { raw: text };
  }
}

export async function fetchStatus(): Promise<Status> {
  const res = await fetch(`${API_URL}/v1/status`);
  if (!res.ok) throw new Error(`status ${res.status}`);
  return (await res.json()) as Status;
}

export async function fetchActivity(): Promise<{
  events: EventRow[];
  budget: Budget;
  spendAccount?: Status["spendAccount"];
}> {
  const res = await fetch(`${API_URL}/v1/activity`);
  if (!res.ok) throw new Error(`activity ${res.status}`);
  return (await res.json()) as {
    events: EventRow[];
    budget: Budget;
    spendAccount?: Status["spendAccount"];
  };
}

export async function fetchPairs(): Promise<PairRow[]> {
  const res = await fetch(`${API_URL}/v1/pairs`);
  if (!res.ok) throw new Error(`pairs ${res.status}`);
  const body = (await res.json()) as { pairs: PairRow[] };
  return body.pairs ?? [];
}

export async function setDailyCap(dailyLimitUsdc: number): Promise<Budget> {
  const res = await fetch(`${API_URL}/v1/budget`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dailyLimitUsdc }),
  });
  const body = (await readJson(res)) as { error?: string; budget?: Budget };
  if (!res.ok) throw new Error(body.error || "Could not save daily cap");
  if (!body.budget) throw new Error("Budget missing from response");
  return body.budget;
}

export async function resetBudgetWindow(): Promise<Budget> {
  const res = await fetch(`${API_URL}/v1/budget/reset`, { method: "POST" });
  const body = (await readJson(res)) as { error?: string; budget?: Budget };
  if (!res.ok) throw new Error(body.error || "Could not reset window");
  if (!body.budget) throw new Error("Budget missing from response");
  return body.budget;
}

export async function probeFx(pair: string): Promise<ProbeResult> {
  const res = await fetch(`${API_URL}/v1/fx?pair=${encodeURIComponent(pair)}`);
  const paymentRequiredHeader = Boolean(res.headers.get("PAYMENT-REQUIRED"));
  const body = await readJson(res);
  const rec = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const error = typeof rec.error === "string" ? rec.error : "";

  let kind: ProbeResult["kind"] = "error";
  let summary: string;

  if (error === "DAILY_CAP_EXCEEDED" || res.status === 402 && error.includes("CAP")) {
    kind = "cap";
    const remaining =
      typeof rec.remainingUsdc === "number" ? formatRemaining(rec.remainingUsdc) : "0";
    summary = `Daily cap would be exceeded. Remaining ${remaining} USDC. This request was not settled.`;
  } else if (res.status === 402 || error === "PAYMENT_REQUIRED") {
    kind = "unpaid";
    summary =
      "PAYMENT-REQUIRED. This UI does not sign. Run the agent CLI to pay $0.001 USDC and retry.";
  } else if (res.ok && typeof rec.rate === "number") {
    kind = "paid";
    summary = `Paid quote ${pair} @ ${rec.rate} (${String(rec.source ?? "FX")}).`;
  } else {
    kind = "error";
    summary =
      typeof rec.message === "string"
        ? rec.message
        : typeof rec.error === "string"
          ? rec.error
          : `Unexpected ${res.status}`;
  }

  return {
    pair,
    httpStatus: res.status,
    kind,
    paymentRequiredHeader,
    summary,
    body,
    at: new Date().toISOString(),
  };
}

function formatRemaining(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
}
