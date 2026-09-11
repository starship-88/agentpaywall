# spend-account — daily USDC cap in `__check_auth`

Soroban contract account used as the **agent payer**. A human sets `daily_limit`;
the agent signs auth entries. When a `transfer` (or `approve` / `burn`) on the
tracked token would exceed the UTC-day window, `__check_auth` returns
`DailyCapExceeded` and emits `cap_hit`. That is the adversarial demo.

## Pattern

- Complex Account: https://developers.stellar.org/docs/build/smart-contracts/example-contracts/complex-account
- Spend limits: https://developers.stellar.org/docs/build/guides/contract-accounts/advanced-patterns

Window key: `day = ledger.timestamp / 86_400`. Totals reset when the day changes.

## Token

Do not hard-code a deployed instance id. Pass the official testnet USDC SAC at
construct time:

`CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA`

## Build / test

Requires [Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools/cli/install-cli)
and the `wasm32-unknown-unknown` target.

```bash
# from this directory
make test
make build
```

Deploy is **not** done in CI. Use `scripts/deploy-testnet.sh` from the repo root
after you have a funded testnet identity. The script prints a `C...` contract id
— put that in `SPEND_ACCOUNT_CONTRACT_ID`. Never commit a made-up address.

## VERIFY / live x402

Set `SPEND_ACCOUNT_CONTRACT_ID` to the C… this deploy printed. Live Exact uses that
contract as SAC `transfer` `from`. `__check_auth` runs on every paid `/v1/fx`.

The agent signs with `STELLAR_RECIPIENT_SECRET` — the constructor **owner**
ed25519 key (merchant G…), not a second invented owner. Fund the C… with
testnet USDC. Dashboard `DAILY_CAP_USDC` is the stub/UI window; on-chain
`daily_limit` is the live `--until-cap` demo.
