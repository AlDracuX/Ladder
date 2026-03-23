---
id: SR-00036
title: "Pattern: f64 for all financial calculations eliminates precision loss above GBP 167K"
type: pattern
url: ""
status: draft
created: 2026-03-23
tags: [f64, precision, financial, settlement, statutory-calculation]
domain: "financial-accuracy"
relevance: "high"
---

## Summary

The settlement canister already uses `f64` for all financial calculations including win probabilities, severity factors, percentage-of-claim ratios, and risk-adjusted valuations. This was previously flagged as a concern (SR-00002 noted f32 precision loss), but the codebase has been migrated to f64 throughout. With f64's 53-bit mantissa, integer-exact representation extends to 2^53 (approximately 9 quadrillion pence / GBP 90 trillion), far exceeding any employment tribunal award. The prior GBP 167K threshold was the f32 limit; f64 eliminates this entirely.

## Key Points

- Settlement canister uses `f64` for `win_probability`, `severity_factor`, `percentage_of_claim`, and `breakeven_win_probability`
- Financial amounts stored as `u64` pence, cast to `f64` only for ratio/percentage calculations, then cast back
- f32 loses integer precision above 2^24 = 16,777,216 pence (GBP 167,772); f64 is safe to 2^53
- The `uk_caps.rs` statutory cap for 2025/26 is well within f64 safe range
- Pattern: store money as integer pence, use f64 only for intermediate floating-point math, round back to integer

## Connection to Problems

Closes the precision concern raised in SR-00002 and SR-00023 (which noted the f64 migration was already complete). This source documents the architectural decision for the record: f64 is the project standard for all floating-point financial math, and the store-as-pence pattern prevents accumulation of rounding errors.

## Potential Ideas

- Consider a `Money` newtype wrapping `u64` pence with safe arithmetic methods to prevent accidental raw f64 usage
- Add property tests that verify round-trip precision for all statutory cap values through the calculation pipeline
