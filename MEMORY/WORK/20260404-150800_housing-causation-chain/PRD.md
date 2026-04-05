---
task: Housing Crisis Causation Chain
slug: 20260404-150800_housing-causation-chain
effort: small
phase: complete
progress: 0/5
mode: dev-job
started: 2026-04-04T15:00:00Z
updated: 2026-04-04T15:00:00Z
ladder_refs: [HY-00059, ID-00080]
domain: legal-evidence
canisters: [case_timeline, legal_analysis]
---

## Context

The dismissal on 5 July 2024 triggered a cascade of financial consequences that culminated in homelessness. The causation chain is direct and documented: dismissal led to income loss, income loss led to rent arrears, rent arrears led to possession proceedings (case M00TA247), possession proceedings led to eviction on 16 February 2026, and eviction led to homelessness affecting the claimant and his family including a young child.

Each step in this chain satisfies the "but for" causation test -- but for the dismissal, none of the subsequent events would have occurred. The financial impact is cumulative and quantifiable at each milestone: lost earnings, accrued arrears, court costs, emergency accommodation costs, and ongoing housing instability. This chain is critical for the damages schedule and for establishing aggravated damages factors: the respondent's dismissal did not merely cause job loss, it caused the destruction of family housing stability, with particular impact on a child and on the exacerbation of the claimant's disability.

## Scope

- Define `CausationMilestone` type in `case_timeline` with date, event, financial impact, and causal linkage
- Implement cumulative damages quantification at each milestone in the chain
- Implement `CausationChain` as an ordered sequence of milestones with "but for" test validation at each step
- Define aggravated damages factors: family impact, child welfare, disability exacerbation
- Unit tests modelling the full chain from dismissal to homelessness with 8+ milestones and cumulative financial impact

## Acceptance Criteria

- [ ] ISC-1: CausationMilestone type with fields: date, event, financial_impact, evidence_ref, causal_link_to_dismissal
- [ ] ISC-2: DamagesQuantification computing cumulative financial impact at each milestone in the chain
- [ ] ISC-3: CausationChain as an ordered sequence of milestones with "but for" test validated at each step
- [ ] ISC-4: Aggravated damages factors enumerated: family_impact, child_welfare, disability_exacerbation with supporting evidence references
- [ ] ISC-5: Unit tests modelling full chain from dismissal (5 Jul 2024) to homelessness (16 Feb 2026) with 8+ milestones and cumulative GBP impact

## Dependencies

- `case_timeline` canister for chronological milestone storage and ordering
- `legal_analysis` canister for causation analysis and damages quantification
- `awen_types` for shared type definitions, Money type, and validation

## Evidence

- Dismissal letter / meeting record: 5 July 2024
- Payslips and employment contract: salary evidence for lost earnings calculation
- Rent arrears correspondence: landlord notices, payment demands
- Possession proceedings: case M00TA247, court documents
- Eviction: 16 February 2026, bailiff execution
- Disability evidence: impact on existing conditions
- Family composition: child welfare dimension
- Case reference: 6013156/2024

## Out of Scope

- Mitigation of loss analysis (separate damages schedule consideration)
- Alternative housing search evidence (reasonable steps to mitigate)
- Benefits calculations (Universal Credit, Housing Benefit interactions)
- Local authority homelessness application process
- Psychiatric injury claim (separate from aggravated damages factors)
