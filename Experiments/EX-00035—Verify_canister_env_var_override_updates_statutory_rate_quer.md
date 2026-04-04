---
id: EX-00035
title: "Verify canister env var override updates statutory rate query within 60 seconds without upgrade"
status: draft
created: 2026-03-27
hypothesis: HY-00027
algorithm: AL-00010
tags: [env-vars, statutory-rates, hot-swap, uk-caps, runtime-config, settlement]
methodology: "Deploy settlement canister to PocketIC, query baseline rate, set env var via management canister API, re-query within 60s, verify rate changed without code upgrade; test safety with invalid and future-dated values"
duration: "3 hours"
success_criteria: "Rate query returns overridden value within 60s of env var change; no canister upgrade; invalid values fall back to compiled constant"
---

## Objective

Validate that modifying `uk_caps.rs` rate functions to check canister environment variables (e.g., `AWEN_UK_WEEKLY_PAY_CAP`) before returning compiled constants allows statutory rates to be updated within 60 seconds of setting the env var, without requiring a canister code upgrade. This decouples annual rate updates from the deployment cycle.

## Methodology

1. **Verify PocketIC env var API support**
   ```bash
   cd /mnt/media_backup/PROJECTS/awen-network-canisters
   # Check PocketIC version and whether it supports canister_env_vars management API
   grep -r "canister_env" tests/ || echo "No existing env var usage found"
   # Check ic-cdk version for env var support (0.19+)
   grep 'ic-cdk' Cargo.toml | head -5
   ```

2. **Record baseline rate query**
   ```bash
   # PocketIC integration test: deploy settlement canister, call weekly_pay_cap query
   # Expected: returns WEEKLY_PAY_CAP_PENCE = 70_000 (£700)
   cargo nextest run -p settlement -E 'test(/baseline_rate_query/)'
   ```

3. **Implement env var override in uk_caps.rs** (on experiment branch)
   ```bash
   git worktree add /tmp/ex-00035 -b experiment/ex-00035-env-var-rates
   cd /tmp/ex-00035
   ```
   - Modify `packages/awen_types/src/uk_caps.rs`: add `weekly_pay_cap()` function that:
     1. Checks `ic_cdk::api::canister_env_var("AWEN_UK_WEEKLY_PAY_CAP")`
     2. If present and valid u64: return that value
     3. If absent, invalid, or parse error: return compiled `WEEKLY_PAY_CAP_PENCE`
   - Add `#[cfg(not(target_arch = "wasm32"))]` fallback using `std::env::var` for unit tests

4. **Write PocketIC integration test for env var override**
   ```bash
   # tests/integration/env_var_rate_test.rs:
   # 1. Deploy settlement canister
   # 2. Query weekly_pay_cap() -- expect 70_000
   # 3. Set env var AWEN_UK_WEEKLY_PAY_CAP=72000 via management canister
   # 4. Record timestamp T0
   # 5. Query weekly_pay_cap() -- expect 72_000
   # 6. Record timestamp T1
   # 7. Assert T1 - T0 < 60 seconds
   # 8. Assert no upgrade/reinstall call was made
   ```

5. **Test invalid env var fallback**
   ```bash
   # Set AWEN_UK_WEEKLY_PAY_CAP="not_a_number" via management canister
   # Query weekly_pay_cap() -- expect fallback to 70_000
   # Set AWEN_UK_WEEKLY_PAY_CAP="-100" (negative)
   # Query weekly_pay_cap() -- expect fallback to 70_000
   ```

6. **Test is_stale safety gate for future-dated overrides** (if applicable)
   ```bash
   # If integrating with AL-00010's effective-date pattern:
   # Set AWEN_UK_WEEKLY_PAY_CAP=72000 with AWEN_UK_RATES_EFFECTIVE_DATE=2027-04-06
   # Query weekly_pay_cap() -- expect 70_000 (current, not future)
   # Advance PocketIC time past 2027-04-06
   # Query weekly_pay_cap() -- expect 72_000
   ```

7. **Run full test suite to verify no regressions**
   ```bash
   cargo nextest run -p settlement
   cargo nextest run -p awen_types
   ```

## Setup

- Working directory: `/mnt/media_backup/PROJECTS/awen-network-canisters`
- Branch: `experiment/ex-00035-env-var-rates` (git worktree at `/tmp/ex-00035`)
- Primary file: `packages/awen_types/src/uk_caps.rs` (currently all `pub const`, no functions)
- Current rate: `WEEKLY_PAY_CAP_PENCE: u64 = 70_000` (April 2025: GBP 700)
- ic-cdk version: 0.19+ (required for canister env var API)
- PocketIC: needs verification for management canister env var support
- Override value for test: 72_000 (GBP 720, the hypothetical April 2026 rate)

## Algorithm

AL-00010 (effective-date validation pattern). The env var override is gated by an effective date check: if the override includes an effective date in the future, the compiled constant is returned instead. This prevents premature application of rates before their statutory effective date.

## Success Criteria

- [ ] Baseline query returns compiled constant (70_000) without env var
- [ ] Management canister API can set canister env var at runtime (not just install time)
- [ ] Rate query returns overridden value (72_000) within 60 seconds of env var set
- [ ] No canister upgrade or reinstall was performed during the test
- [ ] Invalid env var (non-numeric, negative) falls back to compiled constant
- [ ] Future-dated override is blocked until effective date passes (AL-00010 safety)
- [ ] All existing awen_types and settlement tests pass without modification

## Data Collection

| Metric | Target | Actual |
|--------|--------|--------|
| Baseline rate query result | 70_000 | TBD |
| Post-override rate query result | 72_000 | TBD |
| Time from env var set to correct query (ms) | < 60,000 | TBD |
| Canister upgrade required | No | TBD |
| Invalid env var fallback correct | Yes | TBD |
| Future-date gating works | Yes | TBD |
| Existing test regressions | 0 | TBD |

## Risks & Mitigations

- **ic-cdk env var API does not exist for runtime updates**: Canister env vars may only be settable at install/upgrade time (not runtime). Mitigation: if this is the case, the hypothesis is falsified -- env vars cannot provide hot-swap. Alternative: use a `set_rate_override` update method with admin-only access (different approach, different hypothesis).
- **PocketIC does not simulate env vars**: PocketIC may not support the management canister's env var API. Mitigation: test with a local dfx replica instead; or mock the env var read in unit tests and test the logic path only.
- **std::env::var unavailable in wasm32**: The WASM target does not have a real `std::env`. The IC has its own env var API. Mitigation: use `ic_cdk::api::canister_env_var()` for wasm32, `std::env::var()` for native test builds, behind `#[cfg(target_arch)]`.
- **uk_caps.rs is currently const-only**: Changing from `pub const` to `pub fn` changes the calling convention. All call sites must be updated. Mitigation: audit all `WEEKLY_PAY_CAP_PENCE` references and update them.

## Results

(Fill in after running)

## Analysis

(Fill in after running)

## Next Steps

If env var override works within 60s: create AL- entry for the pattern, apply to all 15 rate constants in uk_caps.rs, document the management canister API call for operators. If runtime env vars are not supported: investigate `set_rate_override` admin endpoint as an alternative (new hypothesis). If PocketIC cannot test this: escalate to dfx local replica testing.
