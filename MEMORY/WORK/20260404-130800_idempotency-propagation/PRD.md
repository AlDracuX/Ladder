---
task: Idempotency Propagation to 5 Canisters
slug: 20260404-130800_idempotency-propagation
effort: large
phase: ready
progress: 0/8
mode: dev-job
started: 2026-04-04T13:00:00Z
updated: 2026-04-04T13:00:00Z
ladder_refs: [ID-00002, AL-00002, HY-00003]
domain: dev
canisters: [evidence_vault, mcp_gateway, legal_analysis, procedural_intel, case_hub]
---

## Context

ID-00002. The saga pattern for idempotent cross-canister operations has been proven in case_timeline and deadline_alerts via AL-00002. Both canisters now use IdempotencyKey from awen_types::idempotency with StableBTreeMap-backed saga state tracking, TTL cleanup, and compensation logic. The pattern works: retried calls return identical results, failed multi-canister operations roll back cleanly, and memory does not leak thanks to configurable TTL expiry.

Five canisters still operate without idempotency protection on their cross-canister state changes: evidence_vault, mcp_gateway, legal_analysis, procedural_intel, and case_hub. Each performs inter-canister calls that mutate state -- if those calls fail mid-flight or get retried, the current code can produce duplicate state, orphaned records, or inconsistent cross-canister views. This is the single largest remaining correctness gap in the canister architecture.

## Scope

- Add IdempotencyKey and SagaState tracking to all cross-canister state-modifying operations in the 5 target canisters
- Implement saga compensation logic for each multi-canister operation (rollback on partial failure)
- Add TTL-based cleanup timers to prevent unbounded memory growth from completed saga records
- Ensure all operations are replay-safe: same idempotency key always returns the same result
- Write unit tests for both happy path and compensation path per canister
- Write integration tests that simulate inter-canister call failure and verify compensation executes
- Document which operations in each canister are idempotent and what their compensation strategies are

## Acceptance Criteria

- [ ] ISC-1: IdempotencyKey struct from awen_types::idempotency used in all cross-canister state changes
- [ ] ISC-2: Each canister has StableBTreeMap<IdempotencyKey, SagaState> for tracking
- [ ] ISC-3: Saga compensation logic for each multi-canister operation
- [ ] ISC-4: TTL cleanup timer to prevent memory leakage (configurable, default 24h)
- [ ] ISC-5: Retry-safe -- same idempotency key returns same result on replay
- [ ] ISC-6: Unit tests for saga happy path and compensation path per canister
- [ ] ISC-7: Integration test -- simulate inter-canister call failure, verify compensation executes
- [ ] ISC-8: Documentation of idempotent operations per canister

## Dependencies

- PRD 2 (state machine validation must be complete first -- saga needs valid state transitions)
- IdempotencyKey and SagaState types in awen_types::idempotency (already available)
- Proven pattern from case_timeline + deadline_alerts (AL-00002)

## Evidence

- **ID-00002**: Idempotency gap identified across canister architecture
- **AL-00002**: Saga pattern algorithm proven in case_timeline and deadline_alerts
- **HY-00003**: Hypothesis that saga-based idempotency eliminates cross-canister inconsistency

## Out of Scope

- case_timeline (already has idempotency via AL-00002)
- deadline_alerts (already has idempotency via AL-00002)
- settlement canister (not included in this propagation wave)
- reference_shield (no cross-canister state mutations requiring saga)
- Changes to the IdempotencyKey or SagaState types in awen_types
- Distributed transaction coordination beyond pairwise saga compensation
