---
id: EX-00010
title: "Audit all status enums for can_transition_to and add missing implementations"
status: testing
created: 2026-03-23
hypothesis: HY-00007
algorithm: ""
tags: [state-machine, transition-validation, audit]
methodology: "Exhaustive grep + manual audit + implementation"
duration: "1 session"
success_criteria: "All lifecycle status enums have can_transition_to(); all mutation sites enforce it"
---

## Objective

Test HY-00007 by systematically adding `can_transition_to()` to every lifecycle status enum that lacks it, and enforcing the check at every mutation site. Measure: how many enums were unguarded, how many mutation sites were unprotected.

## Methodology

1. Grep all `enum.*Status` definitions in src/ and packages/
2. Classify each as LIFECYCLE (has ordered states, terminal states) vs CLASSIFICATION (unordered categories)
3. For each LIFECYCLE enum without `can_transition_to()`, add the method
4. For each `_impl` function that sets `.status =` on a lifecycle enum, verify it calls `can_transition_to()` first
5. Add unit tests for each new `can_transition_to()` implementation
6. Run `cargo check --workspace` and `cargo nextest run`

## Setup

- Workspace: /mnt/media_backup/PROJECTS/awen-network-canisters
- CARGO_TARGET_DIR: /mnt/media_backup/cargo-target
- Tools: rg, cargo, cargo-nextest

## Algorithm

Pattern: For each status enum, define a match-based `can_transition_to(&self, target: &Self) -> bool` that returns true only for valid transitions. Terminal states return false for all targets.

## Success Criteria

- 100% of lifecycle status enums have can_transition_to()
- All mutation sites for lifecycle enums call can_transition_to()
- All unit tests pass
- cargo check --workspace clean

## Data Collection

### Status Enum Audit

| Enum | Location | Type | Has can_transition_to | Mutation Sites | Guarded |
|------|----------|------|----------------------|----------------|---------|
| KeyStatus | evidence_vault | LIFECYCLE | NO | 1 (rotate_keys) | NO |
| FitnessStatus | evidence_vault | CLASSIFICATION | N/A | 0 | N/A |
| DisclosureStatus | evidence_vault | LIFECYCLE | NO | 0 direct | N/A |
| AudioConsentStatus | evidence_vault | CLASSIFICATION | N/A | 0 | N/A |
| DeadlineStatus | deadline_alerts | LIFECYCLE | YES | 2 | YES |
| ListingStatus | deadline_alerts | LIFECYCLE | NO | 1 (update_hearing) | NO |
| OfferStatus | settlement | LIFECYCLE | YES | 1 | YES |
| NegotiationStatus | settlement | LIFECYCLE | NO | 1 (settle) | NO |
| ComplaintStatus | procedural_intel | LIFECYCLE | YES | 2 | YES |
| SequenceStatus | procedural_intel | LIFECYCLE | NO | 3 (advance_step) | NO |
| DisclosureRoundStatus | procedural_intel | LIFECYCLE | NO | 1 (advance_round) | NO |
| RequestStatus | mcp_gateway | LIFECYCLE | NO | 1 (process_tool) | NO |
| CredentialStatus | reference_shield | LIFECYCLE | NO | 2 (revoke, expire) | NO |
| FactStatus | case_timeline | LIFECYCLE | YES | 1 | YES |
| FormStatus | legal_analysis | LIFECYCLE | NO | 0 direct | N/A |
| SagaStatus (awen_types) | packages | SAGA | N/A (saga) | multiple | N/A |
| SagaStatus (saga.rs) | packages | SAGA | N/A (saga) | 0 | N/A |
| StepStatus (saga.rs) | packages | SAGA | N/A (saga) | 0 | N/A |
| ResponseStatus (comm.rs) | packages | CLASSIFICATION | N/A | 0 | N/A |
| ListingStatus (awen_types) | packages | LIFECYCLE | NO | 0 direct | N/A |
| FactStatus (awen_types) | packages | LIFECYCLE | already in canister | 0 | N/A |
| CaseStage | packages | LIFECYCLE | YES (free fn) | via case_hub | YES |

**Summary:** 8 lifecycle enums need can_transition_to(). 6 mutation sites need guards.

## Results

(Fill in after running)

## Analysis

(Fill in after running)

## Next Steps

(Fill in after running)
