/** Deterministic mock FX — not a market feed. Labeled as such in every response. */

export const PAIRS = {
  "USD-MXN": { base: "USD", quote: "MXN", rate: 18.42, venue: "mock" },
  "USD-BRL": { base: "USD", quote: "BRL", rate: 5.41, venue: "mock" },
  "USD-ARS": { base: "USD", quote: "ARS", rate: 1420.0, venue: "mock" },
  "EUR-USD": { base: "EUR", quote: "USD", rate: 1.08, venue: "mock" },
  "USD-EUR": { base: "USD", quote: "EUR", rate: 0.926, venue: "mock" },
};

export function listPairs() {
  return Object.entries(PAIRS).map(([pair, row]) => ({
    pair,
    ...row,
    note: "Mock rate for the hackathon paywall. Not a live market.",
  }));
}

export function quote(pair) {
  const key = String(pair || "").trim().toUpperCase();
  const row = PAIRS[key];
  if (!row) {
    const err = new Error(
      `Unknown pair "${pair}". Use one of: ${Object.keys(PAIRS).join(", ")}`,
    );
    err.status = 400;
    throw err;
  }
  return {
    pair: key,
    ...row,
    asOf: new Date().toISOString(),
    source: "AgentPaywall mock FX (not a live market feed)",
  };
}
