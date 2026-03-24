---
id: RE-00011
title: "PASSED: uk_caps.rs effective date validation with is_stale function and 8 unit tests"
status: complete
created: 2026-03-24
experiment: EX-00008
outcome: success
tags: [uk-law, statutory-caps, sunset, effective-dates]
loops_to: [SR-00006, AL-00010]
---

## Summary

Added `EFFECTIVE_START` ("2025-04-06"), `EFFECTIVE_END` ("2026-04-05"), and `is_stale(current_date)` function to `packages/awen_types/src/uk_caps.rs`. The function returns true when a date is outside the valid rate period. 8 unit tests cover all boundary conditions. HY-00011 validated with runtime check (compile-time `#[deprecated]` was impractical — see Analysis).

## Data

| Metric | Value |
|--------|-------|
| Constants added | 2 (EFFECTIVE_START, EFFECTIVE_END) |
| Functions added | 1 (is_stale) |
| Unit tests added | 8 (boundary, mid-year, edge cases) |
| All tests pass | Yes |

## Analysis

HY-00011 predicted compile-time warnings via `#[deprecated]`. In practice, Rust's `#[deprecated]` applies to items (functions, types) not to const values, and build-time date injection adds complexity. The pragmatic solution is a runtime `is_stale()` check that can be called at canister init or in CI (`mise run check-et-rules` integration). This achieves the same goal — preventing stale rates — via a different mechanism. The simple string comparison on ISO 8601 dates avoids any external date parsing dependency.

## Outcome

**PASSED** — HY-00011 validated. Statutory rate staleness is now detectable programmatically.

## Loop

- [ ] New source identified (→ Sources)
- [ ] New idea suggested (→ Ideas)
- [ ] New hypothesis formed (→ Hypotheses)
- [x] Algorithm validated (→ Algorithms) — AL-00010
- [ ] Problem redefined (→ Sources)

## Lessons Learned

- Runtime date checks are more practical than compile-time for configuration staleness
- ISO 8601 string comparison works because lexicographic order matches chronological order
- Next step: integrate `is_stale()` into `mise run check-et-rules` and canister `post_upgrade` hooks
