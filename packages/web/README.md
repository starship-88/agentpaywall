# `@agentpaywall/web`

Dark DeFi dashboard for the human budget: daily USDC cap, FX markets, and activity. Styled after typical Aave-like consoles (sidebar, metric cards, markets table) without Aave trademarks.

The agent is the CLI — this UI does **not** sign x402 payments. **Pay & quote** probes `GET /v1/fx` and should return **402 PAYMENT-REQUIRED**.

```bash
npm run dev:web
# http://127.0.0.1:41791
```

Talks to `VITE_API_URL` (default `http://127.0.0.1:40211`):

- `GET /v1/status` and `GET /v1/activity` (polled ~2s)
- `GET /v1/pairs`
- `POST /v1/budget` `{ dailyLimitUsdc }`
- `POST /v1/budget/reset`
- `GET /v1/fx?pair=`
