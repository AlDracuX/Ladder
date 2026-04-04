---
id: HY-00022
title: "Ascent Datalog role evaluation adds under 500K instructions per authorization check in evidence_vault"
status: draft
created: 2026-03-27
idea: ID-00023
tags: [authorization, datalog, ascent, performance, evidence-vault]
prediction: "Ascent Datalog role evaluation overhead is under 500K instructions per check"
metric: "IC instruction count delta between current boolean auth and Datalog auth per update call"
success_criteria: "Datalog auth adds < 500K instructions per authorization check (< 0.1% of 2B instruction limit)"
---

## Hypothesis

If we replace boolean `is_controller` checks in evidence_vault with Ascent Datalog role evaluation (`authorized(P, M) :- has_role(P, R), can_access(R, M)`), then the instruction overhead per authorization check will remain under 500K instructions (< 0.025% of the 2 billion instruction limit per update call).

## Rationale

ID-00023 proposes declarative RBAC via Ascent Datalog. The key risk is performance: Datalog evaluation involves relation joins that could be expensive in WASM. However, the authorization fact base is small (tens of roles, not millions of rows), so the join should be trivially fast. Ascent is already compiled into legal_analysis for claim rule evaluation (SR-00028), so the WASM size impact is amortized. The current boolean check is ~10 instructions — the question is whether Datalog's overhead is acceptable given the IC's instruction budget.

## Testing Plan

1. **Baseline**: Deploy evidence_vault to PocketIC, call `store_evidence` 100 times, measure average instruction count via `ic_cdk::api::performance_counter(0)` instrumentation
2. **Change**: Add Ascent to evidence_vault, define a 3-role policy (owner, solicitor, viewer), replace `is_controller` with Datalog evaluation
3. **After**: Re-run the same 100 `store_evidence` calls, measure instruction count
4. **Delta**: Compute per-call instruction overhead = (after - baseline) / 100

## Success Criteria

- Primary: Instruction overhead per auth check < 500,000 (0.025% of 2B limit)
- Secondary: No existing tests break after adding Datalog auth
- Secondary: WASM size increase < 100KB (Ascent may already be linked via legal_analysis)

## Risks

- Ascent may not compile cleanly for evidence_vault's WASM target if it has conditional dependencies
- PocketIC instruction counter may have measurement noise — need multiple runs and averaging
- Small fact base today, but if roles scale to thousands of principals, evaluation cost could change
