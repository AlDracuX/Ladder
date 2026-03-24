---
id: ID-00022
title: "Timer-context AuthContext variant for post-upgrade saga recovery authentication"
status: active
updated: 2026-03-23
created: 2026-03-23
sources: [SR-00033]
phase: mate
domain: "canister-reliability"
tags: [authcontext, timer, post-upgrade, saga, recovery, security]
scores:
  feasibility: 7
  novelty: 6
  impact: 6
  elegance: 7
---

## Description

Extend `AuthContext` with a `timer_context()` constructor for code running inside `ic-cdk-timers` callbacks (e.g., post-upgrade saga recovery scans from SR-00033). Timer callbacks have no external caller — `msg_caller()` returns the canister's own principal. The current `require_auth!()` macro would reject this context or misidentify it. A dedicated `AuthContext::timer_context(canister_id, now)` variant makes timer-initiated operations explicit in the type system, allowing `_impl` functions to distinguish between user-initiated, controller-initiated, and timer-initiated actions for audit logging and authorization decisions.

## Provenance

Generated during MATE phase from AL-00003 (CallerGuard) × SR-00033 (post-upgrade timer scan). The gap emerges when combining these two patterns: CallerGuard assumes an external caller, but timer-based saga recovery has no external caller. Without a proper auth variant, recovery code must either bypass auth checks entirely (security gap) or fake a controller context (audit trail pollution).

## Connection

Affects `packages/awen_types/src/security.rs` (AuthContext definition), `case_hub` (saga recovery), and any canister using timer-based maintenance. Currently only case_hub has sagas, but if the post-upgrade scan pattern (SR-00033) is adopted across canisters, every canister with timers would need this.

## Next Steps

- Hypothesis: "Adding AuthContext::timer_context() enables type-safe post-upgrade saga recovery without bypassing CallerGuard"
- Verify: timer callbacks correctly identify as timer context, audit logs distinguish timer vs user vs controller actions
