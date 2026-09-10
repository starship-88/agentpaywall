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

We do **not** ship a fabricated spend-account `C...` address. Deploy yours with `scripts/deploy-testnet.sh`.

## Adversarial demo (cap hit)

1. Open the web UI. Set daily cap to **0.002 USDC** (two paid requests at `$0.001`).
2. In a terminal: `npm run start -w @agentpaywall/agent -- --until-cap`
3. First request(s): **200** + mock USD-MXN.
4. Next request: **402** `DAILY_CAP_EXCEEDED` (stub) **or** facilitator/`__check_auth` reject (live).
5. Activity log shows `cap`. That is the product.

Stub vs live is labeled on `/v1/status` (`mode` + `settle`). Stub proves the HTTP loop without an OZ key. Live Exact settle: README **Live settle checklist** (OZ key, Friendbot, Circle USDC, trustlines). Spend-account is optional and is not the live `from` today.

## Why Stellar

x402 on Stellar signs **Soroban authorization entries**, not full envelopes. The facilitator sponsors fees. The same auth path is where a contract account can refuse a USDC `transfer`. Spend limits are a documented contract-account pattern, not a sidecar database.

## Docs we followed

- https://developers.stellar.org/docs/build/agentic-payments/x402
- https://developers.stellar.org/docs/build/guides/contract-accounts/advanced-patterns
- https://developers.stellar.org/docs/build/smart-contracts/example-contracts/complex-account
- https://stellar.org/x402-demo
- Package: `@x402/stellar`
