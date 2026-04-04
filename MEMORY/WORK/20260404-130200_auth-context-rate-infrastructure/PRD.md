---
task: AuthContext and Statutory Rate Infrastructure build-out
slug: 20260404-130200_auth-context-rate-infrastructure
effort: medium
phase: ready
progress: 0/7
mode: dev-job
started: 2026-04-04T13:02:00Z
updated: 2026-04-04T13:02:00Z
ladder_refs: [RE-00010, RE-00011, AL-00010]
domain: dev
canisters: [evidence_vault, case_timeline, deadline_alerts, reference_shield, mcp_gateway, legal_analysis, procedural_intel, case_hub, settlement]
---

## Context

Two proven results need infrastructure build-out:

**AuthSource (RE-00010)**: Proved a 4-variant enum (user, admin, inter_canister, timer_context) that compiles clean and replaces the current raw Principal-based caller checks. The timer_context variant is critical -- it enables post-upgrade saga recovery where timer callbacks need to modify state but have no human caller. Without it, timer-triggered state mutations silently fail or require unsafe workarounds.

**is_stale() for statutory rates (RE-00011)**: Proved a staleness detection method with 8 passing unit tests. UK statutory rates change annually (April 6th each year). Currently, stale rates are a silent correctness bug -- calculations proceed with outdated caps. is_stale() makes this detectable and preventable.

Both are individually proven but need integration across the canister fleet.

## Scope

### AuthSource Integration (all 9 canisters)
- Replace raw `msg_caller() != Principal::anonymous()` checks with AuthSource-based guards
- Implement AuthSource::from_caller() factory that determines variant from call context
- Wire AuthSource::timer_context() into all timer/heartbeat callbacks
- Add audit logging that records AuthSource variant for every state mutation
- Implement AuthSource::inter_canister() detection for cross-canister call paths

### Statutory Rate Staleness (settlement, legal_analysis, deadline_alerts)
- Integrate is_stale() into the rate lookup path so stale rates trigger warnings
- Add canister log warnings when stale rates are detected at calculation time
- Integrate staleness check into CI via `mise run check-et-rules`
- Create operations documentation for the annual rate update process
- Add monitoring hook so dashboards can surface stale rate alerts

## Acceptance Criteria

- [ ] ISC-1: AuthSource used in all #[update] caller guard checks across 9 canisters
- [ ] ISC-2: AuthSource::timer_context() enables post-upgrade saga recovery
- [ ] ISC-3: Audit logging records AuthSource variant for each state mutation
- [ ] ISC-4: is_stale() integrated into CI via mise run check-et-rules
- [ ] ISC-5: Rate update documentation for operations team
- [ ] ISC-6: Stale rate detection fires warning in canister logs
- [ ] ISC-7: Tests cover all 4 AuthSource variants x all protected endpoints

## Dependencies

- No blocking dependencies from other PRDs
- State Machine Validation Completion (PRD 2) is complementary -- AuthSource guards and transition validation work together but can be developed independently
- Money Newtype Propagation (PRD 1) should ideally complete first for deadline_alerts and legal_analysis so rate calculations use Money type, but this is not strictly blocking

## Evidence

- **RE-00010**: AuthSource enum with 4 variants (user, admin, inter_canister, timer_context). Compiles clean. Design covers all caller contexts including the previously unhandled timer callback case.
- **RE-00011**: is_stale() method for statutory rates. 8 unit tests pass. Detects when rate data is older than its validity period. Designed around UK statutory rate update cycle (annual, April 6th).
- **AL-00010**: Algorithm that designed the AuthSource + rate infrastructure approach

## Out of Scope

- Role-based access control (RBAC) beyond the 4 AuthSource variants
- Rate auto-update from external sources (requires HTTPS outcalls, separate concern)
- Historical rate lookups (calculating with rates valid at a past date)
- Multi-jurisdiction rate support (UK only for now)
- Frontend audit log viewer
