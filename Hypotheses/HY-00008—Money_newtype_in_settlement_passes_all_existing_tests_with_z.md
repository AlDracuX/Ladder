---
id: HY-00008
title: "Money newtype in settlement passes all existing tests with zero raw u64-to-f64 casts remaining"
status: draft
created: 2026-03-24
idea: ID-00021
tags: [money, newtype, settlement, f64, type-safety, refactor]
prediction: "All settlement tests pass with Money newtype and zero raw `as f64` casts remain in calculation functions"
metric: "count of raw u64-to-f64 casts in settlement/src/lib.rs calculation functions"
success_criteria: "zero raw casts, all 552+ settlement tests pass, no precision regression"
---

## Hypothesis

If we create a `Money` newtype wrapping `u64` pence in `awen_types` with safe arithmetic methods (`from_pounds`, `to_f64_pounds`, `multiply_rate`) and replace all raw `as f64` casts in settlement calculation functions, then all existing settlement tests pass unchanged AND zero raw u64-to-f64 casts remain in calculation code paths.

## Rationale

The settlement canister already uses u64 pence + f64 intermediates correctly (SR-00036 confirmed f64 migration complete). But the pattern relies on developer discipline — raw `as f64` casts appear throughout without type enforcement. ID-00021 proposes a Money newtype that makes the conversion boundaries explicit. This hypothesis tests whether the refactor is feasible without breaking existing behavior.

## Testing Plan

1. Baseline: `rg 'as f64' src/settlement/src/lib.rs | wc -l` — count raw casts
2. Baseline: `cargo nextest run -p settlement` — all tests pass
3. Create `Money` newtype in `packages/awen_types/src/money.rs`
4. Replace raw casts in settlement calculation functions with `Money` methods
5. Post: `rg 'as f64' src/settlement/src/lib.rs | wc -l` — should be zero in calc functions
6. Post: `cargo nextest run -p settlement` — all tests still pass

## Success Criteria

- Primary: zero raw `as f64` casts in settlement calculation functions (some may remain in test helpers — that's acceptable)
- Secondary: all 552+ settlement tests pass with identical results
- Tertiary: `Money` type implements `CandidStorable` and round-trips through StableBTreeMap

## Risks

- Candid encoding of Money newtype may differ from raw u64, breaking existing stable storage data — would need migration
- Some f64 intermediate calculations may not map cleanly to Money methods (e.g., complex multi-step ratios)
- Test assertions comparing raw f64 values may need adjustment for the new type's API
