---
id: HY-00013
title: "Replacing requires with ensures on _impl functions eliminates all debug_assert panics in contract tests"
status: complete
created: 2026-03-24
idea: ID-00016
tags: [contracts, design-by-contract, postcondition, testing, _impl]
prediction: "Zero debug_assert panics in test suite after converting all #[requires] to #[ensures]"
metric: "count of test panics caused by contracts debug_assert macros"
success_criteria: "cargo nextest run passes with zero panics from contracts crate assertions"
---

## Hypothesis

If we replace all `#[requires]` precondition annotations with `#[ensures]` postcondition annotations on `_impl` functions that perform their own input validation, then all debug_assert panics from the contracts crate are eliminated AND new postcondition violations are caught.

## Rationale

SR-00032 discovered that `#[requires(!request.title.is_empty())]` expands to `debug_assert!` which panics before the function body can return `Err(InvalidInput)`. The `_impl` pattern (AL-00001) already validates inputs and returns typed errors — `#[requires]` duplicates this and conflicts. However, `#[ensures]` (postconditions) add value: they verify the output is consistent (e.g., returned ID > 0, returned list length matches count). ID-00016 proposes this postcondition-only approach.

## Testing Plan

1. Baseline: `cargo nextest run 2>&1 | grep 'panicked.*debug_assert'` — count panics from contracts
2. `rg '#\[requires' src/` — list all #[requires] annotations
3. For each: convert to `#[ensures]` with an appropriate postcondition, or remove if no meaningful postcondition exists
4. `cargo nextest run` — verify zero panics
5. Add 2-3 intentionally-wrong postconditions (e.g., `#[ensures(ret.is_err())]` on a success path) to verify postconditions actually fire

## Success Criteria

- Primary: zero panics from contracts debug_assert in full test suite
- Secondary: at least 5 meaningful postconditions added (not just removal of requires)
- Tertiary: intentionally-wrong postcondition test confirms postconditions are evaluated

## Risks

- Some #[requires] may protect against genuinely unchecked preconditions (not all _impl functions validate everything) — need to verify each before removing
- #[ensures] on async functions may have limitations in the contracts crate
- Postcondition evaluation adds small runtime overhead — should be negligible but verify
