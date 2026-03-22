---
id: HY-00002
title: "Replacing f32 with f64 in settlement eliminates all precision loss test failures"
status: draft
created: 2026-03-22
idea: ID-00001
tags: []
prediction: "If f32 is replaced with f64 in settlement calculations, then all 6 precision loss sites will produce results matching f64::EPSILON tolerance"
metric: "Number of precision-loss-related test assertions using f32::EPSILON"
success_criteria: "All settlement tests pass with f64::EPSILON (tighter bounds), zero f32::EPSILON assertions remain"
---

## Hypothesis

If we replace all f32 types with f64 in the settlement canister's calculation functions (calculate_valuation_impl, breakeven win probability, offer comparison), then all existing precision-loss tests will pass with tighter f64::EPSILON bounds and the golden dataset will match to 6 decimal places instead of 3.

## Rationale

The settlement canister uses f32 for win_probability and financial calculations. Audit found 6 explicit f32 precision loss sites documented in test comments. f64 provides ~15 digits of precision vs f32's ~7, eliminating rounding errors in statutory calculations where pennies matter.

## Testing Plan

1. Create branch, change f32 → f64 in settlement/src/lib.rs
2. Update Candid interface if needed (f32 → f64 in .did)
3. Tighten all f32::EPSILON assertions to f64::EPSILON
4. Run nextest on settlement package
5. Verify golden dataset tests still pass

## Success Criteria

- All 6 precision loss sites converted
- All settlement tests pass with f64::EPSILON
- No Candid backward-compatibility breaks (or documented migration)
- WASM size delta < 5KB

## Risks

- Candid f64 encoding may differ from f32 (breaking existing callers)
- Other canisters may pass f32 values to settlement (type mismatch)
- f64 uses more stable storage space per entry
