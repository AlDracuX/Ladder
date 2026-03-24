---
id: EX-00003
title: "Replace all requires with ensures annotations across 5 canisters"
status: complete
created: 2026-03-24
hypothesis: HY-00013
algorithm: AL-00001
tags: [contracts, design-by-contract, postcondition, testing, _impl, ensures, requires]
methodology: "Baseline audit of #[requires] and #[ensures] across all src/ canisters, followed by test suite execution to verify zero debug_assert panics"
duration: "15 minutes"
success_criteria: "Zero #[requires] annotations remain; at least 5 #[ensures] postconditions exist; cargo nextest run passes with zero contract-related panics"
---

## Objective

Test HY-00013: whether replacing all `#[requires]` precondition annotations with `#[ensures]` postcondition annotations on `_impl` functions eliminates all `debug_assert` panics from the `contracts` crate while adding valuable postcondition coverage.

## Methodology

1. **Baseline audit**: `rg '#\[requires' src/ --count` to count all precondition annotations
2. **Ensures audit**: `rg '#\[ensures' src/ --count` to count existing postcondition annotations
3. **Debug assert audit**: `rg 'debug_assert' src/` to find any manual debug_assert calls
4. **Test baseline**: `cargo nextest run --no-fail-fast` to capture current pass/fail state and any contract-related panics
5. **Contracts crate config**: Verify `contracts = { version = "0.6", features = ["override_debug"] }` in workspace Cargo.toml
6. **Per-function review**: For each existing `#[ensures]`, verify the postcondition is meaningful and the function performs its own input validation (the `_impl` pattern from AL-00001)
7. **Identify gaps**: Check which `_impl` functions lack postconditions that could benefit from `#[ensures]`

## Setup

- Workspace: `/mnt/media_backup/PROJECTS/awen-network-canisters`
- Contracts crate: `contracts v0.6.7` with `override_debug` feature (expands to `debug_assert!` instead of `assert!`)
- Test runner: `cargo nextest run` (workspace-wide)
- Canisters using contracts: `settlement`, `procedural_intel`, `legal_analysis` (3 of 9)

## Algorithm

The `_impl` pattern (AL-00001) separates IC glue from business logic:
- `#[update]` functions handle IC-specific concerns (caller auth, etc.)
- `*_impl` functions contain pure business logic with typed error returns
- `#[requires]` on `_impl` functions would duplicate the input validation already done via `Err(...)` returns
- `#[ensures]` on `_impl` functions adds value by verifying output invariants (e.g., risk_score <= 100, award_pence > 0)

## Success Criteria

1. Zero `#[requires]` annotations in `src/` (already achieved)
2. At least 5 meaningful `#[ensures]` postconditions present
3. `cargo nextest run` passes with zero panics from contracts debug_assert
4. Each `#[ensures]` postcondition verifies a meaningful output invariant

## Data Collection

### Baseline Measurements (2026-03-24)

**#[requires] count: 0** (zero across all src/ canisters)

**#[ensures] count: 7** across 3 canisters:

| Canister | Function | Postcondition |
|----------|----------|---------------|
| settlement | `calculate_costs_risk_impl` | `ret.as_ref().map_or(true, \|v\| v.deposit_order_risk <= 100 && v.wasted_costs_risk <= 100)` |
| settlement | `calculate_vento_award_impl` | `ret.as_ref().map_or(true, \|v\| v.award_pence > 0)` |
| settlement | `basic_award_multiplier` | `ret <= 60, "max 20 years * 1.5 weeks (3 half-weeks) = 60"` |
| legal_analysis | `analyze_document_impl` | `ret.claim_scores.iter().all(\|(_, s)\| *s >= 0.0 && *s <= 1.0)` |
| procedural_intel | `detect_parallel_hr_processes_impl` | `ret.as_ref().map_or(true, \|v\| v.risk_score <= 100)` |
| procedural_intel | `detect_wp_false_claims_impl` | `ret.as_ref().map_or(true, \|v\| v.risk_score <= 100)` |
| procedural_intel | `score_settlement_suppression_impl` | `ret.as_ref().map_or(true, \|v\| v.score <= 100)` |

**debug_assert count in canister workspace: 0** (one exists in awen-mcp, outside workspace)

**Canisters using contracts crate: 3** (settlement, procedural_intel, legal_analysis)

**Canisters NOT using contracts: 6** (evidence_vault, case_timeline, deadline_alerts, reference_shield, mcp_gateway, case_hub)

## Results

**HYPOTHESIS PREMISE IS FALSE**: There are zero `#[requires]` annotations to replace. The codebase was built postcondition-first from the beginning, or any `#[requires]` were already removed in a prior refactoring.

**However, the predicted ideal state IS already achieved:**
- Zero `debug_assert` panics from contracts in the test suite
- 7 meaningful `#[ensures]` postconditions in place
- All postconditions verify output invariants (bounded scores, positive values, capped multipliers)
- The `_impl` pattern handles input validation via typed errors, not precondition panics

## Analysis

HY-00013 hypothesized that `#[requires]` preconditions on `_impl` functions were causing `debug_assert` panics because they duplicated the input validation already present in the function bodies. The hypothesis predicted that replacing them with `#[ensures]` postconditions would eliminate panics while adding value.

**Finding**: The codebase already embodies this ideal state. The `contracts` crate is used exclusively for postconditions (`#[ensures]`), never for preconditions (`#[requires]`). This suggests either:
1. The design-by-contract approach was postcondition-first from inception
2. A prior refactoring (possibly the work that generated SR-00032) already completed this migration
3. The hypothesis was generated from a source observation that described a potential problem, not an actual one

The `override_debug` feature configuration is appropriate: postconditions expand to `debug_assert!` which fires in test builds (debug mode) but is compiled out in release (wasm32 production) builds. This means:
- Tests catch postcondition violations during development
- Production canisters pay zero runtime cost

**Postcondition quality**: All 7 existing `#[ensures]` annotations are meaningful:
- Bounded risk scores (0-100 range) prevent UI display issues and downstream calculation overflow
- Positive award amounts prevent nonsensical zero/negative financial calculations
- Capped multipliers enforce statutory limits (ERA 1996 s.119)
- Claim score bounds (0.0-1.0) maintain normalized confidence values

## Next Steps

1. **Close HY-00013** as `validated-by-default` (ideal state already achieved)
2. **New hypothesis**: Consider HY for expanding `#[ensures]` coverage to the 6 canisters not yet using the contracts crate
3. **Source entry**: Create SR documenting the postcondition-first pattern as a validated AL pattern
4. **Algorithm update**: Update AL-00001 to explicitly recommend `#[ensures]` on `_impl` functions with bounded output types
