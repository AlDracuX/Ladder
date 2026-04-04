---
id: HY-00026
title: "Datalog state transition rules add under 50KB to WASM and evaluate within 100K instructions per check"
status: draft
created: 2026-03-27
idea: ID-00046
tags: [datalog, ascent, state-machine, wasm-size, performance]
prediction: "Datalog transition rules add < 50KB WASM and evaluate in < 100K instructions"
metric: "WASM size delta (bytes) and instruction count per can_transition_to check"
success_criteria: "WASM size increase < 50KB AND per-check instruction count < 100K"
---

## Hypothesis

If we replace hardcoded `can_transition_to` match arms in case_hub with Ascent Datalog transition rules (`transition(Active, Settled, true).`), then the WASM size increase will be under 50KB and each transition validity check will evaluate within 100K instructions.

## Rationale

ID-00046 proposes declarative state transition rules via Ascent Datalog (SR-00028), replacing the hardcoded match arms validated by AL-00011/EX-00010. The hardcoded approach works but doesn't scale — each new status variant requires updating every match. Datalog makes transitions data-driven. The key unknowns are WASM bloat (Ascent's code generation) and per-query cost (Datalog joins for a small fact base). 50KB is ~2.5% of a typical canister WASM (~2MB). 100K instructions is 0.005% of the 2B budget — negligible.

## Testing Plan

1. **Baseline**: Build case_hub WASM, record size via `wasm-opt --print-size`. Instrument `can_transition_to` with performance counter, measure per-call instructions over 100 calls.
2. **Change**: Add Ascent dependency to case_hub. Encode CaseStatus transitions as Datalog relations. Replace match arm with Ascent query.
3. **After**: Rebuild WASM, measure size. Re-run instrumented can_transition_to, measure instructions.
4. **Delta**: WASM size delta and instruction count per call.

## Success Criteria

- Primary: WASM size increase < 50KB
- Primary: Per-check instruction count < 100,000
- Secondary: All existing `can_transition_to` tests pass without modification
- Secondary: Adding a new transition requires only adding a Datalog fact, not editing match arms

## Risks

- Ascent's proc macros may generate significant boilerplate code, exceeding 50KB even for simple rules
- If Ascent is already linked via legal_analysis (shared workspace), the marginal WASM cost may be near-zero — or it may double if each canister gets its own copy
- Instruction measurement in PocketIC may differ from mainnet due to metering differences
