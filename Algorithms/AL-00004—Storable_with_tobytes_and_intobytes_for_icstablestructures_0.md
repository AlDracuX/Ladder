---
id: AL-00004
title: "Storable with to_bytes and into_bytes for ic-stable-structures 0.7"
status: complete
created: 2026-03-22
domain: "icp-canister-development"
tags: [rust, icp, canister, stable-storage, serialization, candid, derive-macro]
experiments: []
complexity: low
---

## Description

Boilerplate pattern for implementing `ic_stable_structures::Storable` on types stored in `StableBTreeMap`. Version 0.7.x requires both `to_bytes` (borrow) and `into_bytes` (owned) methods. The Awen codebase provides two approaches: a `#[derive(CandidStorable)]` proc macro for automatic implementation, and manual `impl Storable` for types needing custom serialization.

## Method

### Approach 1: `#[derive(CandidStorable)]` (preferred)

1. Add `CandidStorable` to the derive list alongside `CandidType`, `Deserialize`, `Clone`, `Debug`, and `Default`.

2. The proc macro in `packages/awen_macros` generates the full `Storable` impl automatically:
   - `to_bytes`: `Cow::Owned(candid::encode_one(self).unwrap_or_default())`
   - `into_bytes`: `candid::encode_one(&self).unwrap_or_default()`
   - `from_bytes`: `candid::decode_one(&bytes)` with fallback to `Self::default()` on decode failure (logs a warning in wasm builds about possible schema migration)
   - `BOUND`: `Bound::Unbounded`

```rust
use awen_types::CandidStorable;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, Default, CandidStorable)]
pub struct StoredEvidence {
    pub id: u64,
    pub owner: Principal,
    pub hash: String,
    pub filename: String,
    // ... fields ...
}
// No manual Storable impl needed -- CandidStorable generates it.
```

### Approach 2: Manual `impl Storable` (for custom serialization)

For types that need non-Candid serialization (e.g., `StringKey` using raw UTF-8 bytes) or bounded size:

```rust
impl Storable for StringKey {
    fn to_bytes(&self) -> Cow<'_, [u8]> {
        Cow::Owned(self.0.as_bytes().to_vec())
    }

    fn into_bytes(self) -> Vec<u8> {
        self.0.into_bytes()
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Self(String::from_utf8_lossy(&bytes).into_owned())
    }

    const BOUND: Bound = Bound::Bounded {
        max_size: 128,
        is_fixed_size: false,
    };
}
```

### Approach 3: Manual Candid `impl Storable` (pre-macro legacy)

The `idempotency.rs` module uses manual Candid encoding (written before the derive macro existed):

```rust
impl Storable for ProcessedRequest {
    fn to_bytes(&self) -> Cow<'_, [u8]> {
        Cow::Owned(candid::encode_one(self).unwrap_or_default())
    }

    fn into_bytes(self) -> Vec<u8> {
        candid::encode_one(&self).unwrap_or_default()
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap_or_else(|_| ProcessedRequest {
            idempotency_key: String::new(),
            response_hash: [0; 32],
            processed_at: 0,
            expires_at: 0,
        })
    }

    const BOUND: Bound = Bound::Unbounded;
}
```

### Key Requirements (0.7.x)

- **Both methods required**: `to_bytes(&self) -> Cow<[u8]>` borrows, `into_bytes(self) -> Vec<u8>` consumes. Earlier versions only had `to_bytes`.
- **`unwrap_or_default()`**: Never `unwrap()` or `expect()` -- workspace lints forbid them. Encode failures return empty bytes.
- **`from_bytes` fallback**: Must handle corrupted or schema-migrated data gracefully. Return `Self::default()` on decode failure.
- **`BOUND`**: Use `Bound::Unbounded` for variable-size Candid-encoded types. Use `Bound::Bounded { max_size, is_fixed_size }` for fixed-format types like string keys.

## When to Use

- Every type stored in a `StableBTreeMap`, `StableVec`, or `StableCell`.
- Prefer `#[derive(CandidStorable)]` for all new types.
- Use manual impl only for non-Candid serialization or bounded-size types.

## Inputs

- **Type requirements for CandidStorable derive**: Must implement `CandidType`, `Deserialize`, and `Default`.
- **For manual Candid impl**: Must implement `CandidType` and `Deserialize`.
- **For manual non-Candid impl**: Custom serialization logic.

## Outputs

- `to_bytes(&self) -> Cow<'_, [u8]>`: Borrowed serialization (returns owned `Cow::Owned` in practice since Candid encoding allocates).
- `into_bytes(self) -> Vec<u8>`: Consuming serialization.
- `from_bytes(bytes: Cow<[u8]>) -> Self`: Deserialization with graceful fallback.
- `const BOUND: Bound`: Size bound hint for the storage layer.

## Limitations

- **Candid overhead**: Candid encoding is not the most space-efficient format. Each encoded value includes type metadata. For high-volume types, consider custom binary encoding.
- **Schema evolution**: Adding fields to a Candid-encoded struct is forward-compatible (new fields get default values). Removing or reordering fields can break deserialization -- the `from_bytes` fallback to `Default` handles this but loses data.
- **`unwrap_or_default()` on encode**: If `candid::encode_one` fails (extremely rare -- only for recursive types), the stored bytes are empty. The type will deserialize as `Default` on read.
- **No versioning**: The pattern does not include explicit schema version numbers. Migration relies on Candid's inherent forward compatibility.

## Evidence

- **packages/awen_macros/src/lib.rs** lines 28-70: `#[proc_macro_derive(CandidStorable)]` full implementation generating `to_bytes`, `into_bytes`, `from_bytes` with decode failure logging and `Default` fallback.
- **evidence_vault/src/lib.rs** line 112: `#[derive(..., CandidStorable)]` on `StoredEvidence`.
- **evidence_vault/src/lib.rs** lines 603-621: Manual `impl Storable for StringKey` with `Bound::Bounded { max_size: 128 }` for string-key index types.
- **packages/awen_types/src/idempotency.rs** lines 29-48: Manual Candid-based `impl Storable for ProcessedRequest` with custom default on decode failure.
- **packages/awen_types/src/lib.rs** line 33: `pub use awen_macros::CandidStorable;` re-export so canisters use `awen_types::CandidStorable`.
