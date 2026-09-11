/**
 * Simulate-only reads of spend-account + USDC SAC.
 *
 * AssembledTransaction.build with Keypair.random() as publicKey calls
 * Horizon getAccount and fails "Account not found". Omit publicKey so the
 * SDK uses NULL_ACCOUNT / seq 0 — valid for simulation-only views.
 */
import { Networks, nativeToScVal, scValToNative, contract } from "@stellar/stellar-sdk";
import { config } from "./config.js";
import { USDC_SAC } from "./constants.js";
import { isContractId } from "./horizon.js";

const USDC_SCALE = 10_000_000;
const SIMULATE_TIMEOUT_MS = 2800;

export function networkPassphrase(network) {
  const n = String(network || "").toLowerCase();
  if (n.includes("mainnet") || n === "public") return Networks.PUBLIC;
  return Networks.TESTNET;
}

export function toBaseUnits(n) {
  if (n == null) return 0n;
  if (typeof n === "bigint") return n;
  if (typeof n === "number") return BigInt(Math.trunc(n));
  return BigInt(String(n));
}

export function baseUnitsToUsdc(n) {
  const x = Number(toBaseUnits(n)) / USDC_SCALE;
  return Number.isFinite(x) ? x : null;
}

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms,
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export async function simulateView({ contractId, method, args, network, rpcUrl }) {
  const tx = await contract.AssembledTransaction.build({
    contractId,
    method,
    args: args ?? [],
    networkPassphrase: networkPassphrase(network),
    rpcUrl,
    parseResultXdr: (val) => scValToNative(val),
  });
  return tx.result;
}

export async function readSpendAccountRemaining(contractId, network, rpcUrl) {
  const n = await simulateView({
    contractId,
    method: "remaining",
    args: [],
    network,
    rpcUrl,
  });
  return toBaseUnits(n);
}

export async function readSpendAccountDailyLimit(contractId, network, rpcUrl) {
  const n = await simulateView({
    contractId,
    method: "daily_limit",
    args: [],
    network,
    rpcUrl,
  });
  return toBaseUnits(n);
}

export async function readSpendAccountSpentToday(contractId, network, rpcUrl) {
  const n = await simulateView({
    contractId,
    method: "spent_today",
    args: [],
    network,
    rpcUrl,
  });
  return toBaseUnits(n);
}

export async function readSacBalance(sac, holder, network, rpcUrl) {
  const n = await simulateView({
    contractId: sac,
    method: "balance",
    args: [nativeToScVal(holder, { type: "address" })],
    network,
    rpcUrl,
  });
  return toBaseUnits(n);
}

function spendAccountNote(contractId) {
  if (!contractId) {
    return "API DAILY_CAP_USDC is enforced in-process on stub (and live without a spend-account). Set SPEND_ACCOUNT_CONTRACT_ID to make the C... the live from.";
  }
  return "Live Exact from is this C.... Daily cap is __check_auth DailyCapExceeded, not the in-memory budget setter. POST /v1/budget does not call set_daily_limit.";
}

function emptyNumerics() {
  return {
    dailyLimitBaseUnits: null,
    spentTodayBaseUnits: null,
    remainingBaseUnits: null,
    dailyLimitUsdc: null,
    spentTodayUsdc: null,
    remainingUsdc: null,
    usdcBalanceBaseUnits: null,
    usdcBalanceUsdc: null,
  };
}

function snapshotBase(contractId) {
  return {
    contractId,
    enforcesLiveTransfers: Boolean(contractId && config.mode === "live"),
    expectedFrom: contractId,
    note: spendAccountNote(contractId),
    ...emptyNumerics(),
  };
}

async function readOnChainViews(contractId) {
  const network = config.network;
  const rpcUrl = config.rpcUrl;
  const sac = config.usdcSac || USDC_SAC;

  const [dailyLimit, spentToday, remaining] = await Promise.all([
    readSpendAccountDailyLimit(contractId, network, rpcUrl),
    readSpendAccountSpentToday(contractId, network, rpcUrl),
    readSpendAccountRemaining(contractId, network, rpcUrl),
  ]);

  let usdcBalance = null;
  try {
    usdcBalance = await readSacBalance(sac, contractId, network, rpcUrl);
  } catch {
    usdcBalance = null;
  }

  return {
    dailyLimitBaseUnits: dailyLimit.toString(),
    spentTodayBaseUnits: spentToday.toString(),
    remainingBaseUnits: remaining.toString(),
    dailyLimitUsdc: baseUnitsToUsdc(dailyLimit),
    spentTodayUsdc: baseUnitsToUsdc(spentToday),
    remainingUsdc: baseUnitsToUsdc(remaining),
    usdcBalanceBaseUnits: usdcBalance == null ? null : usdcBalance.toString(),
    usdcBalanceUsdc: usdcBalance == null ? null : baseUnitsToUsdc(usdcBalance),
    source: "on-chain",
  };
}

/**
 * Always returns a spendAccount object. Never throws — RPC slowness or
 * simulate failure becomes source:"unavailable" so GET /v1/status stays 200.
 */
export async function loadSpendAccountStatus() {
  const contractId = isContractId(config.spendAccountContractId)
    ? config.spendAccountContractId
    : null;
  const base = snapshotBase(contractId);

  if (!contractId) {
    return { ...base, source: "unavailable" };
  }

  try {
    const views = await withTimeout(
      readOnChainViews(contractId),
      SIMULATE_TIMEOUT_MS,
      "spend-account simulate",
    );
    return { ...base, ...views };
  } catch (err) {
    return {
      ...base,
      source: "unavailable",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
