import { Keypair } from "@stellar/stellar-sdk";
const payer = Keypair.random();
const recv = Keypair.random();
process.stdout.write(JSON.stringify({
  payerSecret: payer.secret(),
  payerPublic: payer.publicKey(),
  recvSecret: recv.secret(),
  recvPublic: recv.publicKey(),
}));
