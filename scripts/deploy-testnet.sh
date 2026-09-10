#!/usr/bin/env bash
# Optional: build/deploy spend-account. Live x402 settle does NOT require this.
# Does not invent a contract id — prints whatever the CLI returns.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONTRACT="$ROOT/contracts/spend-account"
NETWORK="${STELLAR_NETWORK:-stellar:testnet}"
USDC_SAC="${USDC_SAC:-CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA}"
USDC_ISSUER="${USDC_ISSUER:-GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5}"

if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

echo "=== AgentPaywall testnet notes (factual) ==="
echo "Network:        stellar:testnet"
echo "USDC issuer:    $USDC_ISSUER"
echo "USDC SAC:       $USDC_SAC"
echo "Facilitator:    ${FACILITATOR_URL:-https://channels.openzeppelin.com/x402/testnet}"
echo
echo "Fund XLM (Friendbot):"
echo "  curl \"https://friendbot.stellar.org?addr=G...\""
echo "  or https://lab.stellar.org/account/fund"
echo
echo "USDC trustline (both merchant G... and payer G...):"
echo "  node scripts/add-usdc-trustline.mjs"
echo "  Lab: Change Trust, asset USDC, issuer $USDC_ISSUER"
echo
echo "Payer testnet USDC (Captcha, no API):"
echo "  https://faucet.circle.com  →  network: Stellar Testnet"
echo
echo "OZ facilitator key:"
echo "  https://channels.openzeppelin.com/testnet/gen  →  OZ_API_KEY"
echo
echo "Live x402 payTo is STELLAR_RECIPIENT (classic G...), not this contract."
echo "Spend-account __check_auth is a follow-on if you make the contract the payer."
echo

if [[ "$NETWORK" != "stellar:testnet" ]]; then
  echo "This script targets stellar:testnet. Refusing network=$NETWORK"
  exit 1
fi

if [[ "${1:-}" == "--notes-only" ]]; then
  exit 0
fi

if ! command -v stellar >/dev/null 2>&1; then
  echo "Stellar CLI not installed — skipping wasm deploy."
  echo "  https://developers.stellar.org/docs/tools/developer-tools/cli/install-cli"
  echo "Live settle still works with a classic G... payer after the notes above."
  exit 0
fi

if ! rustup target list --installed | grep -q wasm32-unknown-unknown; then
  echo "Adding wasm32-unknown-unknown rustup target..."
  rustup target add wasm32-unknown-unknown
fi

SOURCE="${STELLAR_DEPLOY_IDENTITY:-${STELLAR_IDENTITY:-}}"

echo "==> cargo test (native)"
(
  cd "$CONTRACT"
  cargo test --locked
)

echo "==> stellar contract build"
(
  cd "$CONTRACT"
  stellar contract build
)

WASM="$CONTRACT/target/wasm32-unknown-unknown/release/spend_account.wasm"
if [[ ! -f "$WASM" ]]; then
  WASM="$ROOT/target/wasm32-unknown-unknown/release/spend_account.wasm"
fi
if [[ ! -f "$WASM" ]]; then
  echo "Build finished but wasm not found. Check stellar contract build output."
  exit 1
fi
echo "wasm: $WASM"

if [[ -z "$SOURCE" ]]; then
  echo
  echo "Build only. Deploy when you have a funded Stellar CLI identity:"
  echo "  stellar contract deploy --wasm $WASM --network testnet --source <identity> \\"
  echo "    -- \\"
  echo "    --owner <bytes32 ed25519 pubkey hex> \\"
  echo "    --token $USDC_SAC \\"
  echo "    --daily_limit 100000"
  echo
  echo "daily_limit is 7-decimal USDC (0.01 USDC = 100000)."
  echo "Put the printed C... in SPEND_ACCOUNT_CONTRACT_ID. Do not invent one."
  exit 0
fi

DAILY_LIMIT="${DAILY_LIMIT_BASE_UNITS:-100000}"
OWNER="${SPEND_ACCOUNT_OWNER_BYTES:-}"
if [[ -z "$OWNER" ]]; then
  echo "Set SPEND_ACCOUNT_OWNER_BYTES to the 32-byte ed25519 public key (hex) for the constructor."
  exit 1
fi

echo "==> deploy constructor owner=$OWNER token=$USDC_SAC daily_limit=$DAILY_LIMIT"
stellar contract deploy \
  --wasm "$WASM" \
  --network testnet \
  --source "$SOURCE" \
  -- \
  --owner "$OWNER" \
  --token "$USDC_SAC" \
  --daily_limit "$DAILY_LIMIT"

echo
echo "Copy the C... contract id above into SPEND_ACCOUNT_CONTRACT_ID in .env"
echo "That address is yours after deploy — it is not an official constant."
