---
id: SR-00046
title: "Pattern: Money u64 newtype enforces type-safe pence arithmetic eliminating 25 raw casts"
type: pattern
url: ""
status: archived
updated: 2026-03-26
created: 2026-03-24
tags: [money, newtype, type-safety, settlement, f64, precision]
domain: "financial-accuracy"
relevance: "high"
---

## Summary

Created `Money(u64)` newtype in `packages/awen_types/src/money.rs` (260 lines, 20 unit tests). Wraps pence values with safe arithmetic methods: `from_pence`, `to_pounds_f64`, `multiply_rate`, `percentage_of`. Implements `Add`, `Sub`, `Display`, `Ord` traits and derives `CandidStorable`. Reduced raw `as f64` casts in the settlement canister from 46 to 21, eliminating 25 unsafe conversions that could silently lose precision on large amounts.

## Key Points

- 260 lines of implementation with 20 unit tests covering arithmetic edge cases and overflow
- Provides `from_pence`, `to_pounds_f64`, `multiply_rate`, `percentage_of` as the safe API surface
- Implements `Add`, `Sub`, `Display`, `Ord` traits for ergonomic use in comparisons and formatting
- Derives `CandidStorable` for direct use in stable storage and Candid serialization
- Eliminated 25 of 46 raw `as f64` casts in settlement canister, preventing silent precision loss
- Pence-based integer arithmetic avoids floating-point rounding in financial calculations

## Connection to Problems

Directly addresses financial precision risks in the settlement canister where raw `u64`-to-`f64` casts could silently lose precision on large monetary values. Also connects to `awen_uk_employment` statutory caps (`packages/awen_types/src/uk_caps.rs`) which define compensation limits as raw integers. The Money type provides a single canonical representation for all monetary values across the codebase, reducing the chance of unit confusion (pence vs pounds).

## Potential Ideas

- Propagate `Money` type to `deadline_alerts` canister where statutory compensation calculations occur
- Replace remaining 21 raw casts in settlement with Money methods to reach zero unsafe conversions
- Adopt Money in BDD/property tests for more expressive assertions on financial outcomes
- Add `Money::from_pounds` constructor for convenience in test fixtures and UI-facing code
