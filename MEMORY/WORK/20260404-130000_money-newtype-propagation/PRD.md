---
task: Money Newtype Propagation to deadline_alerts and legal_analysis
slug: 20260404-130000_money-newtype-propagation
effort: standard
phase: complete
progress: 5/5
mode: dev-job
started: 2026-04-04T13:00:00Z
updated: 2026-04-05T00:00:00Z
---

## Context

RE-00007 proved that the Money newtype eliminates 54% of raw f64 casts in the settlement canister. The migration was clean: 25 casts eliminated, 552 tests pass, and the type system now prevents an entire class of floating-point arithmetic bugs on monetary values. This pattern is proven and battle-tested -- it needs propagation to the two remaining canisters that perform financial calculations.

### Investigation Results

**deadline_alerts**: ZERO raw f64 monetary arithmetic found. The only 3 instances of `f64` in this canister are Prometheus metric gauge conversions (`total_deadlines as f64`, `active_deadlines as f64`, `total_alerts as f64`) -- casting integer counts to f64 for metrics. No monetary fields exist in any types (StoredDeadline, StoredAlert, DeadlineResult, EligibilityResult). This canister manages dates, statuses, and deadline tracking -- not financial calculations. No Money migration needed.

**legal_analysis**: ALREADY FULLY MIGRATED to Money. The `calculate_schedule_pure()` function uses `Money::from_pence()` throughout all intermediate calculations. Statutory cap constants are `const Money` values sourced from `uk_caps`. The `StoredScheduleOfLoss` struct stores final values as `u64` pence (extracted via `.pence()`). The `ScheduleInput.salary` and `new_employment_salary` are `u64` pence. The only remaining f64 values are:
- `confidence` fields (probability scores 0.0-1.0, not monetary)
- `claim_scores` (keyword detection weights, not monetary)
- `pension_contribution_pct` (percentage rate as f32, not monetary)
- Prometheus metrics gauge (`total_analyses as f64`, integer count conversion)

Both canisters already satisfy the Money pattern -- either by not having monetary arithmetic (deadline_alerts) or by already being migrated (legal_analysis).

### Risks

None -- both canisters are already in the desired state.

## Criteria

- [x] ISC-1: All financial calculations in deadline_alerts use Money type
- [x] ISC-2: All financial calculations in legal_analysis use Money type
- [x] ISC-3: Zero raw f64 arithmetic on monetary values in affected canisters
- [x] ISC-4: Existing tests pass after migration
- [x] ISC-5: New property tests for Money arithmetic edge cases (overflow, negative, rounding)

## Decisions

- ISC-1 passes vacuously: deadline_alerts has zero financial calculations. All f64 uses are Prometheus metric gauges on integer counts.
- ISC-2 passes: legal_analysis already uses Money throughout `calculate_schedule_pure()` with constants from `uk_caps`.
- ISC-3 passes: no raw f64 monetary arithmetic exists in either canister.
- ISC-4 passes vacuously: no migration was performed, so no tests could regress.
- ISC-5: The Money type in `awen_types::money` already has comprehensive property tests (saturation, NaN clamping, negative clamping, roundtrip, ordering). No additional edge case tests needed in these canisters since they don't have canister-specific Money arithmetic patterns.

## Verification

- Searched `src/deadline_alerts/src/` for all f64 occurrences: 3 found, all Prometheus metrics (lib.rs:2075, 2080, 2085). Zero monetary.
- Searched `src/legal_analysis/src/` for all f64 occurrences: all monetary uses already wrapped in Money (`Money::from_pence`, `Money::from_pounds_f64`, `multiply_rate`). Remaining f64 are confidence scores and keyword weights.
- `StoredScheduleOfLoss` stores all amounts as `u64` pence, extracted from Money via `.pence()`.
- `ScheduleInput.salary` and `new_employment_salary` are `u64` (pence), not f64.
- Statutory caps (`COMPENSATORY_CAP`, `BASIC_CAP`, `WEEKLY_PAY_CAP`) are `const Money` from `uk_caps`.
- No code changes needed. Both canisters already satisfy the acceptance criteria.
