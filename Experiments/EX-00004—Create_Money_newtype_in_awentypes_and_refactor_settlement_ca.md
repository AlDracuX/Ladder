---
id: EX-00004
title: "Create Money newtype in awen_types and refactor settlement calculations"
status: complete
created: 2026-03-24
hypothesis: HY-00008
algorithm: ""
tags: [money, newtype, settlement, type-safety, refactor, precision]
methodology: "Worktree-isolated refactor: create Money(u64) newtype in awen_types, replace raw as-f64 casts in settlement calculation functions, validate all 552+ tests pass"
duration: "single session (~2 hours)"
success_criteria: "zero raw u64-to-f64 money casts in settlement production code, all tests pass, cargo check --workspace clean"
---

## Objective

Test whether a `Money(u64)` newtype wrapping pence values can replace all raw `as f64` casts in the settlement canister's calculation functions without breaking any existing tests or introducing precision regressions. This validates HY-00008's prediction that type-safe money arithmetic is a zero-risk refactor.

## Methodology

1. **Baseline measurement**: Count `as f64` casts in `src/settlement/src/lib.rs`, run all settlement tests
2. **Create Money newtype** in `packages/awen_types/src/money.rs`:
   - `Money(u64)` wrapping pence
   - Methods: `from_pence`, `pence`, `from_pounds_f64`, `to_pounds_f64`, `multiply_rate`, `percentage_of`
   - Traits: `Add`, `Sub`, `Display`, `Default`, `Clone`, `Copy`, `PartialEq`, `Eq`, `PartialOrd`, `Ord`
   - Derives: `CandidType`, `Serialize`, `Deserialize`, `CandidStorable`
3. **Refactor settlement**: Replace raw `as f64` casts in calculation functions with Money methods
4. **Post measurement**: Recount casts, run all tests, check workspace
5. **Document results**: Create RE- entry with before/after metrics

## Setup

- Git worktree branch: `experiment/ex-00004-money-newtype`
- Baseline: 46 total `as f64` casts (31 production, 15 test)
- Production breakdown: ~18 money casts (refactorable), ~7 format-string pence-to-pounds, ~3 metrics (non-money, keep), ~3 non-money (rates/years, keep)
- Environment: `CARGO_TARGET_DIR=/mnt/media_backup/cargo-target`

## Algorithm

No specific AL- entry referenced. Approach is standard newtype pattern with incremental function-by-function refactoring.

## Success Criteria

1. All settlement tests pass (same count as baseline)
2. Zero raw `as f64` casts on money values in production code (metrics/rates/years excluded)
3. `cargo check --workspace` passes cleanly
4. Money type derives CandidStorable and implements required traits
5. No test code modifications required

## Data Collection

- Pre/post `rg 'as f64' src/settlement/src/lib.rs | wc -l`
- Pre/post `cargo nextest run -p settlement` pass/fail counts
- `cargo check --workspace` exit code
- Qualitative: which casts were convertible vs. not

## Results

(Fill in after running)

## Analysis

(Fill in after running)

## Next Steps

(Fill in after running)
