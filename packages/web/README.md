# `@agentpaywall/web`

Light lavender console for the human budget: daily USDC cap, FX quotes, and activity. Styled after a marketing-app look (airy gradient, pill buttons, soft cards) without third-party trademarks.

English and Spanish share one `i18n` dictionary. The language switcher (EN | ES) persists in `localStorage` (`agentpaywall.lang`) and defaults to the browser language when it starts with `es`.

The agent is the CLI — this UI does **not** sign x402 payments. **Get a quote (pay)** probes `GET /v1/fx` and should return **402 PAYMENT-REQUIRED**.

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
