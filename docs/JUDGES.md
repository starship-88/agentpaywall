# 30 seconds for judges

**AgentPaywall** — APIs that charge **per HTTP request in USDC** using **x402 on Stellar**. A human sets a **daily spend cap**. The agent can pay until the money is gone, then **the chain says no**.

## Pitch (say this)

Agents will burn your treasury if they can sign freely. We put the budget in a **Soroban contract account** (`__check_auth`), not in the bot’s config file. Every FX quote is an x402 Exact payment on `stellar:testnet` USDC. Exceed the cap and settlement **fails on-chain**.

## What you are looking at

| Surface | Role |
| --- | --- |
| `packages/web` | Human: set daily USDC cap, watch 402 / paid / cap-hit |
| `packages/agent` | Agent: GET `/v1/fx`, handle 402, sign auth entries, retry |
| `packages/api` | Seller: Exact scheme resource server (`@x402/express` + `@x402/stellar`) |
| `contracts/spend-account` | Daily window + remaining allowance inside `__check_auth` |

Official network/asset/facilitator only:

- Network: `stellar:testnet`
- USDC issuer: `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`
- USDC SAC: `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA`
- OZ facilitator: `https://channels.openzeppelin.com/x402/testnet`

There is **no** official spend-account `C...` constant. Deploy yours with `scripts/deploy-testnet.sh`. This repo’s live demo instance (testnet, already deployed — not an official constant) is `CAPRBG7V5JQRGWNQ5Z5AKRQ4X46G3UJRQNVXLUKZIWHEHWBNAMBBNRR5`.

## Adversarial demo (cap hit)

**Live (judges path):** budget lives in `__check_auth`, not the bot config or the dashboard setter.

1. Open the web UI. Daily cap / Spent / Remaining must show an **on-chain** badge and match `GET /v1/status` `spendAccount` (`remainingBaseUnits` is `0` after this instance’s `--until-cap` until the UTC day rolls).
2. Human looks at **web remaining (on-chain)** — not the in-memory `DAILY_CAP_USDC` setter. That setter is stub/UI only and does **not** call `set_daily_limit`.
3. `npm run start -w @agentpaywall/agent -- --until-cap` until **CAP_HIT** (`DailyCapExceeded` / `DAILY_CAP_EXCEEDED`).
4. Cards stay at on-chain remaining `0`. Live Exact `from` is the C… above.

**Stub** (no `SPEND_ACCOUNT_CONTRACT_ID`): set the in-memory cap to two quotes (`0.002` USDC at `$0.001`) and run the same loop. Proves the HTTP 402 → pay → 200 path without an OZ key.

Stub vs live is labeled on `/v1/status` (`mode` + `settle` + `spendAccount.source`). When the contract id is set, `spendAccount.enforcesLiveTransfers` is true and the agent’s `from` is that C… — not a classic G payer.

## Why Stellar

x402 on Stellar signs **Soroban authorization entries**, not full envelopes. The facilitator sponsors fees. The same auth path is where a contract account can refuse a USDC `transfer`. Spend limits are a documented contract-account pattern, not a sidecar database.

## Docs we followed

- https://developers.stellar.org/docs/build/agentic-payments/x402
- https://developers.stellar.org/docs/build/guides/contract-accounts/advanced-patterns
- https://developers.stellar.org/docs/build/smart-contracts/example-contracts/complex-account
- https://stellar.org/x402-demo
- Package: `@x402/stellar`
