---
id: ID-00021
title: "Storable Money newtype with u64 pence and f64-safe arithmetic for settlement"
status: active
updated: 2026-03-23
created: 2026-03-23
sources: [SR-00036]
phase: mate
domain: "financial-accuracy"
tags: [money, newtype, storable, f64, settlement, type-safety]
scores:
  feasibility: 8
  novelty: 5
  impact: 7
  elegance: 9
---

## Description

Create a `Money` newtype wrapping `u64` (representing pence) that implements `Storable` via `CandidStorable` derive and provides safe arithmetic methods. The type prevents accidental raw `f64` usage by encapsulating all financial operations: `Money::from_pounds(f64)`, `Money::to_f64_pounds()`, `Money::multiply_rate(f64)` (for win probability / severity factor calculations), and standard `Add`/`Sub` on the u64 representation. This combines AL-00004's Storable pattern with SR-00036's f64-safe financial storage pattern into a single reusable type in `awen_types`.

## Provenance

Generated during MATE phase from AL-00004 (Storable pattern) × SR-00036 (f64 financial pattern). The settlement canister already uses u64 pence internally, but without type enforcement — raw `as f64` casts appear in multiple calculation functions. A newtype makes the conversion boundaries explicit and auditable.

## Connection

Affects `settlement` canister primarily (all financial calculations), plus `awen_uk_employment` (statutory caps), and any BDD test that validates financial outputs. The current code works correctly but relies on developer discipline to maintain the "store as pence, compute as f64, round back" pattern. The newtype enforces it at the type level.

## Next Steps

- Hypothesis: "Replacing raw u64 pence + f64 casts with Money newtype in settlement canister reduces financial precision bugs to zero"
- Would need to verify: no existing tests break, Money arithmetic matches current f64 intermediate results exactly, Storable round-trip preserves all values
