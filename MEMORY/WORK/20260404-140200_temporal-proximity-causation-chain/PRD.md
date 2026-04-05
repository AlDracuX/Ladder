---
task: Temporal Proximity Causation Chain
slug: 20260404-140200_temporal-proximity-causation-chain
effort: small
phase: complete
progress: 0/5
mode: dev-job
started: 2026-04-04T14:00:00Z
updated: 2026-04-04T14:00:00Z
ladder_refs: [HY-00045, ID-00059]
domain: legal-strategy
canisters: [case_timeline, legal_analysis]
---

## Context

The 48-hour chain from Code 1 disclosure to dismissal is one of the strongest causation indicators in employment law: Code 1 disclosure (3 Jul 2024 T+0) -> McDonnell email (4 Jul 2024 T+24h) -> Dismissal (5 Jul 2024 T+48h). When mapped at hour-level precision, the causation becomes self-evident -- each event follows the previous with no intervening explanation other than retaliation.

Temporal proximity is a well-established evidential tool in whistleblowing cases. The closer the adverse treatment to the protected disclosure, the stronger the inference of causation. A 48-hour window with documented escalation at each stage is forensically compelling. This feature provides structured hour-precision event chains with causal link annotation and temporal gap calculation.

## Scope

- Define `CausalEvent` and `CausalChain` types in `case_timeline`
- Implement hour-precision timestamp handling for event ordering
- Build query interface for retrieving causal chains by case and date range
- Create temporal gap calculator with legal significance annotation
- Unit test modelling the 3-5 Jul 2024 chain with all 4 key events

## Acceptance Criteria

- [ ] ISC-1: CausalEvent type with fields: timestamp (hour-precision), event_description, actor, evidence_ref, causal_significance
- [ ] ISC-2: CausalChain type: events ordered by timestamp, with causal_link description between consecutive events
- [ ] ISC-3: Query get_causal_chain(case_id, start_date, end_date) returns ordered chain of CausalEvents
- [ ] ISC-4: Temporal gap calculator: hours/days between events with legal_significance annotation
- [ ] ISC-5: Unit test modelling the 3-5 Jul 2024 chain with all 4 key events (Code 1 disclosure, McDonnell email, investigation meeting, dismissal)

## Dependencies

- `case_timeline` canister for event storage and chronological ordering
- `legal_analysis` canister for causal significance annotation types
- `awen_types` for shared type definitions and timestamp utilities

## Evidence

- Code 1 protected disclosure: 3 Jul 2024
- McDonnell email (escalation): 4 Jul 2024
- Dismissal: 5 Jul 2024
- Case reference: 6013156/2024

## Out of Scope

- Automated causation inference or legal reasoning
- Statistical analysis of temporal proximity patterns
- Visualization or charting of timelines (data structure only)
- Events outside the 3-5 Jul 2024 window (though the types are generic)
