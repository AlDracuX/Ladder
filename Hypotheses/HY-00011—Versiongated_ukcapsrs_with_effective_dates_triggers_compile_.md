---
id: HY-00011
title: "Version-gated uk_caps.rs with effective dates triggers compile warnings after statutory rate sunset"
status: complete
created: 2026-03-24
idea: ID-00003
tags: [uk-law, statutory-caps, versioning, compile-time, sunset]
prediction: "Accessing a rate constant after its sunset date produces a compile warning or deprecation notice"
metric: "count of compiler warnings when building with expired rate constants"
success_criteria: "cargo check emits deprecation warning for any rate constant past its effective_end date"
---

## Hypothesis

If we add `effective_start` and `effective_end` dates to uk_caps.rs rate constants and use Rust's `#[deprecated]` attribute with a build-time date check, then accessing an expired rate constant triggers a compile warning, preventing stale statutory rates from being used silently.

## Rationale

SR-00006 identified that uk_caps.rs hardcodes 2025/26 rates with no sunset mechanism. ID-00003 proposes version-gated rates. UK employment tribunal statutory caps change annually (typically in April). If the codebase deploys with stale rates, financial calculations silently produce incorrect results. A compile-time warning forces developers to update rates or explicitly acknowledge the stale values.

## Testing Plan

1. Baseline: `cargo check -p awen_types 2>&1 | grep -i deprec` — zero warnings
2. Add rate struct: `struct StatutoryRate { value: u64, effective_start: &str, effective_end: &str }`
3. Add macro: `rate!("2025-04-06", "2026-04-05", 105_707_00)` that conditionally applies `#[deprecated]` based on build-time env var `STATUTORY_DATE`
4. Set `STATUTORY_DATE=2026-04-06` (after sunset) and run `cargo check`
5. Verify: deprecation warning emitted for 2025/26 rates
6. Set `STATUTORY_DATE=2025-10-01` (during valid period) and verify no warning

## Success Criteria

- Primary: expired rates produce `#[deprecated]` warnings on `cargo check`
- Secondary: valid-period rates compile cleanly without warnings
- Tertiary: `mise run check-et-rules` still passes (existing staleness detection preserved)

## Risks

- Rust `#[deprecated]` is applied to items, not to const values — may need wrapper functions or a custom proc macro
- Build-time date check requires env var injection (e.g., via `mise.toml`) which adds build complexity
- Multiple rate tables (one per year) increase code size — need a clean multi-year registry pattern
