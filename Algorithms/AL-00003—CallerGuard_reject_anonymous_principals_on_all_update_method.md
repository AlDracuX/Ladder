---
id: AL-00003
title: "CallerGuard: reject anonymous principals on all update methods"
status: complete
created: 2026-03-22
domain: "icp-canister-development"
tags: [rust, icp, canister, security, authentication, principal]
experiments: []
complexity: low
---

## Description

Security pattern that rejects the anonymous principal (`2vxsx-fae`) on all state-mutating canister endpoints. Implemented via the `require_auth!()` macro which wraps `AuthContext::from_ic()`, returning an `Unauthorized` error before any business logic executes. Combined with `inspect_message` for early rejection at the ingress layer.

## Method

### Layer 1: `require_auth!()` Macro (per-method guard)

1. Every `#[update]` method starts with `let auth = awen_types::require_auth!();` as its first line.

2. The macro calls `AuthContext::from_ic()` which checks `ic_cdk::api::msg_caller() != Principal::anonymous()`. If anonymous, returns `None`.

3. On `None`, the macro early-returns `Err(AwenError::Unauthorized { action: "call", reason: "Anonymous callers not permitted" })`, converted into the canister's error type via `From`/`Into`.

4. On `Some(ctx)`, the `AuthContext` is populated with caller principal, controller status, and current IC time.

```rust
// The macro expands to:
macro_rules! require_auth {
    () => {
        match awen_types::security::AuthContext::from_ic() {
            Some(ctx) => ctx,
            None => {
                return Err(awen_types::AwenError::Unauthorized {
                    action: "call".to_string(),
                    reason: "Anonymous callers not permitted".to_string(),
                }.into())
            },
        }
    };
}

// Usage in every #[update]:
#[update]
async fn store_evidence(request: StoreEvidenceRequest) -> Result<Evidence, EvidenceError> {
    let auth = awen_types::require_auth!();
    store_evidence_impl(request, &auth).await
}
```

### Layer 2: `require_controller!()` Macro (privileged methods)

For admin-only methods (e.g., `set_feature_flags`), `require_controller!()` first calls `require_auth!()`, then checks `auth.is_controller`. Non-controllers get `Unauthorized { action: "configure", reason: "Only controllers can perform this action" }`.

```rust
#[update]
fn set_feature_flags(flags: FeatureFlags) -> Result<(), AwenError> {
    let _auth = awen_types::require_controller!();
    // ... admin logic ...
}
```

### Layer 3: `inspect_message` (early ingress rejection)

Each canister defines an `inspect_message` hook that rejects anonymous callers before the message even enters the execution queue. This saves cycles by rejecting at the ingress layer. The `AUTHENTICATED_METHODS` constant in `security.rs` lists all methods requiring authentication.

### Special Case: Anonymous Submissions

Token-authenticated anonymous submissions (e.g., whistleblower evidence) bypass `require_auth!()` and instead use `AuthContext::anonymous_submission(ic_cdk::api::time())` which explicitly sets `caller: Principal::anonymous()`. The submission is authenticated by its token, not the principal.

```rust
#[update]
async fn submit_anonymous_evidence(submission: AnonymousSubmission) -> Result<SubmissionReceipt, EvidenceError> {
    let auth = AuthContext::anonymous_submission(ic_cdk::api::time());
    submit_anonymous_evidence_impl(submission, &auth).await
}
```

## When to Use

- Every `#[update]` method that modifies state. This is a security requirement across all 9 canisters.
- Use `require_auth!()` for standard user methods.
- Use `require_controller!()` for admin/configuration methods.
- Use `AuthContext::anonymous_submission()` only for token-gated anonymous flows.

## Inputs

- **Implicit**: `ic_cdk::api::msg_caller()` and `ic_cdk::api::is_controller()` from the IC runtime.
- **Produced**: `AuthContext { caller, is_controller, is_authorized_canister, now }`.

## Outputs

- **Success**: `AuthContext` struct ready for passing to `_impl` functions.
- **Failure**: `Err(AwenError::Unauthorized { action, reason })` returned immediately, preventing any business logic execution.

## Limitations

- **Query methods**: `#[query]` methods do not use `require_auth!()` by default because queries cannot modify state. Some query methods that expose sensitive data still check ownership within their `_impl` function (e.g., `get_evidence_impl` checks `e.owner == caller || has_access_at(...)`).
- **Ingress vs inter-canister**: `inspect_message` only fires for ingress messages (user -> canister), not for inter-canister calls. Cross-canister authentication relies on `config.authorized_canisters` allowlists checked inside `_impl` functions.
- **Test builds**: `AuthContext::from_ic()` returns `None` in non-wasm32 builds, so `#[update]` wrappers are never callable in unit tests. Tests call `_impl` directly with `AuthContext::for_test()`.

## Evidence

- **packages/awen_types/src/lib.rs** lines 49-63: `require_auth!` macro definition with `from_ic()` call and anonymous check.
- **packages/awen_types/src/lib.rs** lines 74-90: `require_controller!` macro definition.
- **packages/awen_types/src/security.rs** lines 20-92: `AuthContext` struct with `from_ic()` (checks `caller != Principal::anonymous()`), `for_test()`, `controller_for_test()`, `anonymous_submission()` constructors.
- **packages/awen_types/src/security.rs** lines 94-100: `AUTHENTICATED_METHODS` constant listing all protected endpoints.
- **evidence_vault/src/lib.rs** lines 3410-3414: `store_evidence` showing `require_auth!()` usage.
- **evidence_vault/src/lib.rs** lines 3425-3432: `submit_anonymous_evidence` showing `AuthContext::anonymous_submission()` bypass.
- **case_hub/src/lib.rs** line 1430: `set_feature_flags` showing `require_controller!()` usage.
