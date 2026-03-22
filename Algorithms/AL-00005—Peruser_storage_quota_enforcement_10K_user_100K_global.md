---
id: AL-00005
title: "Per-user storage quota enforcement 10K user 100K global"
status: complete
created: 2026-03-22
domain: "icp-canister-development"
tags: [rust, icp, canister, security, rate-limiting, storage-quota, dos-prevention]
experiments: []
complexity: medium
---

## Description

Storage quota enforcement pattern that prevents any single user from monopolizing canister stable memory. Every canister defines `const MAX_RECORDS_PER_USER: usize = 10_000` and checks user record counts before inserts. The mcp_gateway additionally enforces a global log limit of 100,000 entries and per-principal rate limiting (100 requests/minute, 1000 global/minute).

## Method

### Pattern 1: Inline Quota Check (original pattern)

Used in `evidence_vault` and `deadline_alerts` where the owner field name varies:

```rust
const MAX_RECORDS_PER_USER: usize = 10_000;

async fn store_evidence_impl(request: StoreEvidenceRequest, auth: &AuthContext) -> Result<Evidence, EvidenceError> {
    let caller = auth.caller;

    // Count records owned by this caller
    let user_count = EVIDENCE_STORE.with(|store| {
        store.borrow().iter()
            .filter(|entry| entry.value().owner == caller)
            .count()
    });

    if user_count >= MAX_RECORDS_PER_USER {
        return Err(EvidenceError::InvalidInput {
            message: format!(
                "Storage quota exceeded: user already has {} records (max {})",
                user_count, MAX_RECORDS_PER_USER
            ),
        });
    }

    // ... proceed with storage ...
}
```

### Pattern 2: `check_quota!` Macro (standardized pattern)

Used in `case_timeline`, `case_hub`, `settlement` where the owner field is `created_by`:

```rust
// Macro definition in packages/awen_types/src/lib.rs:
macro_rules! check_quota {
    ($store:ident, $caller:expr, $max:expr, $err:expr) => {{
        let __caller = $caller;
        let __max = $max;
        let __count = $store.with(|s| {
            s.borrow().iter()
                .filter(|entry| entry.value().created_by == __caller)
                .count()
        });
        if __count >= __max {
            return Err($err(format!(
                "Storage quota exceeded: {} records (max {})",
                __count, __max
            )));
        }
    }};
}

// Usage:
awen_types::check_quota!(EVENTS, caller, MAX_RECORDS_PER_USER, |msg| {
    TimelineError::InvalidInput { message: msg }
});
```

### Pattern 3: Global Quota (mcp_gateway)

The MCP gateway enforces both per-user and global limits:

```rust
const MAX_LOG_ENTRIES: usize = 100_000;      // Global request log cap
const RATE_LIMIT_MAX_REQUESTS: u64 = 100;    // Per-principal per minute
const GLOBAL_RATE_LIMIT_MAX_REQUESTS: u64 = 1000;  // All principals per minute (Sybil mitigation)
```

### Quota Limits Across Canisters

| Canister | Per-User Limit | Global Limit | Notes |
|----------|---------------|-------------|-------|
| evidence_vault | 10,000 | -- | Checks `owner` field |
| case_timeline | 10,000 | -- | Uses `check_quota!` macro on EVENTS, PARSED_THREADS, CAUSATION_LINKS, AGREED_FACTS, BUNDLE_AUDITS |
| case_hub | 10,000 | 10,000 sagas | Uses `check_quota!` on CASE_LINKS, CASE_GROUPS |
| deadline_alerts | 10,000 | -- | Checks `owner` field |
| settlement | 10,000 | -- | Uses `check_quota!` on COST_SCHEDULES, WASTED_COSTS |
| procedural_intel | 10,000 | -- | Checks both per-user and total |
| mcp_gateway | 100/min | 100,000 log + 1,000/min global | Rate + storage limits |

## When to Use

- Every `#[update]` method that inserts records into stable storage. This is mandatory for all 9 canisters.
- Use the `check_quota!` macro when the owner field is named `created_by` (most canisters).
- Use inline checks when the owner field has a different name (e.g., `owner` in evidence_vault).
- The mcp_gateway combines quota with rate limiting for API gateway defense.

## Inputs

- **caller**: `Principal` from `AuthContext` -- the user whose records are counted.
- **store**: `thread_local!` `StableBTreeMap` containing the records.
- **MAX_RECORDS_PER_USER**: `usize` constant, always `10_000` across standard canisters.

## Outputs

- **Pass**: No output -- execution continues to the insert operation.
- **Fail**: Early return with error containing the current count and the limit. Error type varies by canister (`EvidenceError::InvalidInput`, `TimelineError::InvalidInput`, etc.).

## Limitations

- **O(n) counting**: The quota check iterates all records in the store, filtering by owner. This is O(n) where n is the total number of records across all users. At 10K records per user across many users, this scan can consume significant cycles.
- **No per-user index**: There is no secondary index mapping `Principal -> record_count`. Every check re-scans. A counter cache could reduce this to O(1) but adds consistency complexity.
- **Race condition window**: Between the count check and the insert, another concurrent request could also pass the check. ICP's single-threaded execution model prevents true races within a canister, but async `#[update]` methods with `await` points could interleave.
- **`check_quota!` assumes `created_by`**: The macro hardcodes `.created_by` as the owner field name. Canisters using `owner` (evidence_vault) cannot use the macro.
- **No quota recovery**: Deleting records frees quota immediately. There is no cooldown or hysteresis.

## Evidence

- **evidence_vault/src/lib.rs** lines 1490, 1565-1580: `MAX_RECORDS_PER_USER = 10_000` and inline quota check in `store_evidence_impl`.
- **packages/awen_types/src/lib.rs** lines 205-226: `check_quota!` macro definition.
- **case_timeline/src/lib.rs** line 1021: `check_quota!(EVENTS, caller, MAX_RECORDS_PER_USER, ...)`.
- **case_hub/src/lib.rs** lines 480, 957, 1056: `MAX_RECORDS_PER_USER` and `check_quota!` usage on CASE_LINKS and CASE_GROUPS.
- **settlement/src/lib.rs** lines 919, 2954, 3047: `MAX_RECORDS_PER_USER` and `check_quota!` on COST_SCHEDULES and WASTED_COSTS.
- **mcp_gateway/src/lib.rs** lines 38, 54, 58: `MAX_LOG_ENTRIES = 100_000`, `RATE_LIMIT_MAX_REQUESTS = 100`, `GLOBAL_RATE_LIMIT_MAX_REQUESTS = 1000`.
- **evidence_vault/src/lib.rs** lines 12716-12745: Boundary test `test_iss34_quota_boundary_at_max_records` -- fills to exactly 10,000, confirms 10,001st is rejected.
