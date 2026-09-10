#![no_std]

//! Spend-account: a Soroban **contract account** with a rolling 24h USDC cap.
//!
//! Pattern: Complex Account `__check_auth`
//! https://developers.stellar.org/docs/build/smart-contracts/example-contracts/complex-account
//!
//! Spend-limit storage (instance) + UTC-day window from ledger timestamp:
//! https://developers.stellar.org/docs/build/guides/contract-accounts/advanced-patterns
//!
//! Intended payer for x402 Exact transfers of testnet USDC
//! (`CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA`).
//!
//! `__check_auth` is host-only. Do not call it from other contracts. It may
//! mutate spend totals because the host only invokes it during `require_auth`.

use soroban_sdk::{
    auth::{Context, CustomAccountInterface},
    contract, contracterror, contractimpl, contracttype, crypto::Hash, symbol_short, Address,
    BytesN, Env, Symbol, TryIntoVal, Vec,
};

const SECONDS_PER_DAY: u64 = 86_400;
const TRANSFER_FN: &str = "transfer";
const APPROVE_FN: &str = "approve";
const BURN_FN: &str = "burn";

#[contract]
pub struct SpendAccount;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    /// Ed25519 public key of the human/admin (32 bytes).
    Owner,
    /// SEP-41 token whose outflows count (testnet USDC SAC).
    Token,
    /// Daily cap in token base units (USDC = 7 decimals).
    DailyLimit,
    /// `ledger_timestamp / 86_400`
    WindowDay,
    /// Spend in the current window.
    SpentInWindow,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct AccSignature {
    pub public_key: BytesN<32>,
    pub signature: BytesN<64>,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum AccError {
    NotOwner = 1,
    NegativeAmount = 2,
    DailyCapExceeded = 3,
    UnknownSigner = 4,
}

#[contractimpl]
impl SpendAccount {
    /// `token` should be the USDC SAC for the target network.
    /// `daily_limit` is base units (0.01 USDC = 100_000 with 7 decimals).
    pub fn __constructor(env: Env, owner: BytesN<32>, token: Address, daily_limit: i128) {
        if daily_limit <= 0 {
            panic!("daily_limit must be positive");
        }
        env.storage().instance().set(&DataKey::Owner, &owner);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::DailyLimit, &daily_limit);
        env.storage().instance().set(&DataKey::WindowDay, &0u64);
        env.storage().instance().set(&DataKey::SpentInWindow, &0i128);
    }

    /// Human budget knob. Authorizes as this contract account (same `__check_auth`).
    pub fn set_daily_limit(env: Env, daily_limit: i128) {
        if daily_limit <= 0 {
            panic!("daily_limit must be positive");
        }
        env.current_contract_address().require_auth();
        env.storage()
            .instance()
            .set(&DataKey::DailyLimit, &daily_limit);
    }

    pub fn daily_limit(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::DailyLimit).unwrap()
    }

    pub fn token(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Token).unwrap()
    }

    pub fn spent_today(env: Env) -> i128 {
        roll_window(&env);
        env.storage()
            .instance()
            .get(&DataKey::SpentInWindow)
            .unwrap_or(0)
    }

    pub fn remaining(env: Env) -> i128 {
        let limit: i128 = env.storage().instance().get(&DataKey::DailyLimit).unwrap();
        let spent = Self::spent_today(env);
        if spent >= limit {
            0
        } else {
            limit - spent
        }
    }
}

fn current_day(env: &Env) -> u64 {
    env.ledger().timestamp() / SECONDS_PER_DAY
}

fn roll_window(env: &Env) {
    let day = current_day(env);
    let stored: u64 = env
        .storage()
        .instance()
        .get(&DataKey::WindowDay)
        .unwrap_or(0);
    if stored != day {
        env.storage().instance().set(&DataKey::WindowDay, &day);
        env.storage().instance().set(&DataKey::SpentInWindow, &0i128);
    }
}

fn authenticate(env: &Env, payload: &Hash<32>, signatures: &Vec<AccSignature>) -> Result<(), AccError> {
    if signatures.len() != 1 {
        return Err(AccError::UnknownSigner);
    }
    let sig = signatures.get(0).unwrap();
    let owner: BytesN<32> = env.storage().instance().get(&DataKey::Owner).unwrap();
    if sig.public_key != owner {
        return Err(AccError::NotOwner);
    }
    env.crypto()
        .ed25519_verify(&sig.public_key, &payload.clone().into(), &sig.signature);
    Ok(())
}

/// Inspect `transfer` / `approve` / `burn` against the configured token.
/// Nested subinvocations are walked so a wrapper contract cannot bypass the cap.
fn spend_from_context(env: &Env, ctx: &Context, tracked_token: &Address) -> Result<i128, AccError> {
    match ctx {
        Context::Contract(c) => {
            if &c.contract != tracked_token {
                return Ok(0);
            }
            let name = &c.fn_name;
            if *name != Symbol::new(env, TRANSFER_FN)
                && *name != Symbol::new(env, APPROVE_FN)
                && *name != Symbol::new(env, BURN_FN)
            {
                return Ok(0);
            }
            // SEP-41: `from, to, amount` — amount is args[2].
            let spent: i128 = c
                .args
                .get(2)
                .ok_or(AccError::NegativeAmount)?
                .try_into_val(env)
                .map_err(|_| AccError::NegativeAmount)?;
            if spent < 0 {
                return Err(AccError::NegativeAmount);
            }
            Ok(spent)
        }
        // Create-contract host fns (and any future Context variants) do not
        // count as USDC spend. Admin calls on this account also land here
        // with a different contract id, so they skip the cap.
        _ => Ok(0),
    }
}

#[contractimpl]
impl CustomAccountInterface for SpendAccount {
    type Signature = Vec<AccSignature>;
    type Error = AccError;

    #[allow(non_snake_case)]
    fn __check_auth(
        env: Env,
        signature_payload: Hash<32>,
        signatures: Vec<AccSignature>,
        auth_context: Vec<Context>,
    ) -> Result<(), AccError> {
        authenticate(&env, &signature_payload, &signatures)?;
        roll_window(&env);

        let tracked: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let mut additional: i128 = 0;
        for ctx in auth_context.iter() {
            additional = additional.saturating_add(spend_from_context(&env, &ctx, &tracked)?);
        }

        if additional == 0 {
            return Ok(());
        }

        let limit: i128 = env.storage().instance().get(&DataKey::DailyLimit).unwrap();
        let spent: i128 = env
            .storage()
            .instance()
            .get(&DataKey::SpentInWindow)
            .unwrap_or(0);

        if spent.saturating_add(additional) > limit {
            let remaining = if spent >= limit { 0 } else { limit - spent };
            env.events().publish(
                (symbol_short!("cap_hit"),),
                (additional, remaining, limit),
            );
            return Err(AccError::DailyCapExceeded);
        }

        env.storage()
            .instance()
            .set(&DataKey::SpentInWindow, &(spent + additional));
        Ok(())
    }
}

#[cfg(test)]
mod test;
