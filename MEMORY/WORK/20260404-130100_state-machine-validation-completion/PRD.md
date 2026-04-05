---
task: State Machine Validation Completion across all 9 canisters
slug: 20260404-130100_state-machine-validation-completion
effort: medium
phase: complete
progress: 0/6
mode: dev-job
started: 2026-04-04T13:01:00Z
updated: 2026-04-04T13:01:00Z
ladder_refs: [RE-00013, AL-00003]
domain: dev
canisters: [evidence_vault, case_timeline, deadline_alerts, reference_shield, mcp_gateway, legal_analysis, procedural_intel, case_hub, settlement]
---

## Context

RE-00013 proved the can_transition_to pattern across 7 canisters and caught a P0 bug in ComplaintStatus where an invalid transition was silently accepted. The pattern uses exhaustive match arms (no wildcard `_`) so the compiler forces developers to handle every new status variant explicitly. This is a proven defense against state corruption bugs.

However, audit revealed that some status enums still lack exhaustive validation. Not every canister has complete coverage, and there is no CI gate to catch new status enums added without can_transition_to methods. This PRD completes the pattern across all 9 canisters and adds tooling to prevent regression.

## Scope

- Audit every status enum across all 9 canisters for can_transition_to coverage
- Implement can_transition_to for any status enum currently missing it
- Replace all wildcard `_` match arms in transition methods with exhaustive variants
- Ensure all invalid transitions return typed errors (never panic)
- Write unit tests for every valid and every invalid transition path per enum
- Write integration tests verifying cross-canister status consistency (e.g., case_hub status reflects child canister states)
- Add a CI lint (clippy custom lint or script) that detects new status enums without can_transition_to

## Acceptance Criteria

- [ ] ISC-1: Every status enum in every canister has can_transition_to method
- [ ] ISC-2: All transition methods use exhaustive match (no wildcard _)
- [ ] ISC-3: Invalid transitions return typed error (not panic)
- [ ] ISC-4: Unit tests for every valid and invalid transition path
- [ ] ISC-5: Integration tests verify cross-canister status consistency
- [ ] ISC-6: CI lint detects new status enums missing can_transition_to

## Dependencies

- No blocking dependencies from other PRDs
- Requires knowledge of all status enums across the workspace (discoverable via grep/indxr)

## Evidence

- **RE-00013**: can_transition_to pattern deployed across 7 canisters. Caught ComplaintStatus P0 bug where `Submitted -> Archived` transition was silently accepted, bypassing the required `Reviewed` state. Exhaustive matching prevented the same class of bug from recurring.
- **AL-00003**: Algorithm that designed the state machine validation approach

## Out of Scope

- Adding new status variants to any enum
- Changing the actual valid transition paths (business logic stays the same)
- State machine visualization tooling
- Runtime state machine introspection APIs
- Saga/compensation patterns for failed cross-canister transitions (covered by AuthContext PRD)
