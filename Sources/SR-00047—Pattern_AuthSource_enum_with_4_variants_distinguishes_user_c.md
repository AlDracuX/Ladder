---
id: SR-00047
title: "Pattern: AuthSource enum with 4 variants distinguishes user controller timer anonymous contexts"
type: pattern
url: ""
status: active
created: 2026-03-24
tags: [authcontext, auth-source, timer, security, audit-trail]
domain: "canister-security"
relevance: "high"
---

## Summary

Added `AuthSource` enum with 4 variants (`User`, `Controller`, `Timer`, `Anonymous`) and a new `source` field to `AuthContext` in `security.rs`. This enables timer-context authentication for post-upgrade saga recovery, where canister timers need to perform privileged operations without a real caller. Five constructors provided: `from_ic`, `for_test`, `controller_for_test`, `anonymous_submission`, `timer_context`. All 9 canisters compile cleanly with the new field, with 31 call sites updated to populate the source.

## Key Points

- 4 variants: `User`, `Controller`, `Timer`, `Anonymous` — covering all IC execution contexts
- 5 constructors: `from_ic`, `for_test`, `controller_for_test`, `anonymous_submission`, `timer_context`
- 31 call sites updated across all 9 canisters to populate the `source` field
- `Default` trait implemented on the enum (defaults to `User` for backward compatibility)
- Enables timer-context auth for case_hub post-upgrade saga recovery without faking a caller Principal
- Distinguishes admin/controller actions from user-initiated ones in audit trails

## Connection to Problems

Solves the problem of canister timers needing to perform privileged state modifications (e.g., saga recovery after upgrades) without a real `msg_caller()`. Previously, timer-initiated operations had no way to distinguish themselves from anonymous calls, making it impossible to apply appropriate authorization rules. Also connects to the query endpoint security audit (SR-00037) by providing richer context for access control decisions.

## Potential Ideas

- Use `AuthSource` in structured audit logging to differentiate user vs timer vs controller actions
- Filter admin dashboards by `AuthSource::Controller` to show only admin-initiated state changes
- Add `AuthSource::InterCanister` variant for cross-canister call contexts
- Enforce that `AuthSource::Timer` can only be set from actual timer callbacks, not user-facing endpoints
