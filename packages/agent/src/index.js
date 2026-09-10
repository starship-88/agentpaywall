#!/usr/bin/env node
/**
 * AgentPaywall CLI — the agent that pays.
 *
 * Live: wrapFetchWithPaymentFromConfig + createEd25519Signer + ExactStellarScheme
 * Stub: GET → 402 → attach PAYMENT-SIGNATURE → retry (no chain).
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { Keypair } from "@stellar/stellar-sdk";
import {
  isClassicAccount,
  loadAccount,
  previewAddress,
  usdcEnough,
} from "../../api/src/horizon.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../../..");
dotenv.config({ path: path.join(repoRoot, ".env") });
dotenv.config({ path: path.join(here, "../.env") });

const NETWORK = process.env.STELLAR_NETWORK || "stellar:testnet";
const DEFAULT_API = `http://${process.env.API_HOST || "127.0.0.1"}:${process.env.API_PORT || "40211"}`;
const RPC_URL = process.env.STELLAR_RPC_URL || "https://soroban-testnet.stellar.org";
const HORIZON_URL =
  process.env.STELLAR_HORIZON_URL || "https://horizon-testnet.stellar.org";
const USDC_SAC =
  process.env.USDC_SAC ||
  "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";

function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  if (i === -1) return fallback;
  return process.argv[i + 1] ?? fallback;
}

function has(flag) {
  return process.argv.includes(flag);
}

function usage() {
  console.log(`AgentPaywall agent — pay-per-request FX over x402 / Stellar USDC

Usage:
  npm run start -w @agentpaywall/agent -- [options]
  node packages/agent/src/index.js [options]

Options:
  --url <url>       Full paid URL (default: ${DEFAULT_API}/v1/fx?pair=USD-MXN)
  --pair <PAIR>     FX pair when --url is omitted (default: USD-MXN)
  --until-cap       Repeat until a cap/settle reject (stub dashboard or on-chain)
  --max <n>         Cap loop iterations (default: 50)
  --verbose         Log 402 headers and settlement body
  --help            This message

Live env (.env at repo root):
  STELLAR_SECRET_KEY   S... raw secret for createEd25519Signer
  STELLAR_NETWORK      stellar:testnet
  STELLAR_RPC_URL      https://soroban-testnet.stellar.org
  API must have OZ_API_KEY + STELLAR_RECIPIENT (G...) or it stays stub.

The human sets the dashboard cap. This process only pays.
`);
}

async function apiStatus(base) {
  const res = await fetch(new URL("/v1/status", base));
  if (!res.ok) throw new Error(`status ${res.status} from ${base}`);
  return res.json();
}

function encodeStubSignature(address) {
  const payload = {
    x402Version: 2,
    scheme: "exact",
    network: NETWORK,
    payload: {
      stub: true,
      address,
      note: "STUB signature — API is not calling the facilitator.",
    },
  };
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
}

function explainLiveError(err) {
  const text = `${err?.message || err} ${err?.cause || ""}`.toLowerCase();
  if (text.includes("encoded argument must be of type string") || text.includes("unknown stellar network")) {
    return "createEd25519Signer wants the raw S... string and CAIP-2 stellar:testnet — do not pass a Keypair or passphrase.";
  }
  if (text.includes("401") || text.includes("unauthorized")) {
    return "Facilitator 401: set a valid OZ_API_KEY on the API (https://channels.openzeppelin.com/testnet/gen).";
  }
  if (text.includes("no_trust") || text.includes("trustline") || text.includes("op_no_trust")) {
    return "Missing USDC trustline. node scripts/add-usdc-trustline.mjs  (issuer GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5)";
  }
  if (text.includes("underfund") || text.includes("insufficient") || text.includes("balance")) {
    return "Payer underfunded. Circle testnet USDC: https://faucet.circle.com (select Stellar Testnet).";
  }
  if (text.includes("no supported payment kinds")) {
    return "API could not load facilitator kinds. Check OZ_API_KEY and FACILITATOR_URL.";
  }
  return err?.message || String(err);
}

async function stubPay(url, verbose) {
  const first = await fetch(url);
  if (verbose) {
    console.log(`first status ${first.status}`);
    console.log("PAYMENT-REQUIRED:", first.headers.get("PAYMENT-REQUIRED"));
  }
  if (first.status === 200) {
    return { status: 200, body: await first.json(), mode: "stub-already-open" };
  }
  if (first.status !== 402) {
    const text = await first.text();
    return { status: first.status, body: text, mode: "stub" };
  }
  const required = await first.json().catch(() => ({}));
  if (verbose) console.log("402 body:", JSON.stringify(required, null, 2));

  const secret = process.env.STELLAR_SECRET_KEY;
  const address = secret && secret.startsWith("S")
    ? Keypair.fromSecret(secret).publicKey()
    : "STUB_PAYER_NO_SECRET";
  const paid = await fetch(url, {
    headers: { "PAYMENT-SIGNATURE": encodeStubSignature(address) },
  });
  const body = await paid.json().catch(() => ({}));
  return { status: paid.status, body, mode: "stub", address };
}

async function livePay(url, verbose) {
  const secret = process.env.STELLAR_SECRET_KEY;
  if (!secret || !secret.startsWith("S")) {
    throw new Error(
      "STELLAR_SECRET_KEY must be the raw S... secret for createEd25519Signer.",
    );
  }

  const { wrapFetchWithPaymentFromConfig } = await import("@x402/fetch");
  const { createEd25519Signer } = await import("@x402/stellar");
  const { ExactStellarScheme } = await import("@x402/stellar/exact/client");

  const signer = createEd25519Signer(secret, NETWORK);
  const fetchWithPayment = wrapFetchWithPaymentFromConfig(fetch, {
    schemes: [
      {
        network: NETWORK,
        client: new ExactStellarScheme(signer, { url: RPC_URL }),
      },
    ],
  });

  if (verbose) {
    console.log("signer", signer.address);
    console.log("createEd25519Signer + wrapFetchWithPaymentFromConfig", NETWORK, RPC_URL);
  }

  try {
    const res = await fetchWithPayment(url);
    const body = await res.json().catch(() => ({}));
    return {
      status: res.status,
      body,
      mode: "live",
      address: signer.address,
      paymentResponse: res.headers.get("PAYMENT-RESPONSE"),
    };
  } catch (err) {
    return {
      status: 402,
      mode: "live",
      address: signer.address,
      body: {
        error: "LIVE_PAY_FAILED",
        message: explainLiveError(err),
      },
    };
  }
}

async function once(url, mode, verbose) {
  if (mode === "live") return livePay(url, verbose);
  return stubPay(url, verbose);
}

function printResult(result) {
  console.log(`status ${result.status}  mode=${result.mode}`);
  if (result.address) console.log(`payer ${result.address}`);
  if (result.paymentResponse) {
    console.log("PAYMENT-RESPONSE", result.paymentResponse);
  }
  console.log(JSON.stringify(result.body, null, 2));
}

async function preflightPayer(needUsdc) {
  const secret = process.env.STELLAR_SECRET_KEY;
  if (!secret || !secret.startsWith("S")) return;
  let payer;
  try {
    payer = Keypair.fromSecret(secret).publicKey();
  } catch {
    console.error("STELLAR_SECRET_KEY is not a valid S... secret.");
    process.exit(1);
  }
  if (!isClassicAccount(payer)) return;
  const acc = await loadAccount(HORIZON_URL, payer);
  console.log(
    `payer ${previewAddress(payer)} horizon exists=${acc.exists} usdcTrustline=${acc.usdcTrustline} usdc=${acc.usdcBalance ?? "—"}`,
  );
  if (!acc.exists) {
    console.error(
      `Payer ${payer} is not on testnet. Friendbot: https://friendbot.stellar.org?addr=${payer}`,
    );
  } else if (!acc.usdcTrustline) {
    console.error(
      "Payer has no USDC trustline. node scripts/add-usdc-trustline.mjs",
    );
  } else if (!usdcEnough(acc.usdcBalance, needUsdc)) {
    console.error(
      `Payer USDC ${acc.usdcBalance} < ${needUsdc}. Fund at https://faucet.circle.com (Stellar Testnet).`,
    );
  }
}

async function main() {
  if (has("--help") || has("-h")) {
    usage();
    return;
  }

  const pair = arg("--pair", "USD-MXN");
  const url =
    arg("--url") || `${DEFAULT_API}/v1/fx?pair=${encodeURIComponent(pair)}`;
  const verbose = has("--verbose");
  const untilCap = has("--until-cap");
  const max = Number(arg("--max", "50"));

  let mode = "stub";
  let needUsdc = 0.001;
  try {
    const status = await apiStatus(DEFAULT_API);
    mode = status.mode === "live" ? "live" : "stub";
    needUsdc = Number(status.price?.replace?.("$", "")) || 0.001;
    console.log(
      `API mode=${status.mode} settle=${status.settle || "?"} network=${status.network} price=${status.price}`,
    );
    console.log(`USDC SAC ${status.usdc?.sac || USDC_SAC}`);
    if (status.live?.facilitator) {
      const f = status.live.facilitator;
      console.log(
        `facilitator probed=${f.probed} ok=${f.ok}${f.error ? ` error=${f.error}` : ""}`,
      );
    }
    if (status.verify?.length) {
      for (const n of status.verify) console.log(`  ${n}`);
    }
  } catch (err) {
    console.error(`Could not reach API at ${DEFAULT_API}: ${err.message}`);
    console.error("Start it with: npm run dev:api");
    process.exit(1);
  }

  if (mode === "live") {
    if (!process.env.STELLAR_SECRET_KEY) {
      console.error("Live API needs STELLAR_SECRET_KEY on the agent.");
      process.exit(1);
    }
    await preflightPayer(needUsdc);
  }

  console.log(`GET ${url}`);

  if (!untilCap) {
    const result = await once(url, mode, verbose);
    printResult(result);
    if (result.status >= 400) process.exit(1);
    return;
  }

  console.log("Adversarial loop: pay until reject.");
  for (let i = 1; i <= max; i++) {
    const result = await once(url, mode, verbose);
    const cap =
      result.status === 402 &&
      (result.body?.error === "DAILY_CAP_EXCEEDED" ||
        String(result.body?.error || result.body?.message || "")
          .toLowerCase()
          .includes("cap"));
    console.log(`#${i} status=${result.status}${cap ? " CAP_HIT" : ""}`);
    if (verbose || result.status === 200 || cap) {
      console.log(JSON.stringify(result.body, null, 2));
    }
    if (cap) {
      console.log("Daily cap hit — intended adversarial outcome.");
      return;
    }
    if (result.status !== 200) {
      console.error("Stopped on unexpected status.");
      process.exit(1);
    }
  }
  console.error(`Gave up after ${max} paid requests without a cap hit.`);
  process.exit(2);
}

main().catch((err) => {
  console.error("Agent failed:", explainLiveError(err));
  process.exit(1);
});
