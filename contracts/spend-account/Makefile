.PHONY: test build inspect

# Stellar CLI builds the cdylib for testnet deploy.
# https://developers.stellar.org/docs/tools/developer-tools/cli/stellar-cli

test:
	cargo test

build:
	stellar contract build

inspect: build
	stellar contract info interface --wasm ../../target/wasm32-unknown-unknown/release/spend_account.wasm
