---
id: AL-00011
title: "Exhaustive can_transition_to validation on status enums preventing invalid state changes"
status: complete
created: 2026-03-24
domain: architecture
tags: [state-machine, transitions, enums, validation, lifecycle]
experiments: [EX-00010]
complexity: medium
---

## Description

An exhaustive `can_transition_to(&self, target) -> bool` method on every status enum that represents a lifecycle state. Uses Rust's `match` exhaustiveness checking to guarantee all source states are handled, and `matches!` macro to declare valid targets. Called before every status mutation to prevent invalid state changes at runtime. Terminal states return `false` unconditionally.

Chain: EX-00010 -> HY-00007 -> ID-00005 -> SR-00003

## Method

1. **Identify all status enums** in the codebase that represent lifecycle state. In Awen Network, these are:

| Enum | Canister | States |
|------|----------|--------|
| `OfferStatus` | settlement | Pending, Accepted, Rejected, Countered, Withdrawn, Expired |
| `NegotiationStatus` | settlement | Active, Settled, Collapsed, Paused |
| `DeadlineStatus` | deadline_alerts | Active, Extended, Missed, Completed |
| `KeyStatus` | evidence_vault | Active, Rotating, Expired |
| `DisclosureStatus` | evidence_vault | Active, Revoked |
| `FactStatus` | case_timeline | Proposed, Accepted, Disputed, Withdrawn |
| `ComplaintStatus` | procedural_intel | Draft, ReadyToSubmit, Submitted, Acknowledged, UnderInvestigation, AwaitingResponse, Escalated, Resolved, Closed |
| `RequestStatus` | mcp_gateway | (various) |

2. **Add the method** to each enum following this pattern:

```rust
impl OfferStatus {
    /// Valid transitions:
    /// - Pending -> Accepted, Rejected, Countered, Withdrawn, Expired
    /// - Countered -> Accepted, Rejected, Withdrawn, Expired
    /// - Accepted, Rejected, Withdrawn, Expired are terminal
    #[must_use]
    pub fn can_transition_to(&self, target: &OfferStatus) -> bool {
        match self {
            OfferStatus::Pending => matches!(
                target,
                OfferStatus::Accepted
                    | OfferStatus::Rejected
                    | OfferStatus::Countered
                    | OfferStatus::Withdrawn
                    | OfferStatus::Expired
            ),
            OfferStatus::Countered => matches!(
                target,
                OfferStatus::Accepted
                    | OfferStatus::Rejected
                    | OfferStatus::Withdrawn
                    | OfferStatus::Expired
            ),
            OfferStatus::Accepted
            | OfferStatus::Rejected
            | OfferStatus::Withdrawn
            | OfferStatus::Expired => false,
        }
    }
}
```

3. **Key implementation rules**:
   - Use `match self` (not `if/else`) so the compiler forces handling of new variants
   - Terminal states always return `false`
   - Document valid transitions in a doc comment above the method
   - Mark with `#[must_use]` to prevent ignoring the return value

4. **Call before every status mutation** in `_impl` functions:

```rust
if !offer.status.can_transition_to(&new_status) {
    return Err(SettlementError::InvalidState {
        message: format!("Cannot transition from {:?} to {:?}", offer.status, new_status),
    });
}
offer.status = new_status;
```

5. **Write tests** for both valid and invalid transitions — especially terminal states attempting to transition.

## When to Use

- Any enum representing lifecycle state (case status, evidence status, offer status, deadline status, complaint status)
- Any status field that gets mutated by update endpoints
- New canisters being added to the workspace — add `can_transition_to` from the start
- Anywhere a `status = new_status` assignment exists without validation

## When NOT to Use

- Enums that are not lifecycle states (e.g., `AlertPriority`, `ClaimType`, `EvidenceCategory` — these are classification, not state machines)
- Enums with only 1-2 variants where transitions are trivial
- Read-only status fields that are computed, not mutated

## Inputs

- `&self` — current status (the "from" state)
- `&Self` — target status (the "to" state)

## Outputs

- `bool` — `true` if the transition is valid, `false` otherwise

## Limitations

- Boolean return only — does not explain *why* a transition is invalid (callers must construct their own error messages)
- No transition side effects — this is purely validation; the caller must still perform the actual state change
- The transition rules are encoded in code, not in a declarative state machine DSL — adding a new variant requires updating the match arms manually
- Does not enforce ordering of concurrent transitions (two simultaneous calls could both pass validation but create conflicting states — mitigated by stable storage's single-writer model on IC)
- No history tracking — only validates the immediate transition, not whether the full path is valid

## Evidence

- **EX-00010**: Added `can_transition_to` to 6 status enums across 7 canisters. 213 lines of code. Workspace compiles clean.
- **RE-00013**: PASSED — all 6 enums have exhaustive transition validation. Terminal states verified to reject all transitions.
- Source files:
  - `src/settlement/src/lib.rs` (OfferStatus, NegotiationStatus)
  - `src/deadline_alerts/src/lib.rs` (DeadlineStatus)
  - `src/evidence_vault/src/lib.rs` (KeyStatus, DisclosureStatus)
  - `src/case_timeline/src/lib.rs` (FactStatus)
  - `src/procedural_intel/src/lib.rs` (ComplaintStatus)
  - `src/mcp_gateway/src/lib.rs` (RequestStatus)
