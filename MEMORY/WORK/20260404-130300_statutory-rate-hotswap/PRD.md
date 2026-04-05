---
task: Statutory Rate Hot-Swap via Runtime Environment Variables
slug: 20260404-130300_statutory-rate-hotswap
effort: small
phase: complete
progress: 0/5
mode: dev-job
started: 2026-04-04T13:00:00Z
updated: 2026-04-04T13:00:00Z
ladder_refs: [ID-00033, AL-00010, SR-00044]
domain: legal-procedural
canisters: [settlement, legal_analysis, deadline_alerts]
---

## Context

UK employment statutory rates change every April (weekly pay cap, basic award cap, compensatory award cap, minimum wage bands, etc.). Currently, these values are compiled into `packages/awen_types/src/uk_caps.rs` as constants. Every annual update requires a code change, a cargo build producing new WASMs, and a canister upgrade cycle across all affected canisters.

This is operationally fragile. A missed update means the platform silently calculates incorrect awards. A premature update before the effective date produces wrong results for in-flight cases.

ic-cdk 0.19+ exposes canister environment variables that can be set at deploy or runtime without recompiling. This PRD uses that mechanism to allow rate hot-swapping: set new rates via environment variables, and the existing `uk_caps.rs` functions pick them up at runtime with compiled defaults as fallback.

ID-00033 identified this as a reliability gap. AL-00010 flagged the operational burden. SR-00044 confirmed the ic-cdk 0.19 env var mechanism as viable.

## Scope

1. Define canonical environment variable names for all statutory rates in `uk_caps.rs`
2. Modify rate-lookup functions to check environment variables first, fall back to compiled defaults
3. Add `is_stale()` validation that checks effective dates against current time
4. Document the annual rate update workflow for operations

This does NOT change any calculation logic. It only changes WHERE the rate values come from.

## Acceptance Criteria

- [ ] ISC-1: uk_caps.rs rate-lookup functions check environment variables first, parsing them as the correct numeric type, before falling back to compiled constant defaults
- [ ] ISC-2: Canonical environment variable names defined and documented (AWEN_UK_WEEKLY_PAY_CAP, AWEN_UK_BASIC_AWARD_CAP, AWEN_UK_COMPENSATORY_AWARD_CAP, AWEN_UK_EFFECTIVE_DATE, etc.)
- [ ] ISC-3: Fallback to compiled defaults when environment variables are unset, with no behavioral change from current system
- [ ] ISC-4: is_stale() validation function prevents premature effective date application -- returns error if AWEN_UK_EFFECTIVE_DATE is in the future or if compiled defaults are past their expected validity window
- [ ] ISC-5: Operations runbook for annual rate update workflow: when to set vars, how to validate, how to roll back, and how to verify across all 3 canisters

## Dependencies

- RE-00011: is_stale validation pattern (provides the date-comparison infrastructure that ISC-4 builds on)

## Evidence

- **ID-00033**: Identified the annual rate update as a reliability risk -- manual code changes for statutory values that change on a fixed schedule
- **AL-00010**: Operational burden analysis -- each rate update currently requires full WASM rebuild and canister upgrade cycle
- **SR-00044**: Technical feasibility confirmation -- ic-cdk 0.19 environment variables are readable at runtime and can be set without canister upgrade

## Out of Scope

- Historical rate lookups (cases filed under previous year's rates) -- separate PRD
- Automatic rate fetching from GOV.UK -- manual update is acceptable for annual changes
- Rate change notification system -- covered by deadline_alerts canister separately
- Changes to any calculation logic -- this PRD only changes the source of rate values
