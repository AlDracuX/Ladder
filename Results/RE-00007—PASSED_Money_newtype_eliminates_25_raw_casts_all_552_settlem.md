---
id: RE-00007
title: "PASSED: Money newtype eliminates 25 raw casts, all 552 settlement tests pass"
status: complete
created: 2026-03-24
experiment: EX-00004
outcome: success
tags: [money, newtype, settlement, type-safety, precision]
loops_to: [AL-00008]
---

## Summary

Created `Money(u64)` newtype in `packages/awen_types/src/money.rs` (260 lines) with safe arithmetic methods. Refactored settlement calculation functions to use Money instead of raw `as f64` casts. All 552 tests pass with zero regressions.

## Data

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| `as f64` casts in settlement | 46 | 21 | -25 (54% reduction) |
| Settlement tests passing | 552/552 | 552/552 | No regression |
| Money module lines | 0 | 260 | New module |
| Money unit tests | 0 | 20 | All pass |
| Remaining casts (non-money) | — | 21 | Rates, percentages, format strings, test code |

## Analysis

HY-00008 is **partially validated**. The hypothesis predicted "zero raw u64-to-f64 casts remaining" but 21 remain. These are intentionally excluded: non-money values (rates, years, percentages), display formatting, and test assertions. The 25 eliminated casts are all in production money calculation paths — the highest-risk code for precision errors. The Money type enforces the "store as pence, compute as f64, round back" pattern at the type level.

## Outcome

**PASSED** with qualification. The refactor achieves the spirit of HY-00008 (type-safe money arithmetic) even though the letter (zero casts) isn't fully met. The remaining casts are correctly non-money values.

## Loop

- [ ] New source identified (→ Sources)
- [ ] New idea suggested (→ Ideas)
- [ ] New hypothesis formed (→ Hypotheses)
- [x] Algorithm validated (→ Algorithms) — AL-00008
- [ ] Problem redefined (→ Sources)

## Lessons Learned

- Newtype refactors in a well-tested codebase are low-risk — 552 tests caught any mistakes immediately
- The `as f64` count is a crude metric — should distinguish money vs non-money casts in the hypothesis
- Money module is reusable across settlement, deadline_alerts (statutory caps), and BDD tests
