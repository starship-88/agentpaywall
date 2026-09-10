# `@agentpaywall/web`

Human console: daily USDC cap + activity. The agent is the CLI, not this page.

```bash
npm run dev:web
# http://127.0.0.1:41791
```

Talks to the API (`VITE_API_URL`, default `http://127.0.0.1:40211`). Probe `/v1/fx` from the browser to see a **402** — browsers here do not sign auth entries.
