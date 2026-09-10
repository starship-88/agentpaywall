import { USDC_ISSUER } from "./constants.js";

/**
 * Public Horizon reads only. Never send secrets here.
 * Issuer is the official testnet USDC G... (trustline), not the SAC.
 */

export function isClassicAccount(address) {
  return typeof address === "string" && /^G[A-Z2-7]{55}$/.test(address.trim());
}

export function isContractId(address) {
  return typeof address === "string" && /^C[A-Z2-7]{55}$/.test(address.trim());
}

export function previewAddress(address) {
  const a = String(address || "");
  if (a.length < 12) return a || null;
  return `${a.slice(0, 5)}…${a.slice(-4)}`;
}

export async function loadAccount(horizonUrl, accountId) {
  if (!isClassicAccount(accountId)) {
    return { exists: false, reason: "not_classic_g_address" };
  }
  const url = `${horizonUrl.replace(/\/$/, "")}/accounts/${accountId}`;
  const res = await fetch(url);
  if (res.status === 404) return { exists: false, reason: "not_found" };
  if (!res.ok) {
    return { exists: false, reason: `horizon_${res.status}` };
  }
  const data = await res.json();
  const usdc = (data.balances || []).find(
    (b) => b.asset_code === "USDC" && b.asset_issuer === USDC_ISSUER,
  );
  return {
    exists: true,
    usdcTrustline: Boolean(usdc),
    usdcBalance: usdc ? String(usdc.balance) : null,
    xlmBalance:
      (data.balances || []).find((b) => b.asset_type === "native")?.balance ||
      null,
  };
}

export function usdcEnough(balance, need) {
  if (balance == null) return false;
  const have = Number(balance);
  return Number.isFinite(have) && have + 1e-9 >= need;
}
