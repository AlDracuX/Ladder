---
task: Money Newtype Propagation to deadline_alerts and legal_analysis
slug: 20260404-130000_money-newtype-propagation
effort: small
phase: ready
progress: 0/5
mode: dev-job
started: 2026-04-04T13:00:00Z
updated: 2026-04-04T13:00:00Z
ladder_refs: [RE-00007, AL-00008, ID-00001]
domain: dev
canisters: [deadline_alerts, legal_analysis]
---

## Context

RE-00007 proved that the Money newtype eliminates 54% of raw f64 casts in the settlement canister. The migration was clean: 25 casts eliminated, 552 tests pass, and the type system now prevents an entire class of floating-point arithmetic bugs on monetary values. This pattern is proven and battle-tested -- it needs propagation to the two remaining canisters that perform financial calculations.

deadline_alerts uses statutory caps (compensatory award limits, basic award calculations) that currently operate on raw f64. legal_analysis computes schedule of loss figures with the same raw arithmetic. Both are vulnerable to the same rounding and precision bugs that Money solved in settlement.

## Scope

- Replace all raw f64 monetary arithmetic in deadline_alerts with Money type from awen_types
- Replace all raw f64 monetary arithmetic in legal_analysis with Money type from awen_types
- Update all function signatures that accept or return monetary values to use Money
- Migrate existing tests to use Money constructors instead of raw f64 literals
- Add property tests for Money arithmetic edge cases specific to these canisters
- Verify that statutory cap calculations in deadline_alerts produce identical results post-migration

## Acceptance Criteria

- [ ] ISC-1: All financial calculations in deadline_alerts use Money type
- [ ] ISC-2: All financial calculations in legal_analysis use Money type
- [ ] ISC-3: Zero raw f64 arithmetic on monetary values in affected canisters
- [ ] ISC-4: Existing tests pass after migration
- [ ] ISC-5: New property tests for Money arithmetic edge cases (overflow, negative, rounding)

## Dependencies

- Money newtype must be available in awen_types (already is -- proven by RE-00007)
- No other PRD dependencies

## Evidence

- **RE-00007**: Money newtype migration in settlement canister. 25 raw f64 casts eliminated. 552 tests pass. 54% reduction in unsafe monetary arithmetic. Type system now catches precision bugs at compile time.
- **AL-00008**: Algorithm that designed the Money migration strategy
- **ID-00001**: Initial hypothesis that newtypes would reduce financial bugs

## Out of Scope

- Settlement canister (already migrated via RE-00007)
- Changes to the Money type itself in awen_types
- Currency conversion or multi-currency support
- UI/frontend display formatting of monetary values
- case_hub, case_timeline, or other canisters without financial calculations
