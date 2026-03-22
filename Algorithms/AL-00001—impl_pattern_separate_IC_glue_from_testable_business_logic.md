---
id: AL-00001
title: "_impl pattern: separate IC glue from testable business logic"
status: complete
created: 2026-03-22
domain: "icp-canister-development"
tags: [rust, icp, canister, testing, architecture, separation-of-concerns]
experiments: []
complexity: low
---

## Description

Structural pattern for ICP canisters that separates Internet Computer runtime glue (`#[update]`/`#[query]` entry points) from pure business logic (`_impl` functions). The entry point handles authentication via `require_auth!()` and delegates to a testable function that receives an `AuthContext` parameter instead of calling `ic_cdk` directly.

## Method

1. **Define the `#[update]` or `#[query]` entry point** as a thin wrapper. It calls `awen_types::require_auth!()` to authenticate the caller (rejecting anonymous principals), producing an `AuthContext` struct containing `caller: Principal`, `is_controller: bool`, `is_authorized_canister: bool`, and `now: u64`.

2. **Delegate immediately to a `_impl` function** passing the request and `&AuthContext`. The entry point does no business logic itself.

3. **Implement all logic in the `_impl` function.** This function reads `auth.caller` and `auth.now` instead of calling `ic_cdk::api::msg_caller()` or `ic_cdk::api::time()` directly. It accesses stable storage via `thread_local!` macros but is otherwise a pure function.

4. **In unit tests**, call `_impl` functions directly with `AuthContext::for_test(caller, now)` -- no IC runtime needed.

```rust
// Entry point -- thin wrapper
#[update]
async fn store_evidence(request: StoreEvidenceRequest) -> Result<Evidence, EvidenceError> {
    let auth = awen_types::require_auth!();
    store_evidence_impl(request, &auth).await
}

// Business logic -- unit-testable
async fn store_evidence_impl(
    request: StoreEvidenceRequest,
    auth: &AuthContext,
) -> Result<Evidence, EvidenceError> {
    let caller = auth.caller;
    let timestamp = auth.now;
    validate_store_evidence_request(&request)?;
    // ... all business logic here ...
}

// Unit test -- no IC runtime
#[test]
async fn test_store_evidence() {
    let auth = AuthContext::for_test(test_principal(), 1_000_000_000);
    let result = store_evidence_impl(request, &auth).await;
    assert!(result.is_ok());
}
```

## When to Use

- Every `#[update]` and `#[query]` method in every canister. This is a mandatory pattern across all 9 Awen Network canisters. No exceptions.
- When you need to unit-test canister logic without PocketIC or a running replica.
- When multiple entry points share logic (e.g., `store_evidence` and `batch_import` both call validation).

## Inputs

- **`AuthContext`**: Bundled caller metadata created by `require_auth!()` in production or `AuthContext::for_test()` in tests. Fields: `caller` (Principal), `is_controller` (bool), `is_authorized_canister` (bool), `now` (u64 nanoseconds).
- **Request type**: The canister-specific request struct (e.g., `StoreEvidenceRequest`).

## Outputs

- **`Result<ResponseType, ErrorType>`**: The `_impl` function returns a typed Result. The entry point passes it through unchanged.

## Limitations

- `_impl` functions still access `thread_local!` stable storage, so they are not fully pure -- they require storage to be initialized. In tests, storage is initialized via `StableBTreeMap::init(get_test_memory())`.
- Async `_impl` functions (those making inter-canister calls) cannot be tested in pure unit tests without mocking. They require PocketIC integration tests.
- The `require_auth!()` macro uses `from_ic()` which returns `None` in non-wasm builds, so `#[update]` wrappers themselves are never invoked in unit tests -- only `_impl` functions are tested directly.

## Evidence

- **evidence_vault/src/lib.rs**: 20+ `_impl` functions including `store_evidence_impl`, `get_evidence_impl`, `list_evidence_impl`, `verify_evidence_impl`, `grant_access_impl`, `revoke_access_impl`, `redact_evidence_impl`, `rollback_evidence_impl`.
- **case_timeline/src/lib.rs**: `add_event_impl`, `list_events_impl`, `generate_bundle_impl` etc.
- **case_hub/src/lib.rs**: `create_case_impl`, `delete_case_impl`, `begin_saga_impl`, `complete_saga_step_impl`.
- **packages/awen_types/src/security.rs**: `AuthContext` struct definition and `from_ic()`, `for_test()`, `controller_for_test()` constructors.
- **packages/awen_types/src/lib.rs** lines 50-63: `require_auth!` macro definition.
