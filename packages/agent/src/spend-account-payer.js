/**
 * Live Exact payer whose SAC `from` is a Soroban contract account.
 *
 * Stock createEd25519Signer always sets address to the G-account, so
 * transfer `from` never hits spend-account `__check_auth`.
 *
 * @x402/stellar 2.12.0 (and 2.20.0 on npm) still call
 *   tx.signAuthEntries({ address, signAuthEntry })
 * and do not forward an `authorizeEntry` override
 * (x402-foundation/x402#3018). Default authorizeEntry + signAuthEntry
 * treats the credential address as a G-account public key, which fails
 * for C-accounts. We wrap Exact: from = SPEND_ACCOUNT_CONTRACT_ID, and
 * authorizeEntry signs with the constructor owner Keypair so the
 * credentials carry Vec<AccSignature> { public_key, signature } — the
 * same shape spend-account / complex-account expect.
 */
import { Keypair, nativeToScVal, contract, authorizeEntry } from "@stellar/stellar-sdk";
import {
  ExactStellarScheme,
} from "@x402/stellar/exact/client";
import {
  getEstimatedLedgerCloseTimeSeconds,
  getNetworkPassphrase,
  getRpcClient,
  getRpcUrl,
  handleSimulationResult,
  isStellarNetwork,
  validateStellarAssetAddress,
  validateStellarDestinationAddress,
} from "@x402/stellar";
import { isContractId } from "../../api/src/horizon.js";
export {
  readSacBalance,
  readSpendAccountDailyLimit,
  readSpendAccountRemaining,
  readSpendAccountSpentToday,
} from "../../api/src/spend-account-view.js";

export function ownerSecretFromEnv(recipientG) {
  const recipientSecret = process.env.STELLAR_RECIPIENT_SECRET;
  if (recipientSecret && recipientSecret.startsWith("S")) {
    return recipientSecret;
  }
  const agentSecret = process.env.STELLAR_SECRET_KEY;
  if (agentSecret && agentSecret.startsWith("S") && recipientG) {
    try {
      if (Keypair.fromSecret(agentSecret).publicKey() === recipientG) {
        return agentSecret;
      }
    } catch {
      // invalid secret handled by caller
    }
  }
  return "";
}

export function createSpendAccountSigner(ownerSecret, contractId, network) {
  if (!ownerSecret || !ownerSecret.startsWith("S")) {
    throw new Error(
      "Spend-account live pay needs STELLAR_RECIPIENT_SECRET (owner S...). Constructor owner is the merchant G..., not the classic agent payer.",
    );
  }
  if (!isContractId(contractId)) {
    throw new Error("SPEND_ACCOUNT_CONTRACT_ID must be a C... contract id from deploy. Do not invent one.");
  }
  const owner = Keypair.fromSecret(ownerSecret);
  const networkPassphrase = getNetworkPassphrase(network);

  return {
    address: contractId,
    ownerPublicKey: owner.publicKey(),
    /**
     * AssembledTransaction always passes a signAuthEntry callback as the
     * second argument. Ignore it and sign as the owner Keypair so the
     * C-account credentials get Vec<AccSignature>.
     */
    authorizeEntry: (entry, _ignored, validUntil, passphrase) =>
      authorizeEntry(entry, owner, validUntil, passphrase || networkPassphrase),
    signAuthEntry: async () => {
      throw new Error("C-account Exact pay uses authorizeEntry, not signAuthEntry");
    },
  };
}

/**
 * Exact client that forwards signer.authorizeEntry. Falls back to stock
 * ExactStellarScheme when the signer is a classic G-account.
 */
export class SpendAccountExactScheme {
  constructor(signer, rpcConfig) {
    this.signer = signer;
    this.rpcConfig = rpcConfig;
    this.scheme = "exact";
    this.stock = new ExactStellarScheme(signer, rpcConfig);
  }

  async createPaymentPayload(x402Version, paymentRequirements) {
    if (typeof this.signer.authorizeEntry !== "function") {
      return this.stock.createPaymentPayload(x402Version, paymentRequirements);
    }
    this.#validate(paymentRequirements);

    const source = this.signer.address;
    const { network, payTo, asset, amount, extra, maxTimeoutSeconds } =
      paymentRequirements;
    if (!extra?.areFeesSponsored) {
      throw new Error("Exact scheme requires areFeesSponsored to be true");
    }

    const networkPassphrase = getNetworkPassphrase(network);
    const rpcUrl = getRpcUrl(network, this.rpcConfig);
    const rpcServer = getRpcClient(network, this.rpcConfig);
    const latestLedger = await rpcServer.getLatestLedger();
    const currentLedger = latestLedger.sequence;
    const estimatedLedgerSeconds = await getEstimatedLedgerCloseTimeSeconds(network);
    const maxLedger =
      currentLedger + Math.ceil(maxTimeoutSeconds / estimatedLedgerSeconds);

    const tx = await contract.AssembledTransaction.build({
      contractId: asset,
      method: "transfer",
      args: [
        nativeToScVal(source, { type: "address" }),
        nativeToScVal(payTo, { type: "address" }),
        nativeToScVal(amount, { type: "i128" }),
      ],
      networkPassphrase,
      rpcUrl,
      parseResultXdr: (result) => result,
    });
    handleSimulationResult(tx.simulation);

    let missingSigners = tx.needsNonInvokerSigningBy();
    if (!missingSigners.includes(source) || missingSigners.length > 1) {
      throw new Error(
        `Expected to sign with [${source}], but got [${missingSigners.join(", ")}]`,
      );
    }

    await tx.signAuthEntries({
      address: source,
      expiration: maxLedger,
      authorizeEntry: this.signer.authorizeEntry,
    });

    await tx.simulate();
    handleSimulationResult(tx.simulation);
    missingSigners = tx.needsNonInvokerSigningBy();
    if (missingSigners.length > 0) {
      throw new Error(`unexpected signer(s) required: [${missingSigners.join(", ")}]`);
    }

    return {
      x402Version,
      payload: { transaction: tx.built.toXDR() },
    };
  }

  #validate(paymentRequirements) {
    const { scheme, network, payTo, asset, amount } = paymentRequirements;
    if (
      typeof amount !== "string" ||
      !Number.isInteger(Number(amount)) ||
      Number(amount) <= 0
    ) {
      throw new Error(`Invalid amount: ${amount}. Amount must be a positive integer.`);
    }
    if (scheme !== "exact") throw new Error(`Unsupported scheme: ${scheme}`);
    if (!isStellarNetwork(network)) {
      throw new Error(`Unsupported Stellar network: ${network}`);
    }
    if (!validateStellarDestinationAddress(payTo)) {
      throw new Error(`Invalid Stellar destination address: ${payTo}`);
    }
    if (!validateStellarAssetAddress(asset)) {
      throw new Error(`Invalid Stellar asset address: ${asset}`);
    }
  }
}

export function blobLooksLikeOnChainCap(value) {
  const raw = typeof value === "string" ? value : JSON.stringify(value ?? {});
  const lower = raw.toLowerCase();
  return (
    lower.includes("dailycapexceeded") ||
    lower.includes("daily_cap_exceeded") ||
    lower.includes("daily cap") ||
    lower.includes("cap_hit") ||
    /error\(\s*contract\s*,\s*#3\s*\)/.test(lower)
  );
}
