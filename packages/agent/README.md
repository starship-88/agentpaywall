# `@agentpaywall/agent`

CLI that **pays**. The human does not live here.

```bash
npm run start -w @agentpaywall/agent -- --pair USD-MXN --verbose
npm run start -w @agentpaywall/agent -- --until-cap
```

- **Stub API:** unsigned GET → 402 → `PAYMENT-SIGNATURE` retry (no chain).
- **Live API:** `wrapFetchWithPaymentFromConfig` + `createEd25519Signer(secret, "stellar:testnet")` + `ExactStellarScheme`. Pass the raw `S...` string and CAIP-2 id — do not wrap a `Keypair`. Underfunded / missing trustline / bad OZ key print as those errors, not a generic throw.

`.env` at the repo root: `STELLAR_SECRET_KEY`, `STELLAR_RPC_URL`, `API_PORT`.
