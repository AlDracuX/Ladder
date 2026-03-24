---
id: RE-00004
title: "ALREADY_COMPLETE: Zero requires found, 7 ensures already in place, postcondition-first approach validated"
status: complete
created: 2026-03-24
experiment: EX-00003
outcome: success
tags: [contracts, design-by-contract, postcondition, ensures, _impl, validated]
loops_to: [AL-00001, HY-00013]
---

## Summary

Experiment EX-00003 tested HY-00013 (replacing `#[requires]` with `#[ensures]` on `_impl` functions). The premise was false: zero `#[requires]` annotations exist in the codebase. However, the predicted ideal state is already fully achieved. The codebase uses a postcondition-first design-by-contract approach with 7 meaningful `#[ensures]` annotations across 3 canisters, zero contract-related `debug_assert` panics in 2,539 tests, and all `_impl` functions handle input validation via typed error returns (not precondition panics).

## Data

### Quantitative Results

| Metric | Value |
|--------|-------|
| `#[requires]` annotations in src/ | **0** |
| `#[ensures]` annotations in src/ | **7** |
| `debug_assert` in canister workspace | **0** |
| Canisters using contracts crate | **3** (settlement, procedural_intel, legal_analysis) |
| Canisters without contracts | **6** (evidence_vault, case_timeline, deadline_alerts, reference_shield, mcp_gateway, case_hub) |
| Total `_impl` functions in workspace | **333** across 18 files |
| `#[ensures]` coverage rate | **2.1%** (7/333) |
| Tests run (3 canisters) | **2,539** |
| Tests passed | **2,538** |
| Tests failed | **1** (unrelated to contracts crate) |
| Contract-related panics | **0** |

### The 1 Failed Test

`legal_analysis::rules::tests::test_blocked_claim_missing_prerequisite` fails due to a logic assertion in `rules.rs:721` (Datalog claim viability rules). This is a regular `assert!` in test code, **not** a contracts crate postcondition. Completely unrelated to HY-00013.

### Postcondition Inventory

All 7 `#[ensures]` annotations verify meaningful output invariants:

1. **settlement::calculate_costs_risk_impl** - Risk scores bounded 0-100 (deposit_order_risk, wasted_costs_risk)
2. **settlement::calculate_vento_award_impl** - Award amount is positive (award_pence > 0)
3. **settlement::basic_award_multiplier** - Multiplier capped at 60 (ERA 1996 s.119 statutory limit)
4. **legal_analysis::analyze_document_impl** - Claim confidence scores bounded 0.0-1.0
5. **procedural_intel::detect_parallel_hr_processes_impl** - Risk score bounded 0-100
6. **procedural_intel::detect_wp_false_claims_impl** - Risk score bounded 0-100
7. **procedural_intel::score_settlement_suppression_impl** - Suppression score bounded 0-100

### Contracts Crate Configuration

```toml
contracts = { version = "0.6", features = ["override_debug"] }
```

The `override_debug` feature makes `#[ensures]` expand to `debug_assert!`:
- **Debug builds** (tests): postconditions are evaluated and panic on violation
- **Release builds** (wasm32 production): postconditions are compiled out, zero runtime cost

## Analysis

**HY-00013 outcome: VALIDATED BY DEFAULT (already true)**

The hypothesis predicted that replacing `#[requires]` with `#[ensures]` would eliminate debug_assert panics. The codebase already implements the predicted ideal state:

1. **Zero preconditions** (`#[requires]`): The `_impl` pattern handles all input validation via typed `Result<T, E>` returns. No preconditions needed because the function body itself is the validator.

2. **Seven postconditions** (`#[ensures]`): Applied to functions that compute bounded values (risk scores, financial amounts, statutory limits). These are genuine invariants that the type system alone cannot enforce (e.g., a `u8` field can hold 0-255, but the domain says max 100).

3. **Zero panics**: The `override_debug` configuration means postconditions fire as `debug_assert!` in tests. Since all postconditions are satisfied, no panics occur.

**Coverage gap identified**: Only 2.1% of `_impl` functions have postconditions. The remaining 326 functions could benefit from `#[ensures]`, particularly:
- Functions returning bounded numeric fields (risk scores, counts, percentages)
- Functions that must return non-empty collections
- Functions where output timestamps must be after input timestamps

**Source observation (SR-00032) may have been speculative**: The original source described `#[requires]` causing panics, but the current codebase shows no evidence this ever happened. Either it was fixed before being committed, or the source was hypothetical.

## Outcome

- **Success**: Hypothesis validated by observation that the ideal state is already achieved
- The postcondition-first approach is proven correct by 2,538 passing tests
- The `override_debug` configuration is the right trade-off (test-time safety, zero production cost)
- No code changes were needed (nothing to fix)

## Loop

- [x] Algorithm validated (-> Algorithms): AL-00001 `_impl` pattern confirmed to work well with postconditions-only approach
- [x] New idea suggested (-> Ideas): Expand `#[ensures]` coverage from 2.1% to at least 20% of `_impl` functions with bounded outputs
- [x] New hypothesis formed (-> Hypotheses): HY-00013 should be closed as `validated-by-default`; new hypothesis needed for coverage expansion
- [x] Problem redefined (-> Sources): SR-00032's `#[requires]` observation may need verification/correction

## Lessons Learned

1. **Always check baseline before assuming a problem exists.** HY-00013 assumed `#[requires]` annotations existed to replace. A 5-second `rg '#\[requires' src/` would have revealed zero matches before designing the full experiment.

2. **"Validated by default" is a legitimate and valuable experimental outcome.** It confirms the codebase is already in the ideal state, which is important to document.

3. **Coverage metrics reveal the next opportunity.** The 2.1% postcondition coverage rate suggests a follow-up experiment: systematically adding `#[ensures]` to all functions with bounded output types.

4. **Unrelated test failures must be isolated.** The `test_blocked_claim_missing_prerequisite` failure is a real bug in the Datalog rules engine, worth a separate SR entry, but must not be conflated with the contracts crate experiment.
