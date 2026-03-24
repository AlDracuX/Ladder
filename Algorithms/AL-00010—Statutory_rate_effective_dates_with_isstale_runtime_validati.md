---
id: AL-00010
title: "Statutory rate effective dates with is_stale runtime validation"
status: complete
created: 2026-03-24
domain: uk-employment-law
tags: [statutory-caps, sunset, effective-dates, uk-law, runtime-validation]
experiments: [EX-00008]
complexity: low
---

## Description

A runtime staleness check for hardcoded UK statutory rates that change annually (e.g., weekly pay cap, compensatory award cap, Vento bands). Two ISO 8601 date constants (`EFFECTIVE_START`, `EFFECTIVE_END`) bracket the valid period, and an `is_stale(current_date)` function returns true when the current date falls outside that range. This prevents canisters from silently using expired rates after the April tax year boundary.

Chain: EX-00008 -> HY-00011 -> ID-00003 -> SR-00006

## Method

1. **Add effective date constants** to the statutory caps module (`packages/awen_types/src/uk_caps.rs`):

```rust
/// First day these rates are effective (2025/26 tax year): 6 April 2025
pub const EFFECTIVE_START: &str = "2025-04-06";

/// Last day these rates are effective (2025/26 tax year): 5 April 2026
pub const EFFECTIVE_END: &str = "2026-04-05";
```

2. **Implement the staleness check** using simple string comparison (ISO 8601 lexicographic order matches chronological order):

```rust
pub fn is_stale(current_date: &str) -> bool {
    current_date > EFFECTIVE_END || current_date < EFFECTIVE_START
}
```

3. **Write boundary tests** covering all edge cases:
   - Exact start date (not stale)
   - Exact end date (not stale — inclusive)
   - Day after end (stale)
   - Day before start (stale)
   - Mid-year (not stale)
   - Well after sunset (stale)

4. **Integrate into CI** via `mise run check-et-rules` to fail builds when rates are expired.

5. **Integrate into canister lifecycle** by calling `is_stale()` in `post_upgrade` hooks to log warnings when deployed with stale rates.

6. **Annual update process**: When new rates are published (typically February for April start), update the constants and rate values, then bump `EFFECTIVE_END` to the new tax year boundary.

## When to Use

- Any hardcoded statutory rates that change annually (UK employment tribunal caps, Vento bands, ACAS uplift limits)
- Any financial constant with a known expiry date
- CI pipelines that should fail when legal constants are out of date
- Canister post_upgrade hooks for runtime staleness warnings

## When NOT to Use

- Rates that don't have annual update cycles (e.g., fixed legislative thresholds)
- Values already fetched dynamically from an external source
- Non-date-bounded constants (e.g., mathematical constants, protocol parameters)

## Inputs

- `current_date: &str` — ISO 8601 date string (e.g., "2026-04-06")
- The function uses module-level `EFFECTIVE_START` and `EFFECTIVE_END` constants

## Outputs

- `bool` — `true` if the date is outside the effective range (rates are stale), `false` if within range

## Limitations

- String comparison only — does not validate date format (garbage input like "not-a-date" will produce unpredictable results)
- No external date parsing dependency — intentionally simple but cannot handle non-ISO formats
- Requires manual constant updates each tax year — there is no automatic rate fetching
- The `is_stale()` function detects the problem but does not enforce a remedy — callers must decide what to do (warn, fail, block)
- Does not account for mid-year rate changes (rare but possible via statutory instruments)

## Evidence

- **EX-00008**: Added EFFECTIVE_START/END constants and is_stale() function. 8 unit tests pass covering all boundary conditions.
- **RE-00011**: PASSED — HY-00011 validated. Statutory rate staleness is now detectable programmatically. ISO 8601 string comparison confirmed reliable for chronological ordering.
- Source file: `packages/awen_types/src/uk_caps.rs` (169 lines)
