---
id: HY-00023
title: "Cycles u128 newtype eliminates all raw cycle arithmetic across 9 canisters with zero test regressions"
status: draft
created: 2026-03-27
idea: ID-00045
tags: [cycles, newtype, type-safety, mcp-gateway, awen-types]
prediction: "All raw u128 cycle arithmetic replaced with Cycles newtype, zero test regressions"
metric: "Count of raw u128 operations on canister_balance128/cycle values; test pass rate"
success_criteria: "Zero raw u128 cycle arithmetic in src/; all existing tests pass"
---

## Hypothesis

If we introduce a `Cycles(u128)` newtype in `awen_types` and wrap all `canister_balance128()` and cycle cost estimation calls, then the count of raw u128 arithmetic on cycle values drops to zero across all 9 canisters with no test regressions.

## Rationale

ID-00045 applies the Money newtype pattern (AL-00008) to cycles. Raw u128 is used for timestamps, byte sizes, record counts, AND cycles — mixing them is a type confusion bug waiting to happen. The same pattern that eliminated £/pence confusion (AL-00008) applies here. mcp_gateway's rate limiter tracks cycles consumed per request as raw u128, and case_hub estimates cycles before inter-canister calls. A `Cycles` newtype with checked arithmetic catches unit mismatches at compile time.

## Testing Plan

1. **Baseline**: `rg 'canister_balance128|msg_cycles_available|msg_cycles_accept' src/ --count` to count raw cycle API usage sites
2. **Change**: Define `Cycles(u128)` in `awen_types` with `Add`, `Sub`, `Ord`, `Display`, `Storable`. Wrap all cycle API calls.
3. **After**: Same grep — expect zero raw u128 cycle operations. Run `cargo nextest run` — expect all tests pass.
4. **Delta**: Before count → 0 is success.

## Success Criteria

- Primary: Zero raw u128 cycle arithmetic remaining in `src/` (verified by grep)
- Secondary: All existing tests pass (`cargo nextest run` exit 0)
- Secondary: `Cycles` type has `Storable` impl for upgrade persistence

## Risks

- Some crates may use cycle values in ways that resist wrapping (e.g., logging, Candid serialization)
- The newtype may need `From<u128>` at API boundaries, which could allow bypassing if misused
- Test mocks that fabricate cycle values need updating
