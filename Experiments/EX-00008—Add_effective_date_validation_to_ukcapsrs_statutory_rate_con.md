---
id: EX-00008
title: "Add effective date validation to uk_caps.rs statutory rate constants"
status: complete
created: 2026-03-24
hypothesis: HY-00011
algorithm:
tags: [uk-law, statutory-caps, date-validation, tdd, runtime-check]
methodology: "TDD: write failing tests first, then implement is_stale() function with EFFECTIVE_START/END constants"
duration: "~30 minutes"
success_criteria: "is_stale() correctly detects expired rate constants; all workspace tests pass"
---

## Objective

Test whether adding effective date boundaries (EFFECTIVE_START, EFFECTIVE_END) and an `is_stale()` function to `uk_caps.rs` can detect when statutory rate constants have expired. This is the pragmatic MVP of HY-00011's compile-time warning hypothesis -- a runtime check with unit tests rather than a proc macro approach.

## Methodology

1. **Baseline**: Verify `cargo check --workspace` and `cargo nextest run -p awen_types` pass before changes
2. **TDD Red**: Add tests for `is_stale()` that reference not-yet-existing constants and function
3. **TDD Green**: Implement `EFFECTIVE_START`, `EFFECTIVE_END` constants and `is_stale(current_date: &str) -> bool` function
4. **Verify**: Run `cargo check --workspace` + `cargo nextest run -p awen_types`
5. **Edge cases tested**: exact start date (valid), mid-year (valid), day after end (stale), exact end date (valid)

## Setup

- Rust workspace at `/mnt/media_backup/PROJECTS/awen-network-canisters`
- Target file: `packages/awen_types/src/uk_caps.rs`
- Re-export via: `packages/awen_uk_employment/src/caps.rs` (automatic via `pub use *`)
- CARGO_TARGET_DIR: `/mnt/media_backup/cargo-target`
- Workspace lints: no unwrap, no expect, no panic

## Algorithm

Simple lexicographic date string comparison on ISO 8601 (YYYY-MM-DD) format:
- `is_stale(current_date) = current_date > EFFECTIVE_END`
- No chrono dependency, no date parsing -- pure string comparison works because YYYY-MM-DD sorts correctly

## Success Criteria

- `is_stale("2026-04-06")` returns `true` (day after tax year ends)
- `is_stale("2025-10-01")` returns `false` (mid-year, valid)
- `is_stale("2025-04-06")` returns `false` (exact start, valid)
- `is_stale("2026-04-05")` returns `false` (exact end, still valid)
- `cargo check --workspace` passes with zero errors
- `cargo nextest run -p awen_types` passes all tests (old + new)

## Data Collection

- Compile output: `cargo check --workspace 2>&1`
- Test output: `cargo nextest run -p awen_types 2>&1`
- Count of new tests added vs passing

## Results

(Fill in after running)

## Analysis

(Fill in after running)

## Next Steps

(Fill in after running)
