---
id: AL-00009
title: "AuthSource enum: context-aware authentication for user controller timer and anonymous flows"
status: complete
created: 2026-03-24
domain: canister-security
tags: [auth, security, timer, audit-logging, authcontext]
experiments: [EX-00007]
complexity: low
---

## Description

An `AuthSource` enum added to `AuthContext` (ADR-016) that distinguishes between four authentication origins: User, Controller, Timer, and Anonymous. Each `AuthContext` constructor sets the correct variant automatically. The `timer_context()` constructor creates a Timer-sourced context for canister self-calls during timer execution or post-upgrade recovery. This enables audit logs to record *how* an action was initiated, not just *who* initiated it.

Chain: EX-00007 -> HY-00014 -> ID-00022 -> SR-00033

## Method

1. **Define the AuthSource enum** in `packages/awen_types/src/security.rs`:

```rust
#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq, Default)]
pub enum AuthSource {
    #[default]
    User,
    Controller,
    Timer,
    Anonymous,
}
```

2. **Add `source` field to AuthContext**:

```rust
pub struct AuthContext {
    pub caller: Principal,
    pub is_controller: bool,
    pub is_authorized_canister: bool,
    pub now: u64,
    pub source: AuthSource,  // NEW
}
```

3. **Update all constructors** to set the correct variant:

```rust
// from_ic() — production, sets Controller or User based on is_controller
pub fn from_ic() -> Option<Self> {
    // ...
    source: if is_ctrl { AuthSource::Controller } else { AuthSource::User },
}

// anonymous_submission() — token-authenticated anonymous
pub fn anonymous_submission(now: u64) -> Self {
    // ...
    source: AuthSource::Anonymous,
}

// timer_context() — NEW constructor for timer callbacks
pub fn timer_context(canister_id: Principal, now: u64) -> Self {
    Self {
        caller: canister_id,
        is_controller: false,
        is_authorized_canister: true,
        now,
        source: AuthSource::Timer,
    }
}
```

4. **Test constructors** set `source: AuthSource::User` by default (via `#[default]`), so existing struct-literal test code continues to compile without changes.

5. **Use in audit logging**: Pattern match on `auth.source` to log context-appropriate messages.

## When to Use

- Any canister with timer callbacks (deadline_alerts, evidence_vault key rotation)
- Any canister needing audit trail differentiation between user-initiated and system-initiated actions
- Post-upgrade recovery flows where the canister calls its own methods
- Anonymous submission endpoints (whistleblower, evidence submission tokens)

## When NOT to Use

- Query methods that don't create AuthContext (read-only, no audit trail needed)
- Inter-canister calls between *different* canisters (use `is_authorized_canister` field instead)

## Inputs

- `Principal` — the caller identity (user, controller, or canister's own ID for timer)
- `u64` — current IC time in nanoseconds
- Constructor choice determines the `AuthSource` variant automatically

## Outputs

- `AuthContext` with `source: AuthSource` field set to the correct variant
- Pattern-matchable enum for downstream audit logging and authorization decisions

## Limitations

- Only 4 variants — if new auth flows emerge (e.g., delegated, multi-sig), the enum needs extending
- `Default` is `User` — code that constructs `AuthContext` via struct literal (bypassing constructors) will silently get `User` source, which may be incorrect
- Does not enforce that timer callbacks *must* use `timer_context()` — it's a convention, not a compiler guarantee
- The `is_authorized_canister` field overlaps semantically with `AuthSource::Timer` — both indicate "canister self-call" but via different mechanisms

## Evidence

- **EX-00007**: Added AuthSource enum with 4 variants, updated 5 constructors, 31 AuthContext sites compile clean.
- **RE-00010**: PASSED — all 4 auth sources distinguishable via pattern matching. Workspace compiles clean.
- Source file: `packages/awen_types/src/security.rs`
