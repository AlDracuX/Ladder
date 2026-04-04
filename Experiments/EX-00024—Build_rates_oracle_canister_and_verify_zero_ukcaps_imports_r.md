---
id: EX-00024
title: "Build rates oracle canister and verify zero uk_caps imports remain in consumer canisters"
status: draft
created: 2026-03-27
hypothesis: HY-00036
algorithm: ""
tags: [oracle, governance, statutory-rates, uk-employment, settlement, legal-analysis, pocketic]
methodology: "Create rates oracle canister with versioned StatutoryRates, migrate settlement and legal_analysis to fetch rates at runtime, verify grep for uk_caps:: in src/ returns zero matches"
duration: "1 day"
success_criteria: "Zero uk_caps:: imports in canister code; identical calculation results pre and post migration; annual rate update via single admin call; oracle query latency under 1ms; historical rate lookup works"
---

## Objective

Validate that a rates oracle canister storing versioned statutory rate data (currently compile-time constants in `packages/awen_types/src/uk_caps.rs`) enables settlement and legal_analysis to fetch rates at runtime, reducing direct `uk_caps::*` imports in canister code to zero. This makes annual rate updates a data operation (one admin call) rather than a code deployment requiring WASM recompilation of all dependent canisters.

## Methodology

1. **Baseline: count current uk_caps:: references in canister code**
   ```bash
   cd /mnt/media_backup/PROJECTS/awen-network-canisters
   grep -rn 'uk_caps::' src/ | grep -v '#\[cfg(test)\]' | grep -v '// ' > /tmp/uk-caps-baseline.txt
   wc -l /tmp/uk-caps-baseline.txt
   # Expected: references in settlement/src/ and legal_analysis/src/
   # Also count: which specific constants are used
   grep -oP 'uk_caps::\w+' src/*/src/*.rs | sort | uniq -c | sort -rn
   ```

2. **Document current uk_caps.rs constants**
   ```bash
   grep -n 'pub const' packages/awen_types/src/uk_caps.rs
   # Expected: BASIC_AWARD_MAX_PENCE, COMPENSATORY_AWARD_CAP_PENCE, etc.
   ```

3. **Design rates oracle canister** (describe, not implement)
   - File: new `src/rates_oracle/src/lib.rs`
   - Storage: `StableBTreeMap<EffectiveDate, StatutoryRates, Memory>` where:
     - `EffectiveDate` = `u64` (IC timestamp of rate effective date)
     - `StatutoryRates` = struct mirroring all uk_caps.rs constants
   - Endpoints:
     - `#[query] fn get_current_rates() -> StatutoryRates` (returns rates for current date)
     - `#[query] fn get_rates_for_date(date: u64) -> Option<StatutoryRates>` (historical lookup)
     - `#[update] fn push_rates(rates: StatutoryRates, effective_date: u64) -> Result<(), OracleError>` (admin only)
   - Seed with 2025/26 rates matching current uk_caps.rs values

4. **Migrate settlement canister** (describe, not implement)
   - Replace `use awen_types::uk_caps::BASIC_AWARD_MAX_PENCE` etc. with runtime fetch
   - In `calculate_award_impl`: call oracle's `get_rates_for_date` with the case's relevant date
   - Cache fetched rates in a thread_local for the duration of the message execution
   - Handle oracle unavailability: return specific error, do NOT fall back to hardcoded values

5. **Migrate legal_analysis canister** (describe, not implement)
   - Same pattern as settlement: replace compile-time imports with oracle queries
   - For functions that need rates: add `rates: &StatutoryRates` parameter to _impl functions
   - Fetch rates once per update call, pass to all _impl functions

6. **PocketIC integration test: calculation parity**
   ```bash
   # tests/integration/rates_oracle_parity_test.rs
   # 1. Deploy rates_oracle seeded with 2025/26 rates
   # 2. Deploy settlement + legal_analysis configured to use oracle
   # 3. Run 10 award calculations with known inputs
   # 4. Compare outputs against expected values (pre-computed from current uk_caps constants)
   # 5. Assert: all 10 calculations produce identical results
   cargo nextest run -p tests -E 'test(/oracle_parity/)' --no-capture 2>&1
   ```

7. **Test rate update without redeployment**
   ```bash
   # 1. Push hypothetical 2026/27 rates to oracle via admin call
   # 2. Re-run the same 10 calculations
   # 3. Verify: results now use new rates (different from step 6)
   # 4. Verify: no canister WASM was recompiled or redeployed
   cargo nextest run -p tests -E 'test(/oracle_rate_update/)' --no-capture 2>&1
   ```

8. **Verify zero uk_caps:: imports in canister code**
   ```bash
   grep -rn 'uk_caps::' src/ | grep -v test | grep -v '// '
   # Expected: 0 matches
   # Note: uk_caps.rs in packages/awen_types/ still exists for tests and oracle seeding
   ```

9. **Measure oracle query latency**
   ```bash
   # PocketIC instruction counting:
   # Compare instruction count of calculate_award with direct constant access vs oracle query
   # Target: oracle query adds less than 1ms equivalent overhead
   ```

## Setup

- Working directory: `/mnt/media_backup/PROJECTS/awen-network-canisters`
- Branch: `experiment/ex-00024-rates-oracle` (git worktree)
- Prerequisite: `mise run build` (including new rates_oracle canister)
- New canister: `src/rates_oracle/` (Cargo.toml, src/lib.rs, rates_oracle.did)
- Modified canisters: settlement (remove uk_caps imports, add oracle calls), legal_analysis (same)
- Existing constants: `packages/awen_types/src/uk_caps.rs` (remains for tests)
- PocketIC tests: `tests/integration/rates_oracle_parity_test.rs`

## Algorithm

No specific AL- entry. Uses the oracle pattern: a dedicated canister serves reference data that multiple consumers need. Versioned by effective date to support historical lookups (cases spanning rate changes). Admin-gated updates to prevent unauthorized rate manipulation.

## Success Criteria

- [ ] Rates oracle canister compiles for wasm32-unknown-unknown
- [ ] Oracle seeded with 2025/26 rates matching uk_caps.rs constants exactly
- [ ] Zero uk_caps:: imports in canister source code (src/ directory, excluding tests)
- [ ] 10 settlement calculations produce identical results pre and post migration
- [ ] 10 legal_analysis calculations produce identical results pre and post migration
- [ ] Rate update via admin call works without canister redeployment
- [ ] Historical rate lookup returns correct rates for past effective_date
- [ ] Oracle query latency adds less than 1ms to calculations

## Data Collection

| Metric | Baseline (compile-time) | After (oracle) |
|--------|------------------------|----------------|
| uk_caps:: imports in src/ | TBD (expect 5+) | 0 |
| Settlement calculation accuracy | 100% | 100% (verified) |
| Legal analysis calculation accuracy | 100% | 100% (verified) |
| Deployment required for rate update | Yes (recompile + deploy) | No (admin call) |
| Oracle query instruction cost | N/A | TBD |
| Historical rate lookup | Not supported | Supported |

## Risks & Mitigations

- **Oracle as runtime dependency**: If oracle traps, settlement and legal_analysis cannot calculate awards. Mitigation: implement a "rates cache" in consumer canisters that stores the last fetched rates in stable storage; use cached rates if oracle is unavailable, with a staleness warning.
- **Batch calculation overhead**: A calculation involving 100 awards would make 100 oracle queries. Mitigation: fetch rates once per update call (not per calculation), pass as parameter.
- **Dual-purpose of uk_caps.rs**: The module serves both as runtime constants AND compile-time validation in tests. Mitigation: keep uk_caps.rs for tests and oracle seeding; only eliminate imports in canister runtime code.
- **Rate caching staleness**: If consumer canisters cache rates, they may use stale rates after an update. Mitigation: include an `effective_until` field in StatutoryRates; consumer canisters re-fetch when `ic_time > effective_until`.

## Results

(Fill in after running)

## Analysis

(Fill in after running)

## Next Steps

If migration achieves zero imports with parity: merge, create AL- entry for the oracle pattern. If latency is unacceptable: consider caching strategies or periodic rate broadcast from oracle to consumers. Create RE- result entry.
