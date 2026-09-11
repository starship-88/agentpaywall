#!/usr/bin/env node
/**
 * AgentPaywall CLI — the agent that pays.
 *
 * Live: wrapFetchWithPaymentFromConfig + ExactStellarScheme.
 *   Classic G... payer: createEd25519Signer(STELLAR_SECRET_KEY).
 *   Spend-account C...: signer.address = SPEND_ACCOUNT_CONTRACT_ID; owner
 *   STELLAR_RECIPIENT_SECRET signs Vec<AccSignature> for __check_auth.
 * Stub: GET → 402 → attach PAYMENT-SIGNATURE → retry (no chain).
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { Keypair } from "@stellar/stellar-sdk";
import {
  blobLooksLikeOnChainCap,
  createSpendAccountSigner,
  ownerSecretFromEnv,
  readSacBalance,
  readSpendAccountDailyLimit,
  readSpendAccountRemaining,
  SpendAccountExactScheme,
} from "./spend-account-payer.js";
import {
  isClassicAccount,
  isContractId,
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
  SPEND_ACCOUNT_CONTRACT_ID   deployed spend-account C... (live Exact from)
  STELLAR_RECIPIENT_SECRET    owner S... for that contract (constructor owner G...)
  STELLAR_SECRET_KEY          classic G... payer if no spend-account C... is set
  STELLAR_NETWORK             stellar:testnet
  STELLAR_RPC_URL             https://soroban-testnet.stellar.org
  API must have OZ_API_KEY + STELLAR_RECIPIENT (G...) or it stays stub.

When SPEND_ACCOUNT_CONTRACT_ID is set, this process pays FROM the C... so
__check_auth enforces daily_limit on-chain. Fund that contract with testnet USDC.
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
  if (text.includes("dailycapexceeded") || text.includes("cap_hit") || /error\(\s*contract\s*,\s*#3\s*\)/.test(text)) {
    return "Spend-account __check_auth: DailyCapExceeded (on-chain daily cap).";
  }
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
    return "Payer underfunded. When paying from a spend-account, fund the C... with testnet USDC (Circle faucet → then transfer, or send USDC to the contract).";
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

function isCapBody(body) {
  if (blobLooksLikeOnChainCap(body)) return true;
  return (
    body?.error === "DAILY_CAP_EXCEEDED" ||
    String(body?.error || body?.code || body?.message || "")
      .toLowerCase()
      .includes("cap")
  );
}

function spendAccountIdFrom(status) {
  const fromEnv = process.env.SPEND_ACCOUNT_CONTRACT_ID;
  if (isContractId(fromEnv)) return fromEnv.trim();
  const fromStatus = status?.spendAccount?.contractId;
  if (isContractId(fromStatus)) return fromStatus;
  return "";
}

async function livePay(url, verbose, apiSnapshot) {
  let status = apiSnapshot;
  if (!status) {
    try {
      status = await apiStatus(DEFAULT_API);
    } catch {
      status = null;
    }
  }

  const contractId = spendAccountIdFrom(status);
  const onChainFrom = Boolean(contractId);

  if (!onChainFrom) {
    const remaining = BigInt(status?.budget?.remainingBaseUnits || "0");
    const priceUnits = BigInt(status?.priceBaseUnits || "10000");
    if (status && remaining < priceUnits) {
      const res = await fetch(url);
      const body = await res.json().catch(() => ({}));
      if (verbose) {
        console.log("budget remaining", remaining.toString(), "< price", priceUnits.toString());
      }
      return {
        status: res.status,
        body: isCapBody(body)
          ? body
          : { error: "DAILY_CAP_EXCEEDED", remainingBaseUnits: remaining.toString() },
        mode: "live",
      };
    }
  }

  const { wrapFetchWithPaymentFromConfig } = await import("@x402/fetch");
  const { createEd25519Signer } = await import("@x402/stellar");
  const { ExactStellarScheme } = await import("@x402/stellar/exact/client");

  let signer;
  let client;
  if (onChainFrom) {
    const ownerSecret = ownerSecretFromEnv(status?.live?.recipient);
    signer = createSpendAccountSigner(ownerSecret, contractId, NETWORK);
    client = new SpendAccountExactScheme(signer, { url: RPC_URL });
    if (verbose) {
      console.log("signer.address (from)", signer.address);
      console.log("auth owner", signer.ownerPublicKey);
      console.log("SpendAccountExactScheme authorizeEntry wrap", NETWORK, RPC_URL);
    }
  } else {
    const secret = process.env.STELLAR_SECRET_KEY;
    if (!secret || !secret.startsWith("S")) {
      throw new Error(
        "STELLAR_SECRET_KEY must be the raw S... secret for createEd25519Signer.",
      );
    }
    signer = createEd25519Signer(secret, NETWORK);
    client = new ExactStellarScheme(signer, { url: RPC_URL });
    if (verbose) {
      console.log("signer", signer.address);
      console.log("createEd25519Signer + wrapFetchWithPaymentFromConfig", NETWORK, RPC_URL);
    }
  }

  const fetchWithPayment = wrapFetchWithPaymentFromConfig(fetch, {
    schemes: [{ network: NETWORK, client }],
  });

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
    const message = explainLiveError(err);
    const cap =
      blobLooksLikeOnChainCap(err) ||
      /daily_cap|cap exceeded|cap_hit|dailycapexceeded/i.test(message);
    return {
      status: 402,
      mode: "live",
      address: signer.address,
      body: {
        error: cap ? "DAILY_CAP_EXCEEDED" : "LIVE_PAY_FAILED",
        message,
        onChain: Boolean(onChainFrom && cap),
      },
    };
  }
}

async function once(url, mode, verbose, status) {
  if (mode === "live") return livePay(url, verbose, status);
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

async function preflightClassicPayer(needUsdc) {
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

async function preflightSpendAccount(contractId, needUsdc, status) {
  const ownerSecret = ownerSecretFromEnv(status?.live?.recipient);
  if (!ownerSecret) {
    console.error(
      "Live from C... needs STELLAR_RECIPIENT_SECRET (constructor owner S...). Do not use a different owner than deploy.",
    );
    process.exit(1);
  }
  let ownerG;
  try {
    ownerG = Keypair.fromSecret(ownerSecret).publicKey();
  } catch {
    console.error("STELLAR_RECIPIENT_SECRET is not a valid S... secret.");
    process.exit(1);
  }
  console.log(`live from ${contractId}`);
  console.log(`auth owner ${previewAddress(ownerG)}`);
  const recipient = status?.live?.recipient;
  if (recipient && ownerG !== recipient) {
    console.error(
      `Owner pubkey ${previewAddress(ownerG)} != STELLAR_RECIPIENT ${previewAddress(recipient)}. __check_auth only accepts the constructor owner.`,
    );
  }
  try {
    const remaining = await readSpendAccountRemaining(contractId, NETWORK, RPC_URL);
    const limit = await readSpendAccountDailyLimit(contractId, NETWORK, RPC_URL);
    console.log(
      `spend-account remaining=${remaining.toString()} daily_limit=${limit.toString()} (base units)`,
    );
  } catch (err) {
    console.error(`Could not simulate spend-account remaining: ${err.message}`);
  }
  try {
    const bal = await readSacBalance(USDC_SAC, contractId, NETWORK, RPC_URL);
    const needBase = BigInt(Math.round(needUsdc * 10_000_000));
    console.log(`C... USDC SAC balance ${bal.toString()} base units`);
    if (bal < needBase) {
      console.error(
        "Spend-account USDC is below one quote. Fund the C... with testnet USDC.",
      );
    }
  } catch (err) {
    console.error(`Could not simulate C... USDC balance: ${err.message}`);
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
  let max = Number(arg("--max", "50"));

  let mode = "stub";
  let needUsdc = 0.001;
  let status = null;
  try {
    status = await apiStatus(DEFAULT_API);
    mode = status.mode === "live" ? "live" : "stub";
    needUsdc = Number(status.price?.replace?.("$", "")) || 0.001;
    const contractId = spendAccountIdFrom(status);
    if (untilCap && status.priceBaseUnits) {
      let capBase = status.budget?.dailyCapBaseUnits
        ? BigInt(status.budget.dailyCapBaseUnits)
        : 0n;
      const statusLimit = status.spendAccount?.dailyLimitBaseUnits;
      if (status.spendAccount?.source === "on-chain" && statusLimit) {
        capBase = BigInt(statusLimit);
      } else if (mode === "live" && contractId) {
        try {
          const onChain = await readSpendAccountDailyLimit(
            contractId,
            NETWORK,
            RPC_URL,
          );
          if (onChain > capBase) capBase = onChain;
        } catch {
          // keep dashboard cap
        }
      }
      if (capBase > 0n) {
        const paysToFill = capBase / BigInt(status.priceBaseUnits);
        const need = Number(paysToFill) + 1;
        if (Number.isFinite(need) && need > max) {
          console.log(
            `--until-cap: raising --max ${max} → ${need} so the exceeding request can run (cap ${capBase} base / price ${status.price})`,
          );
          max = need;
        }
      }
    }
    console.log(
      `API mode=${status.mode} settle=${status.settle || "?"} network=${status.network} price=${status.price}`,
    );
    console.log(`USDC SAC ${status.usdc?.sac || USDC_SAC}`);
    if (status.spendAccount) {
      const sa = status.spendAccount;
      console.log(
        `spendAccount ${sa.contractId || "none"} enforcesLiveTransfers=${sa.enforcesLiveTransfers} source=${sa.source || "?"}`,
      );
      if (sa.source === "on-chain") {
        console.log(
          `on-chain remaining=${sa.remainingBaseUnits} spent=${sa.spentTodayBaseUnits} limit=${sa.dailyLimitBaseUnits}`,
        );
      }
    }
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
    const contractId = spendAccountIdFrom(status);
    if (contractId) {
      await preflightSpendAccount(contractId, needUsdc, status);
    } else {
      if (!process.env.STELLAR_SECRET_KEY) {
        console.error("Live API needs STELLAR_SECRET_KEY on the agent.");
        process.exit(1);
      }
      await preflightClassicPayer(needUsdc);
    }
  }

  console.log(`GET ${url}`);

  if (!untilCap) {
    const result = await once(url, mode, verbose, status);
    printResult(result);
    if (result.status >= 400) process.exit(1);
    return;
  }

  console.log("Adversarial loop: pay until reject.");
  for (let i = 1; i <= max; i++) {
    const result = await once(url, mode, verbose, status);
    const cap = result.status === 402 && isCapBody(result.body);
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
