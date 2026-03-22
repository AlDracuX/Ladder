---
id: AL-00002
title: "Saga pattern with idempotency keys for cross-canister calls"
status: complete
created: 2026-03-22
domain: "icp-canister-development"
tags: [rust, icp, canister, distributed-systems, saga, idempotency, cross-canister]
experiments: []
complexity: high
---

## Description

Combines the saga compensation pattern with idempotency keys to make cross-canister state modifications reliable on ICP. The saga tracks multi-step distributed operations with rollback capability, while idempotency keys deduplicate retried requests using SHA-256 response hashing with TTL-based expiry.

## Method

### Idempotency Layer (per-canister request deduplication)

1. **Generate an idempotency key** from `(caller_bytes, method_name, args_hash)` using `generate_idempotency_key()` which produces a SHA-256 hex string (64 chars).

2. **Check before processing**: Call `check_idempotency(store, key, current_time)`. If it returns `Some(response_hash)`, the request was already processed and is still within TTL -- return a `DuplicateRequest` error.

3. **Process the request** normally.

4. **Record after success**: Hash the response with SHA-256, then call `record_processed(store, key, response_hash, current_time, DEFAULT_TTL_NANOS)`. The entry expires after 24 hours (configurable).

5. **Periodic cleanup**: Call `cleanup_expired(store, current_time, batch_size)` via timer to free memory. Processes entries in batches to stay within instruction limits.

```rust
// In case_timeline add_event_impl:
if let Some(ref idempotency_key) = request.idempotency_key {
    let cached = PROCESSED_REQUESTS
        .with(|pr| check_idempotency(&pr.borrow(), idempotency_key, current_time));
    if let Some(_response_hash) = cached {
        return Err(TimelineError::DuplicateRequest { message: ... });
    }
}
// ... process request ...
if let Some(key) = idempotency_key {
    let response_hash: [u8; 32] = Sha256::digest(&candid::encode_one(&event)?).into();
    PROCESSED_REQUESTS.with(|pr| {
        record_processed(&mut pr.borrow_mut(), key, response_hash, current_time, DEFAULT_TTL_NANOS);
    });
}
```

### Saga Layer (multi-canister coordination)

1. **Begin saga**: `begin_saga_impl(auth, saga_id)` creates a `SagaState` with status `Pending`. The `saga_id` is a unique string (e.g., `"delete-case-{case_id}-{timestamp}"`).

2. **Execute steps**: Each cross-canister operation is tracked via `complete_saga_step_impl(auth, saga_id, step_name)`. Steps are recorded in `steps_completed: Vec<String>` and status advances to `StepCompleted { step }`.

3. **On failure**: Status transitions to `Compensating`, then compensation actions run the reverse of completed steps. If compensation succeeds: `RolledBack`. If it fails: `Failed { reason }`.

4. **Status lifecycle**: `Pending -> StepCompleted -> ... -> Completed` (happy path) or `Pending -> StepCompleted -> Compensating -> RolledBack|Failed` (failure path).

```rust
// In case_hub delete_case_impl (hard delete):
let saga_id = format!("delete-case-{}-{}", case_id, now);
let _saga = begin_saga_impl(saga_auth.clone(), saga_id.clone())?;
for target in ["rollback_case_events", "rollback_case_deadlines", ...] {
    let _ = complete_saga_step_impl(saga_auth.clone(), saga_id.clone(), format!("intent:{}", target));
}
```

### Inter-Canister Calls (the transport)

Cross-canister calls use the modern `Call::bounded_wait` API (ic-cdk 0.19+):

```rust
use ic_cdk::call::{Call, CallFailed};
let response = Call::bounded_wait(evidence_vault_id, "evidence_exists")
    .with_args(&(evidence_id,))
    .await;
```

## When to Use

- **Idempotency**: Any endpoint that can be called from another canister or retried by clients. All `AddEventRequest`-style types include `idempotency_key: Option<String>`.
- **Saga**: Multi-canister operations that modify state in more than one canister (e.g., hard-deleting a case requires cleanup in case_timeline, deadline_alerts, settlement, legal_analysis, and evidence_vault).
- **Both together**: The idempotency key prevents the saga steps from executing twice if a cross-canister call is retried after timeout.

## Inputs

- **Idempotency**: `caller: &[u8]`, `method: &str`, `args_hash: &[u8; 32]` for key generation. `StableBTreeMap<String, ProcessedRequest, Memory>` for storage.
- **Saga**: `AuthContext` (caller must match saga initiator), `saga_id: String`, `step: String`. `SAGA_STORE: StableBTreeMap<String, SagaState, Memory>` for persistence.

## Outputs

- **Idempotency**: `check_idempotency` returns `Option<[u8; 32]>` (the cached response hash, or None). `cleanup_expired` returns `usize` (entries removed).
- **Saga**: `begin_saga_impl` and `complete_saga_step_impl` return `Result<SagaState, CaseHubError>`.

## Limitations

- **No automatic compensation**: The saga records intent steps but does not yet execute async cross-canister rollback calls. The TODO in `delete_case_impl` documents this -- compensation is intent-recorded, not auto-executed.
- **TTL-based expiry**: Idempotency entries expire after 24 hours by default. Retries after TTL will be processed as new requests.
- **Memory cost**: Each `ProcessedRequest` includes a 32-byte hash, key string, and two u64 timestamps. Cleanup must run periodically to avoid unbounded growth.
- **Single-canister saga store**: `SAGA_STORE` lives in case_hub only. Other canisters do not independently track saga state -- they rely on case_hub as coordinator.
- **Batch size constraint**: `cleanup_expired` uses `take(batch_size)` to stay within IC instruction limits. Large backlogs may need multiple cleanup cycles.

## Evidence

- **packages/awen_types/src/idempotency.rs**: Full implementation of `check_idempotency`, `record_processed`, `cleanup_expired`, `generate_idempotency_key`, and `ProcessedRequest` struct with Storable impl.
- **case_timeline/src/lib.rs** lines 1025-1141: Complete idempotency flow in `add_event_impl` -- check, process, record.
- **case_hub/src/lib.rs** lines 1408-1499: `begin_saga_impl` and `complete_saga_step_impl` implementations.
- **case_hub/src/lib.rs** lines 2104-2172: `delete_case_impl` showing saga + step recording for hard delete.
- **packages/awen_types/src/lib.rs** lines 1197-1228: `SagaStatus` enum (Pending, StepCompleted, Compensating, Completed, RolledBack, Failed) and `SagaState` struct.
- **case_timeline/src/lib.rs** lines 638-676: `verify_evidence_exists` showing `Call::bounded_wait` inter-canister call pattern.
- **deadline_alerts/src/lib.rs** lines 1226-1242: Idempotency key generation in `add_event` requests sent to case_timeline.
