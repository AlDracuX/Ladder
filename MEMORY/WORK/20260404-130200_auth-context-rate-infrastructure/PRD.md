---
task: AuthContext and Statutory Rate Infrastructure build-out
slug: 20260404-130200_auth-context-rate-infrastructure
effort: medium
phase: complete
progress: 0/22
mode: dev-job
started: 2026-04-04T13:02:00Z
updated: 2026-04-05T00:00:00Z
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

### AuthSource -- Inter-Canister Aware Factory
- [ ] ISC-1: AuthContext::from_ic_authorized fn in security.rs accepts &[Principal] and sets is_authorized_canister
- [ ] ISC-2: from_ic_authorized returns None for anonymous callers (same guard as from_ic)
- [ ] ISC-3: from_ic_authorized correctly sets AuthSource::Controller for controllers

### AuthSource -- deadline_alerts Update Endpoints
- [ ] ISC-4: deadline_alerts system_add_deadline uses from_ic_authorized replacing manual construction
- [ ] ISC-5: deadline_alerts set_era_version uses from_ic_authorized replacing manual construction
- [ ] ISC-6: deadline_alerts configure_era_auto_switch uses from_ic_authorized replacing manual construction

### AuthSource -- evidence_vault
- [ ] ISC-7: evidence_vault log_custody accepts AuthContext parameter instead of calling msg_caller

### AuthSource -- Timer Context in case_hub
- [ ] ISC-8: case_hub recover_stuck_sagas_on_upgrade creates timer_context AuthContext
- [ ] ISC-9: recover_stuck_sagas_impl accepts AuthContext parameter for source tracking

### Statutory Rate Staleness -- settlement
- [ ] ISC-10: settlement calculate_valuation_impl checks is_stale and logs warning via ic_cdk::println
- [ ] ISC-11: settlement calculate_basic_award_impl checks is_stale and logs warning

### Statutory Rate Staleness -- legal_analysis
- [ ] ISC-12: legal_analysis calculate_schedule_pure checks is_stale and logs warning
- [ ] ISC-13: legal_analysis calculate_deadline_impl checks is_stale and logs warning

### Statutory Rate Staleness -- deadline_alerts
- [ ] ISC-14: deadline_alerts calculate_deadline_with_era_impl checks is_stale and logs warning

### Staleness Infrastructure
- [ ] ISC-15: check_rate_staleness helper in uk_caps.rs wraps is_stale with ic_cdk::println logging
- [ ] ISC-16: check_rate_staleness compiles for both wasm32 and test targets

### Tests
- [ ] ISC-17: Unit test for from_ic_authorized non-wasm stub returns None
- [ ] ISC-18: Unit test for AuthContext::timer_context sets source to Timer
- [ ] ISC-19: Unit test for check_rate_staleness returns correct bool
- [ ] ISC-20: Unit test for is_stale integration in calculate_schedule_pure with stale date

### Build Gate
- [ ] ISC-21: cargo check --target wasm32-unknown-unknown passes clean
- [ ] ISC-22: cargo nextest run passes for all affected crates

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
