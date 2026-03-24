---
id: RE-00010
title: "PASSED: AuthSource enum with 4 variants and timer_context constructor compiles across all 9 canisters"
status: complete
created: 2026-03-24
experiment: EX-00007
outcome: success
tags: [authcontext, timer, auth-source, security]
loops_to: []
---

## Summary

Added `AuthSource` enum (User, Controller, Timer, Anonymous) and `source` field to `AuthContext`. All 4 constructors set the correct variant. `timer_context(canister_id, now)` creates a Timer-sourced context for post-upgrade recovery. `cargo check --workspace` compiles clean (1 unused import warning in deadline_alerts). HY-00014 validated.

## Data

| Metric | Value |
|--------|-------|
| AuthSource variants | 4 (User, Controller, Timer, Anonymous) |
| Constructors updated | 4 (from_ic, for_test, controller_for_test, anonymous_submission) + 1 new (timer_context) |
| AuthContext sites updated | 31 (3 production + 28 test) |
| Compilation | clean (1 unused import warning) |

## Analysis

The `source` field with `Default` trait (defaults to `User`) means all existing test code that constructs `AuthContext` manually via struct literal now gets `source: AuthSource::default()` which is `User` — semantically correct for test contexts. The 3 production constructors (`from_ic`, `anonymous_submission`, `timer_context`) set explicit values. This is a zero-risk addition because the new field has a sensible default.

## Outcome

**PASSED** — HY-00014 validated. All 4 auth sources are distinguishable via pattern matching.

## Lessons Learned

- Adding a field with `Default` to a widely-used struct is safe when all construction goes through named constructors
- The `source` field enables future audit logging without any further changes to _impl functions
