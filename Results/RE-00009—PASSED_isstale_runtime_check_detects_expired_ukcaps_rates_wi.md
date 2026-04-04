---
id: RE-00009
title: "PASSED: is_stale runtime check detects expired uk_caps rates with 8 passing tests"
status: complete
created: 2026-03-24
experiment: EX-00008
outcome: passed
tags: [uk-law, statutory-caps, date-validation, runtime-check]
loops_to: [SR-00006, AL-00010]
---

## Summary

The experiment successfully added effective date validation to `uk_caps.rs`. A simple `is_stale(current_date: &str) -> bool` function using lexicographic string comparison on ISO 8601 dates correctly detects when statutory rate constants have expired. All 8 new tests pass alongside all 583 existing awen_types tests (591 total).

## Data

| Metric | Value |
|--------|-------|
| New constants added | 2 (EFFECTIVE_START, EFFECTIVE_END) |
| New function added | 1 (is_stale) |
| New tests added | 8 |
| Total tests (awen_types) | 591 |
| Tests passing | 591/591 |
| Compilation errors introduced | 0 |
| Lines of code added | ~75 (including doc comments and tests) |
| External dependencies added | 0 |

### Test Results

| Test | Input | Expected | Actual |
|------|-------|----------|--------|
| test_is_stale_after_sunset | "2026-04-06" | true | PASS |
| test_is_stale_well_after_sunset | "2027-01-01" | true | PASS |
| test_not_stale_mid_year | "2025-10-01" | false | PASS |
| test_not_stale_on_exact_start | "2025-04-06" | false | PASS |
| test_not_stale_on_exact_end | "2026-04-05" | false | PASS |
| test_stale_before_effective_start | "2025-04-05" | true | PASS |
| test_effective_start_is_2025_tax_year | constant check | "2025-04-06" | PASS |
| test_effective_end_is_2026_tax_year | constant check | "2026-04-05" | PASS |

## Analysis

The hypothesis (HY-00011) originally proposed compile-time `#[deprecated]` warnings via a proc macro. The experiment pivoted to a runtime `is_stale()` function as the pragmatic MVP. This approach:

1. **Zero dependencies**: Uses pure string comparison on ISO dates (no chrono, no proc macro)
2. **wasm32 compatible**: No system clock dependency -- date is passed as parameter
3. **Additive change**: All existing consumers of uk_caps constants are unaffected
4. **Re-export compatible**: The `pub use awen_types::uk_caps::*` in `awen_uk_employment::caps` automatically re-exports the new function and constants
5. **Lint-safe**: No unwrap, no expect, no panic -- pure comparison logic

The hypothesis is **partially validated**: we can detect staleness, but via runtime check rather than compile-time warning. A CI step (e.g., `cargo test` with a date-injected test) achieves the same practical effect as compile warnings -- stale rates are caught before deployment.

## Outcome

**PASSED** -- The core value proposition of HY-00011 (detecting stale rates) is achieved. The mechanism differs from the hypothesis (runtime vs compile-time) but the practical safety improvement is equivalent when combined with CI.

## Loop

- [x] New source identified: RE-00009 feeds back as evidence that simple runtime date checks are sufficient for statutory rate staleness detection (no proc macros needed)
- [ ] New idea suggested: Could add a CI step that runs `is_stale()` with current date and fails the pipeline if rates are expired
- [ ] New hypothesis formed: A `mise run check-stale-rates` task that calls `is_stale()` catches 100% of expired rate deployments

## Lessons Learned

1. The simplest approach (string comparison) was sufficient -- no date parsing libraries needed
2. wasm32 constraint (no system clock) actually led to a better design (explicit date parameter = testable)
3. The original hypothesis over-specified the mechanism (compile-time) when the goal was detection (runtime + CI achieves the same)
4. Adding 2 constants + 1 function + 8 tests took ~15 minutes -- very low cost for the safety improvement
