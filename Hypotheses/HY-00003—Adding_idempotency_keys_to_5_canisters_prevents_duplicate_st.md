---
id: HY-00003
title: "Adding idempotency keys to 5 canisters prevents duplicate state mutations on retry"
status: draft
created: 2026-03-22
idea: ID-00001
tags: []
prediction: "Adding idempotency keys to 5 canisters makes replayed calls produce zero duplicate state mutations"
metric: "Duplicate state entries after inter-canister call retry with same key"
success_criteria: "Replay test: same key 3x = state changes exactly once, per canister"
---

## Hypothesis

If we add idempotency keys (awen_types::idempotency) to all Call:: sites in evidence_vault, mcp_gateway, legal_analysis, procedural_intel, and case_hub, then replaying the same request produces zero duplicate state mutations.

## Rationale

5 canisters make inter-canister calls without idempotency (AL-00002 pattern). Already proven in case_timeline and deadline_alerts. Applying to remaining 5 prevents async retry duplicates.

## Testing Plan

1. Identify all Call:: sites in each canister
2. Add IdempotencyKey parameter + check/record/cleanup lifecycle
3. Write replay tests: call 3x with same key, verify 1x state change
4. Run nextest across all 5 packages

## Success Criteria

- All 5 canisters have IdempotencyKey on every inter-canister call
- Replay tests pass for each canister
- No regression in existing tests

## Risks

- Some calls may be intentionally non-idempotent
- Key storage adds stable memory footprint
