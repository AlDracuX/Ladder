---
id: HY-00027
title: "Canister env var override updates statutory rates within 60 seconds without code upgrade"
status: draft
created: 2026-03-27
idea: ID-00033
tags: [env-vars, statutory-rates, hot-swap, uk-caps, runtime-config]
prediction: "Env var override changes effective statutory rate within 60s without canister upgrade"
metric: "Time from env var set to query returning new rate; upgrade requirement (yes/no)"
success_criteria: "Rate query returns overridden value within 60 seconds of env var change, no code upgrade needed"
---

## Hypothesis

If we modify `uk_caps.rs` rate functions to check canister environment variables (e.g., `AWEN_UK_WEEKLY_PAY_CAP`) before returning compiled constants, then statutory rates can be updated within 60 seconds of setting the env var via the management canister, without requiring a code upgrade.

## Rationale

ID-00033 combines ic-cdk 0.19 canister env vars (SR-00044) with the `is_stale` effective-date pattern (AL-00010). UK statutory rates change annually — currently this requires a code change to `uk_caps.rs`, rebuild, and canister upgrade. Env var overrides decouple rate delivery from deployment cycles. The 60-second threshold accounts for env var propagation via the management canister API. AL-00010's `is_stale` provides the safety net: overridden rates with future effective dates won't be applied prematurely.

## Testing Plan

1. **Baseline**: Deploy settlement canister to PocketIC, call `weekly_pay_cap()` query, confirm it returns compiled constant (£700)
2. **Change**: Modify `uk_caps.rs::weekly_pay_cap()` to check `AWEN_UK_WEEKLY_PAY_CAP` env var first, fallback to compiled constant
3. **Set override**: Use management canister API to set `AWEN_UK_WEEKLY_PAY_CAP=72000` (£720.00 in pence)
4. **After**: Call `weekly_pay_cap()` again, measure time from env var set to correct response
5. **Verify safety**: Set env var with future effective date, confirm `is_stale` prevents premature application

## Success Criteria

- Primary: Query returns overridden rate within 60 seconds of env var change
- Primary: No canister upgrade (reinstall/upgrade call) was required
- Secondary: Invalid env var values (negative, non-numeric) fall back to compiled constant safely
- Secondary: `is_stale` correctly gates future-dated overrides

## Risks

- Canister env vars may not be readable via `std::env::var` in WASM — may need ic-cdk specific API
- PocketIC may not support the management canister env var API yet
- If env vars are only set at canister install time (not runtime), the entire premise fails — need to verify the API supports runtime updates
