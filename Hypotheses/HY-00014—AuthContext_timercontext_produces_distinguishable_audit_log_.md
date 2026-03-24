---
id: HY-00014
title: "AuthContext timer_context produces distinguishable audit log entries from user and controller contexts"
status: complete
updated: 2026-03-24
created: 2026-03-24
idea: ID-00022
tags: [authcontext, timer, audit, security, post-upgrade]
prediction: "Unit tests can distinguish timer_context from for_test and controller_for_test via pattern matching"
metric: "count of AuthContext variants distinguishable in match expressions"
success_criteria: "3 distinct contexts (user, controller, timer) produce different auth.source values in unit tests"
---

## Hypothesis

If we add an `AuthContext::timer_context(canister_id, now)` constructor and a `source: AuthSource` enum field (User/Controller/Timer), then unit tests for _impl functions can pattern-match on auth.source to verify timer-initiated operations are logged distinctly from user and controller actions.

## Rationale

ID-00022 identified that timer callbacks (e.g., post-upgrade saga recovery from SR-00033) have no external caller. The current AuthContext has `from_ic()` (user), `for_test()` (test user), `controller_for_test()` (test controller), and `anonymous_submission()` (token-gated). None represent timer context. Adding a `source` field makes the distinction explicit and auditable.

## Testing Plan

1. Add `AuthSource` enum to `packages/awen_types/src/security.rs`: `enum AuthSource { User, Controller, Timer, Anonymous }`
2. Add `source: AuthSource` field to `AuthContext`
3. Add `timer_context(canister_id: Principal, now: u64) -> AuthContext` constructor
4. Update `from_ic()` to set source based on `is_controller`; update `anonymous_submission()` to set `Anonymous`
5. Write unit tests: `assert_eq!(AuthContext::timer_context(...).source, AuthSource::Timer)`
6. `cargo check --workspace` — verify no downstream breakage from new field

## Success Criteria

- Primary: `AuthContext::timer_context()` returns context with `source: AuthSource::Timer`
- Secondary: existing `from_ic()` and `for_test()` produce `AuthSource::User` or `AuthSource::Controller`
- Tertiary: `cargo check --workspace` passes (non-exhaustive enum or default handles new variant)

## Risks

- Adding a field to AuthContext is a breaking change if downstream code destructures it — but all access is via methods, not field access
- Timer callbacks may not have the canister's own principal easily available — need to store it at init time
