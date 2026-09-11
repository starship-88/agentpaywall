# `@agentpaywall/agent`

CLI that **pays**. The human does not live here.

```bash
npm run start -w @agentpaywall/agent -- --pair USD-MXN --verbose
npm run start -w @agentpaywall/agent -- --until-cap
```

- **Stub API:** unsigned GET → 402 → `PAYMENT-SIGNATURE` retry (no chain).
- **Live + spend-account:** Exact `from` = `SPEND_ACCOUNT_CONTRACT_ID`. Owner `STELLAR_RECIPIENT_SECRET` signs `Vec<AccSignature>` (stock `@x402/stellar` 2.12 does not forward `authorizeEntry`).
- **Live classic:** `createEd25519Signer(STELLAR_SECRET_KEY, "stellar:testnet")` if no C… is set.

`.env` at the repo root: `SPEND_ACCOUNT_CONTRACT_ID`, `STELLAR_RECIPIENT_SECRET`, `STELLAR_SECRET_KEY`, `STELLAR_RPC_URL`, `API_PORT`. Never commit secrets.
