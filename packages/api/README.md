# `@agentpaywall/api`

Express resource server for **x402 Exact** on `stellar:testnet`.

```bash
# from repo root
npm run dev:api
# http://127.0.0.1:40211
```

| Route | Auth | Notes |
| --- | --- | --- |
| `GET /health` | open | liveness |
| `GET /v1/status` | open | `stub` vs `live`, VERIFY list |
| `GET /v1/pairs` | open | mock FX pairs |
| `GET /v1/activity` | open | dashboard log |
| `POST /v1/budget` | open (local demo) | `{ "dailyLimitUsdc": 0.01 }` |
| `GET /v1/fx?pair=USD-MXN` | **x402** | 402 → pay → 200 mock quote |

Live middleware: `paymentMiddleware` + `x402ResourceServer` + `ExactStellarScheme` + OZ `HTTPFacilitatorClient` (`Authorization: Bearer $OZ_API_KEY`).

`X402_MODE=auto` (default): **live** when `OZ_API_KEY` and a classic `STELLAR_RECIPIENT` (`G...`) are set — stub turns **off**. `/v1/status` reports `mode`, `settle`, facilitator probe, and Horizon trustline. A bad key stays in live mode and `/v1/fx` returns **503 FACILITATOR_UNAVAILABLE** (not a silent stub). `X402_MODE=stub` forces the local paywall.
