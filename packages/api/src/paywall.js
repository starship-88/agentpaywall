import { HTTPFacilitatorClient } from "@x402/core/server";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { ExactStellarScheme } from "@x402/stellar/exact/server";
import { facilitatorState } from "./config.js";
import { USDC_SAC } from "./constants.js";

function paymentRequiredBody(config, req) {
  const resourceUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  return {
    x402Version: 2,
    error: "PAYMENT_REQUIRED",
    accepts: [
      {
        scheme: "exact",
        network: config.network,
        price: config.price,
        amount: config.priceBaseUnits.toString(),
        asset: config.usdcSac,
        payTo: config.recipient || "SET_STELLAR_RECIPIENT_G_ADDRESS",
        extra: {
          facilitator: config.facilitatorUrl,
          usdcIssuer: config.usdcIssuer,
        },
      },
    ],
    resource: {
      url: resourceUrl,
      description: "Mock FX quote. Pay USDC on stellar:testnet via x402 Exact.",
      mimeType: "application/json",
    },
  };
}

function encodePaymentRequired(body) {
  return Buffer.from(JSON.stringify(body), "utf8").toString("base64");
}

function readHeader(req, name) {
  const v = req.get(name);
  return v || req.get(name.toLowerCase()) || "";
}

function explainSettleFailure(settleResult) {
  const raw = JSON.stringify(settleResult ?? {});
  const lower = raw.toLowerCase();
  if (lower.includes("401") || lower.includes("unauthorized")) {
    return {
      code: "FACILITATOR_AUTH",
      message:
        "OZ facilitator rejected the API key. Regenerate at https://channels.openzeppelin.com/testnet/gen and set OZ_API_KEY.",
    };
  }
  if (lower.includes("no_trust") || lower.includes("trustline")) {
    return {
      code: "NO_TRUSTLINE",
      message:
        "USDC trustline missing on payer or recipient. Run node scripts/add-usdc-trustline.mjs",
    };
  }
  if (
    lower.includes("underfund") ||
    lower.includes("insufficient") ||
    lower.includes("balance")
  ) {
    return {
      code: "UNDERFUNDED",
      message:
        "Payer USDC balance is too low. Fund the payer G... at https://faucet.circle.com (Stellar testnet).",
    };
  }
  return {
    code: "SETTLE_FAILED",
    message:
      "Facilitator could not settle the USDC transfer. See details; common causes are underfunded payer, missing trustline, or expired auth entry.",
    details: settleResult,
  };
}

export function stubPaywall(config, store) {
  return function stubPaywallMiddleware(req, res, next) {
    if (req.method !== "GET" || !req.path.startsWith("/v1/fx")) {
      return next();
    }

    const signature =
      readHeader(req, "PAYMENT-SIGNATURE") ||
      readHeader(req, "X-PAYMENT") ||
      "";

    if (!signature) {
      const body = paymentRequiredBody(config, req);
      store.log("402", `402 Payment Required for ${req.originalUrl}`, {
        pair: req.query.pair || null,
      });
      res.set("PAYMENT-REQUIRED", encodePaymentRequired(body));
      res.set("Cache-Control", "no-store");
      return res.status(402).json(body);
    }

    const spend = store.trySpend(config.priceBaseUnits);
    if (!spend.ok) {
      const body = {
        error: "DAILY_CAP_EXCEEDED",
        message:
          "Local dashboard cap would be exceeded (stub). Live settle does not use this gate.",
        remainingBaseUnits: spend.remaining.toString(),
        remainingUsdc: Number(spend.remaining) / 10_000_000,
        onChain: false,
      };
      res.set("Cache-Control", "no-store");
      return res.status(402).json(body);
    }

    store.log("paid", `Stub payment accepted for ${req.originalUrl}`, {
      pair: req.query.pair || null,
      price: config.price,
      note: "STUB: no facilitator settle.",
    });
    req.agentpaywall = { paid: true, mode: "stub" };
    return next();
  };
}

function liveUnavailable(store, reason) {
  return function liveDownMiddleware(req, res, next) {
    if (req.method !== "GET" || !req.path.startsWith("/v1/fx")) {
      return next();
    }
    store.log("error", `Live facilitator unavailable: ${reason}`);
    return res.status(503).json({
      error: "FACILITATOR_UNAVAILABLE",
      message: reason,
      hint: "Confirm OZ_API_KEY and FACILITATOR_URL=https://channels.openzeppelin.com/x402/testnet",
    });
  };
}

export async function livePaywall(config, store) {
  const facilitator = new HTTPFacilitatorClient({
    url: config.facilitatorUrl,
    createAuthHeaders: async () => {
      const h = { Authorization: `Bearer ${config.ozApiKey}` };
      return { verify: h, settle: h, supported: h };
    },
  });

  const resourceServer = new x402ResourceServer(facilitator).register(
    config.network,
    new ExactStellarScheme(),
  );

  resourceServer.onAfterSettle(() => {
    store.log("paid", "OZ facilitator settled USDC transfer on stellar:testnet", {
      price: config.price,
      asset: USDC_SAC,
      payTo: config.recipient,
    });
  });
  resourceServer.onSettleFailure((ctx) => {
    store.log("error", "OZ facilitator settle failed", {
      error: String(ctx?.error || ctx?.reason || "settle_failed"),
    });
  });

  try {
    await resourceServer.initialize();
    let kinds = [];
    try {
      const supported = await facilitator.getSupported();
      kinds = supported?.kinds || supported?.paymentKinds || [];
    } catch {
      kinds = [];
    }
    facilitatorState.probed = true;
    facilitatorState.ok = true;
    facilitatorState.error = null;
    facilitatorState.kinds = kinds;
  } catch (err) {
    const message = err?.message || String(err);
    facilitatorState.probed = true;
    facilitatorState.ok = false;
    facilitatorState.error = message;
    store.log("error", `Facilitator initialize failed: ${message}`);
    return liveUnavailable(store, message);
  }

  const x402 = paymentMiddleware(
    {
      "GET /v1/fx": {
        accepts: {
          scheme: "exact",
          price: config.price,
          network: config.network,
          payTo: config.recipient,
        },
        description: "Mock FX quote paid in testnet USDC via x402 Exact",
        mimeType: "application/json",
        unpaidResponseBody: (httpCtx) => ({
          contentType: "application/json",
          body: {
            error: "PAYMENT_REQUIRED",
            x402Version: 2,
            message:
              "Pay with x402 Exact on stellar:testnet USDC, then retry with PAYMENT-SIGNATURE.",
            pair: httpCtx?.getQueryParam?.("pair") || null,
          },
        }),
        settlementFailedResponseBody: (_httpCtx, settleResult) => ({
          contentType: "application/json",
          body: {
            error: "SETTLE_FAILED",
            ...explainSettleFailure(settleResult),
          },
        }),
      },
    },
    resourceServer,
    undefined,
    undefined,
    false,
  );

  return function livePaywallMiddleware(req, res, next) {
    if (req.method !== "GET" || !req.path.startsWith("/v1/fx")) {
      return next();
    }

    const signature =
      readHeader(req, "PAYMENT-SIGNATURE") ||
      readHeader(req, "X-PAYMENT") ||
      "";

    if (!signature) {
      store.log("402", `402 Payment Required (live) for ${req.originalUrl}`, {
        pair: req.query.pair || null,
      });
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode === 402 && signature) {
        store.log("error", `Live paywall returned ${res.statusCode}`, {
          error: body?.error || body?.code,
        });
      }
      return originalJson(body);
    };

    return Promise.resolve(x402(req, res, next)).catch((err) => {
      store.log("error", err.message || "x402 middleware error");
      if (!res.headersSent) {
        res.status(502).json({
          error: "X402_MIDDLEWARE",
          message: err.message || "payment middleware failed",
        });
      }
    });
  };
}

export async function createPaywall(config, store) {
  if (config.mode === "live") {
    return livePaywall(config, store);
  }
  facilitatorState.probed = true;
  facilitatorState.ok = false;
  facilitatorState.error = "stub_mode";
  return stubPaywall(config, store);
}
