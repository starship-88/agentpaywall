import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import {
  DEFAULT_PRICE,
  FACILITATOR_URL,
  HORIZON_URL,
  SOROBAN_RPC_URL,
  STELLAR_NETWORK,
  USDC_ISSUER,
  USDC_SAC,
} from "./constants.js";
import { isClassicAccount, isContractId, previewAddress } from "./horizon.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../../..");

dotenv.config({ path: path.join(repoRoot, ".env") });
dotenv.config({ path: path.join(here, "../.env") });

function str(name, fallback = "") {
  const v = process.env[name];
  return v == null || v.trim() === "" ? fallback : v.trim();
}

function num(name, fallback) {
  const v = str(name, "");
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function priceToBaseUnits(price) {
  if (typeof price === "object" && price && price.amount) {
    return BigInt(price.amount);
  }
  const raw = String(price).trim();
  if (raw.startsWith("$")) {
    const dollars = Number(raw.slice(1));
    if (!Number.isFinite(dollars)) return 10_000n;
    return BigInt(Math.round(dollars * 10_000_000));
  }
  return BigInt(raw);
}

export function priceToUsdcNumber(price) {
  return Number(priceToBaseUnits(price)) / 10_000_000;
}

const price = str("X402_PRICE", DEFAULT_PRICE);
const ozApiKey = str("OZ_API_KEY");
const recipient = str("STELLAR_RECIPIENT");
const payerSecret = str("STELLAR_SECRET_KEY");
const modeOverride = str("X402_MODE", "auto").toLowerCase();

const recipientClassic = isClassicAccount(recipient);
const recipientLooksLikeSac = isContractId(recipient);
const liveEnvReady = Boolean(ozApiKey && recipientClassic);

let mode = "stub";
if (modeOverride === "stub") mode = "stub";
else if (modeOverride === "live") mode = "live";
else mode = liveEnvReady ? "live" : "stub";

/** Mutable: filled after facilitator /supported probe. */
export const facilitatorState = {
  probed: false,
  ok: false,
  error: null,
  kinds: [],
};

export const config = {
  repoRoot,
  host: str("API_HOST", "127.0.0.1"),
  port: num("API_PORT", 40211),
  network: str("STELLAR_NETWORK", STELLAR_NETWORK),
  horizonUrl: str("STELLAR_HORIZON_URL", HORIZON_URL),
  rpcUrl: str("STELLAR_RPC_URL", SOROBAN_RPC_URL),
  usdcIssuer: str("USDC_ISSUER", USDC_ISSUER),
  usdcSac: str("USDC_SAC", USDC_SAC),
  facilitatorUrl: str("FACILITATOR_URL", FACILITATOR_URL),
  ozApiKey,
  recipient,
  recipientClassic,
  recipientLooksLikeSac,
  payerSecretConfigured: Boolean(payerSecret),
  price,
  priceBaseUnits: priceToBaseUnits(price),
  priceUsdc: priceToUsdcNumber(price),
  dailyCapUsdc: num("DAILY_CAP_USDC", 0.01),
  spendAccountContractId: str("SPEND_ACCOUNT_CONTRACT_ID"),
  mode,
  liveEnvReady,
  modeOverride,
};

export function liveBlockers() {
  const notes = [];
  if (modeOverride === "stub") {
    notes.push("X402_MODE=stub — stub forced even if live env is set.");
  }
  if (!ozApiKey) {
    notes.push(
      "Set OZ_API_KEY from https://channels.openzeppelin.com/testnet/gen",
    );
  }
  if (!recipient) {
    notes.push(
      "Set STELLAR_RECIPIENT to the merchant G... (USDC trustline). Not the SAC.",
    );
  } else if (recipientLooksLikeSac) {
    notes.push(
      "STELLAR_RECIPIENT is a C... contract id. payTo must be a classic G... account.",
    );
  } else if (!recipientClassic) {
    notes.push("STELLAR_RECIPIENT is not a classic G... account.");
  }
  if (!payerSecret) {
    notes.push(
      "Set STELLAR_SECRET_KEY (S...) on the agent process for createEd25519Signer.",
    );
  }
  return notes;
}

export function verifyNotes() {
  const notes = liveBlockers();
  if (!config.spendAccountContractId) {
    notes.push(
      "Optional next step: deploy contracts/spend-account and set SPEND_ACCOUNT_CONTRACT_ID. Live x402 settle uses a classic G... payer; the contract cap is not the settle path.",
    );
  }
  return notes;
}

export function liveStatusFields() {
  return {
    mode: config.mode,
    settle: config.mode === "live" ? "oz-facilitator" : "stub",
    network: config.network,
    live: {
      envReady: config.liveEnvReady,
      ozApiKey: Boolean(ozApiKey),
      recipientSet: Boolean(recipient),
      recipientClassic,
      recipientPreview: recipient ? previewAddress(recipient) : null,
      recipient: recipientClassic ? recipient : null,
      payerSecretConfigured: config.payerSecretConfigured,
      facilitator: {
        url: config.facilitatorUrl,
        probed: facilitatorState.probed,
        ok: facilitatorState.ok,
        error: facilitatorState.error,
        kinds: facilitatorState.kinds,
      },
    },
    spendAccount: {
      contractId: config.spendAccountContractId || null,
      enforcesLiveTransfers: false,
      note: "On-chain daily cap applies only if the x402 `from` is this contract account. The Node signer is createEd25519Signer on a classic G.... UI cap stays local.",
    },
  };
}
