#!/usr/bin/env node
/**
 * Add a testnet USDC trustline (official Circle issuer only).
 * Usage: node scripts/add-usdc-trustline.mjs [S...secret]
 * Default secret: STELLAR_SECRET_KEY from repo .env
 * Never prints the secret.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import {
  Asset,
  BASE_FEE,
  Horizon,
  Keypair,
  Networks,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(root, ".env") });

const USDC_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
const HORIZON = process.env.STELLAR_HORIZON_URL || "https://horizon-testnet.stellar.org";

const secret = process.argv[2] || process.env.STELLAR_SECRET_KEY || process.env.STELLAR_RECIPIENT_SECRET;
if (!secret || !secret.startsWith("S")) {
  console.error("Need an S... secret: STELLAR_SECRET_KEY in .env or argv.");
  process.exit(1);
}

const kp = Keypair.fromSecret(secret);
const horizon = new Horizon.Server(HORIZON);
const account = await horizon.loadAccount(kp.publicKey());
const tx = new TransactionBuilder(account, {
  fee: BASE_FEE,
  networkPassphrase: Networks.TESTNET,
})
  .addOperation(
    Operation.changeTrust({
      asset: new Asset("USDC", USDC_ISSUER),
    }),
  )
  .setTimeout(60)
  .build();
tx.sign(kp);
const result = await horizon.submitTransaction(tx);
console.log(`trustline USDC/${USDC_ISSUER} on ${kp.publicKey()}`);
console.log(`hash ${result.hash}`);
console.log("If this account is the payer, fund USDC at https://faucet.circle.com (Stellar Testnet).");
