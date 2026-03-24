---
id: ID-00016
title: "Use contracts #[ensures] for postconditions only, not #[requires] on validated functions"
status: active
created: 2026-03-23
sources: [SR-00032]
phase: contemplate
domain: "testing"
tags: [contracts, design-by-contract, postcondition, validation, _impl]
scores:
  feasibility: 8
  novelty: 4
  impact: 6
  elegance: 7
updated: 2026-03-23
---

## Description

When applying the `contracts` crate (0.6) to `_impl` functions, use only `#[ensures]` (postconditions) — never `#[requires]` (preconditions) on functions that already perform input validation and return `Err`. The `#[requires]` macro expands to `debug_assert!` which panics before the function body runs, conflicting with the existing validation-and-return-Err pattern. Postconditions via `#[ensures]` verify the output is consistent (e.g., returned ID is non-zero, returned list is sorted) without interfering with the function's own error handling.

## Provenance

Generated during contemplate phase from SR-00032 (contracts #[requires] conflicts with existing validation in test mode). The conflict was discovered when `#[requires(!request.title.is_empty())]` caused test failures — the debug_assert fired before the `_impl` function could return `Err(InvalidInput)`. This is a design-by-contract pattern adaptation specific to Awen's _impl architecture (AL-00001).

## Connection

Affects all 5 canisters where contracts annotations were added (SR-00029). The pattern is: `#[ensures]` on _impl functions is safe and additive, `#[requires]` on _impl functions conflicts with validation. Related to ID-00014 (design-by-contract invariant monitor) which should adopt this same postcondition-only rule.

## Next Steps

- Hypothesis: "Postcondition-only contracts (#[ensures]) on all _impl functions catch logic bugs without causing test conflicts"
- Audit: grep all `#[requires]` usages and convert to either `#[ensures]` or remove
- Consider: could postconditions verify quota enforcement (returned count < MAX)?
