/**
 * Official Stellar x402 / testnet USDC constants.
 * Source: https://developers.stellar.org/docs/build/agentic-payments/x402
 * Do not invent additional issuer, SAC, or facilitator URLs.
 */
export const STELLAR_NETWORK = "stellar:testnet";

export const USDC_ISSUER =
  "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

/** Testnet USDC Soroban Asset Contract (SEP-41). */
export const USDC_SAC =
  "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";

export const FACILITATOR_URL =
  "https://channels.openzeppelin.com/x402/testnet";

export const OZ_KEY_GEN_URL = "https://channels.openzeppelin.com/testnet/gen";

export const HORIZON_URL = "https://horizon-testnet.stellar.org";
export const SOROBAN_RPC_URL = "https://soroban-testnet.stellar.org";

/** Stellar USDC has 7 decimals. "$0.001" = 10_000 base units. */
export const USDC_DECIMALS = 7;

export const DEFAULT_PRICE = "$0.001";
export const DEFAULT_PRICE_BASE_UNITS = 10_000n;

export const DOCS = {
  x402: "https://developers.stellar.org/docs/build/agentic-payments/x402",
  builtOnStellar:
    "https://developers.stellar.org/docs/build/agentic-payments/x402/built-on-stellar",
  quickstart:
    "https://developers.stellar.org/docs/build/agentic-payments/x402/quickstart-guide",
  spendLimits:
    "https://developers.stellar.org/docs/build/guides/contract-accounts/advanced-patterns",
  complexAccount:
    "https://developers.stellar.org/docs/build/smart-contracts/example-contracts/complex-account",
  demo: "https://stellar.org/x402-demo",
  npm: "https://www.npmjs.com/package/@x402/stellar",
};
