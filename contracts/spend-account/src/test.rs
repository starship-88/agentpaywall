#![cfg(test)]

use super::*;
use ed25519_dalek::{Keypair, PublicKey, SecretKey, Signer};
use soroban_sdk::{
    auth::{Context, ContractContext},
    testutils::Address as _,
    vec, Address, BytesN, Env, IntoVal, Symbol, Val,
};

fn owner_keys() -> Keypair {
    let secret = SecretKey::from_bytes(&[7u8; 32]).unwrap();
    let public = PublicKey::from(&secret);
    Keypair { secret, public }
}

fn owner_pk(env: &Env, kp: &Keypair) -> BytesN<32> {
    BytesN::from_array(env, &kp.public.to_bytes())
}

fn sign(env: &Env, kp: &Keypair, payload: &BytesN<32>) -> Val {
    let sig = kp.sign(payload.to_array().as_slice());
    AccSignature {
        public_key: owner_pk(env, kp),
        signature: BytesN::from_array(env, &sig.to_bytes()),
    }
    .into_val(env)
}

fn token_transfer_ctx(env: &Env, token: &Address, amount: i128) -> Context {
    Context::Contract(ContractContext {
        contract: token.clone(),
        fn_name: Symbol::new(env, "transfer"),
        args: vec![
            env,
            Address::generate(env).to_val(),
            Address::generate(env).to_val(),
            amount.into_val(env),
        ],
    })
}

fn deploy(env: &Env, limit: i128) -> (Address, Address, Keypair) {
    let sk = owner_keys();
    let token = Address::generate(env);
    let id = env.register(SpendAccount, (owner_pk(env, &sk), token.clone(), limit));
    (id, token, sk)
}

#[test]
fn allows_transfer_under_cap() {
    let env = Env::default();
    let (account, token, sk) = deploy(&env, 1_000);
    let payload = BytesN::from_array(&env, &[1u8; 32]);
    env.try_invoke_contract_check_auth::<AccError>(
        &account,
        &payload,
        vec![&env, sign(&env, &sk, &payload)].into(),
        &vec![&env, token_transfer_ctx(&env, &token, 400)],
    )
    .unwrap();

    let client = SpendAccountClient::new(&env, &account);
    assert_eq!(client.spent_today(), 400);
    assert_eq!(client.remaining(), 600);
}

#[test]
fn rejects_transfer_over_cap() {
    let env = Env::default();
    let (account, token, sk) = deploy(&env, 1_000);
    let payload = BytesN::from_array(&env, &[2u8; 32]);
    let err = env
        .try_invoke_contract_check_auth::<AccError>(
            &account,
            &payload,
            vec![&env, sign(&env, &sk, &payload)].into(),
            &vec![&env, token_transfer_ctx(&env, &token, 1_001)],
        )
        .err()
        .unwrap()
        .unwrap();
    assert_eq!(err, AccError::DailyCapExceeded);
}

#[test]
fn cumulative_spend_hits_cap_on_second_call() {
    let env = Env::default();
    let (account, token, sk) = deploy(&env, 1_000);
    let p1 = BytesN::from_array(&env, &[3u8; 32]);
    env.try_invoke_contract_check_auth::<AccError>(
        &account,
        &p1,
        vec![&env, sign(&env, &sk, &p1)].into(),
        &vec![&env, token_transfer_ctx(&env, &token, 800)],
    )
    .unwrap();

    let p2 = BytesN::from_array(&env, &[4u8; 32]);
    let err = env
        .try_invoke_contract_check_auth::<AccError>(
            &account,
            &p2,
            vec![&env, sign(&env, &sk, &p2)].into(),
            &vec![&env, token_transfer_ctx(&env, &token, 300)],
        )
        .err()
        .unwrap()
        .unwrap();
    assert_eq!(err, AccError::DailyCapExceeded);
}
