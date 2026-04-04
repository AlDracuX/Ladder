---
id: HY-00029
title: "Propagating AL-00002 saga idempotency to 5 remaining canisters reduces unguarded Call sites to zero"
status: draft
created: 2026-03-27
idea: ID-00002
tags: [idempotency, saga, cross-canister, propagation]
prediction: "After applying AL-00002 pattern to evidence_vault, mcp_gateway, legal_analysis, procedural_intel, and case_hub, the count of Call::bounded_wait sites without idempotency keys drops from 23 to 0"
metric: "Number of Call::bounded_wait call sites lacking IdempotencyKey parameter across all 9 canisters"
success_criteria: "grep -r 'Call::bounded_wait' src/ returns 0 sites without corresponding idempotency key check; replay tests pass for all 5 canisters"
---

## Hypothesis

If we apply the AL-00002 saga + idempotency pattern (already proven in case_timeline and deadline_alerts) to the 5 remaining canisters (evidence_vault, mcp_gateway, legal_analysis, procedural_intel, case_hub), then the number of unguarded inter-canister Call::bounded_wait sites drops from 23 to 0, and replaying any inter-canister request with the same idempotency key produces zero duplicate state mutations.

## Rationale

The codebase currently has 23 Call::bounded_wait sites across 9 files. case_timeline and deadline_alerts already use the AL-00002 saga pattern with idempotency keys. The remaining 5 canisters (evidence_vault: 1 site, mcp_gateway: 2 sites, legal_analysis: 10 sites, procedural_intel: 2 sites, case_hub: 3 sites) lack idempotency protection. This is propagation of a proven pattern, not invention -- feasibility is high (9/10) because the pattern and IdempotencyKey type already exist in awen_types::idempotency.

## Testing Plan

1. Baseline: count all Call::bounded_wait sites without IdempotencyKey in scope (expect ~18 unguarded)
2. For each canister, add IdempotencyKey parameter to every inter-canister call site
3. Write replay tests per canister: call 3x with same key, assert state changes exactly once
4. Run `mise run nextest` to verify zero regressions
5. Re-count unguarded sites (expect 0)

## Success Criteria

- Zero Call::bounded_wait sites without idempotency key in any canister
- Replay test (same key 3x = 1x state change) passes for all 5 newly-guarded canisters
- No regression in existing test suites across all 9 canisters
- Stable memory footprint increase under 1KB per idempotency key store

## Risks

- legal_analysis has 10 call sites -- some may be read-only queries that don't need idempotency
- IdempotencyKey storage in stable memory adds per-canister overhead; need TTL/cleanup strategy
- Some call patterns may be intentionally non-idempotent (e.g., append-only logs)
