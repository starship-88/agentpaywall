import cors from "cors";
import express from "express";
import { config, facilitatorState, liveStatusFields, verifyNotes } from "./config.js";
import { DOCS, OZ_KEY_GEN_URL, USDC_ISSUER, USDC_SAC } from "./constants.js";
import { listPairs, quote } from "./fx.js";
import { loadAccount } from "./horizon.js";
import { createPaywall } from "./paywall.js";
import { loadSpendAccountStatus } from "./spend-account-view.js";
import { createStore } from "./store.js";

const store = createStore(config.dailyCapUsdc, config.priceBaseUnits);
const app = express();

app.disable("x-powered-by");
app.use(
  cors({
    origin: true,
    exposedHeaders: [
      "PAYMENT-REQUIRED",
      "PAYMENT-SIGNATURE",
      "PAYMENT-RESPONSE",
    ],
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "agentpaywall-api",
    mode: config.mode,
    settle: config.mode === "live" ? "oz-facilitator" : "stub",
  });
});

app.get("/v1/status", async (_req, res) => {
  const [recipientHorizon, spendAccount] = await Promise.all([
    config.recipientClassic
      ? loadAccount(config.horizonUrl, config.recipient).catch((err) => ({
          exists: false,
          reason: err.message,
        }))
      : Promise.resolve(null),
    loadSpendAccountStatus(),
  ]);
  res.json({
    service: "AgentPaywall",
    ...liveStatusFields(),
    spendAccount,
    price: config.price,
    priceBaseUnits: config.priceBaseUnits.toString(),
    usdc: { issuer: USDC_ISSUER, sac: USDC_SAC },
    recipientHorizon,
    budget: store.snapshot(),
    verify: [
      ...verifyNotes(),
      ...(config.mode === "live" && facilitatorState.error
        ? [`Facilitator: ${facilitatorState.error}`]
        : []),
    ],
    docs: DOCS,
    ozKeyGen: OZ_KEY_GEN_URL,
  });
});

app.get("/v1/pairs", (_req, res) => {
  res.json({ pairs: listPairs() });
});

app.get("/v1/activity", async (_req, res) => {
  const spendAccount = await loadSpendAccountStatus();
  res.json({
    events: store.events(),
    budget: store.snapshot(),
    spendAccount,
  });
});

app.post("/v1/budget", (req, res) => {
  try {
    const raw = req.body?.dailyLimitUsdc ?? req.body?.dailyCapUsdc;
    const next = Number(raw);
    const budget = store.setDailyCapUsdc(next);
    res.json({
      ok: true,
      budget,
      stubOnly: Boolean(config.spendAccountContractId),
      note: config.spendAccountContractId
        ? "Stub/UI only. This updates the in-memory dashboard store. It does not call set_daily_limit and does not move the live __check_auth cap."
        : config.mode === "live"
          ? "Live settle is gated by this daily cap before the facilitator is called when no spend-account C... is set."
          : "STUB dashboard cap. VERIFY: set OZ_API_KEY + STELLAR_RECIPIENT for live settle.",
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/v1/budget/reset", (_req, res) => {
  res.json({
    ok: true,
    budget: store.resetWindow(),
    note: "Resets the in-memory dashboard window only.",
  });
});

async function main() {
  const paywall = await createPaywall(config, store);
  app.use(paywall);

  app.get("/v1/fx", (req, res) => {
    try {
      const pair = req.query.pair || "USD-MXN";
      const data = quote(pair);
      res.json({
        ...data,
        paid: {
          mode: config.mode,
          network: config.network,
          asset: "USDC",
          sac: USDC_SAC,
          price: config.price,
        },
      });
    } catch (err) {
      res.status(err.status || 400).json({ error: err.message });
    }
  });

  app.use((err, _req, res, _next) => {
    console.error(err);
    store.log("error", err.message || "unhandled");
    res.status(500).json({ error: "internal_error", message: err.message });
  });

  app.listen(config.port, config.host, () => {
    const origin = `http://${config.host}:${config.port}`;
    console.log(`AgentPaywall API mode=${config.mode} settle=${config.mode === "live" ? "oz-facilitator" : "stub"}  ${origin}`);
    console.log(`  GET  ${origin}/v1/fx?pair=USD-MXN   (x402 Exact, ${config.price} USDC)`);
    console.log(`  GET  ${origin}/v1/status`);
    if (config.mode === "stub") {
      console.log("  STUB — no on-chain settle. Live requires OZ_API_KEY + STELLAR_RECIPIENT (G...).");
      for (const n of verifyNotes()) console.log(`  ${n}`);
    } else {
      console.log(`  LIVE facilitator ${config.facilitatorUrl}`);
      console.log(`  payTo ${config.recipient}`);
    }
  });
}

main().catch((err) => {
  console.error("API failed to start:", err);
  process.exit(1);
});
