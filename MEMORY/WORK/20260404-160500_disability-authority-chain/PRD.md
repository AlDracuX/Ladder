---
task: Disability Discrimination Authority Chain
slug: 20260404-160500_disability-authority-chain
effort: small
phase: ready
progress: 0/5
mode: dev-job
started: 2026-04-04T16:05:00Z
updated: 2026-04-04T16:05:00Z
ladder_refs: [HY-00066, ID-00098]
domain: legal-precedent
canisters: [legal_analysis]
---

## Context

The s15 Equality Act 2010 discrimination arising from disability claim requires a sequential chain of authorities applied to the ADHD workplace facts. City of York Council v Grosset establishes the "arising from" connection between disability and unfavourable treatment. Grosset v Aplin addresses employer knowledge requirements. Pnaiser v NHS England and Anor establishes the burden of proof framework. Applied in sequence, these authorities build the complete s15 claim: (1) unfavourable treatment (dismissal) arose from something (executive dysfunction) arising from disability (ADHD), (2) the employer had actual or constructive knowledge of the disability (conceded 30 April 2025), and (3) the burden of proof shifts once the claimant establishes a prima facie case. This PRD structures these authorities into a sequential chain with fact pattern matching and burden of proof tracking.

## Scope

- Define AuthorityChain type sequencing authorities with per-authority ratio and application
- Define FactPattern type mapping disability discrimination elements to case facts
- Implement BurdenOfProof tracker modelling the shifting burden through claim stages
- Create ReasonableAdjustments checklist for adjustments not offered despite known disability
- Unit tests applying the York Council to Grosset to Pnaiser chain to ADHD dismissal facts

## Acceptance Criteria

- [ ] ISC-1: AuthorityChain type with fields: authorities in sequence (Vec with order), each containing ratio (String) and case_specific_application (String)
- [ ] ISC-2: FactPattern type with fields: disability (ADHD), unfavourable_treatment (dismissal), arising_from (executive dysfunction), knowledge (conceded 30 Apr 2025, knowledge_type enum: actual/constructive)
- [ ] ISC-3: BurdenOfProof tracker modelling stages: claimant_prima_facie (bool) -> burden_shifts (bool) -> respondent_justification_assessment (String)
- [ ] ISC-4: ReasonableAdjustments checklist: list of adjustments not offered despite known disability, each with adjustment_type, statutory_basis, and offered (bool)
- [ ] ISC-5: Unit test applying York Council -> Grosset -> Pnaiser chain to ADHD dismissal facts with knowledge conceded 30 April 2025

## Dependencies

- legal_analysis canister stable storage for new types
- CaseLawEntry type (may be shared with PRD 32/33 -- can define locally if not yet available)

## Evidence

- **HY-00066**: Hypothesis that sequential authority chaining strengthens s15 EA 2010 claims
- **ID-00098**: Idea for disability discrimination authority chain with impact score 85
- City of York Council v Grosset [2018] EWCA Civ 1105 -- "arising from" test
- Grosset v Aplin [2018] -- employer knowledge requirement (same case, knowledge aspect)
- Pnaiser v NHS England and Anor [2016] IRLR 170 EAT -- burden of proof in s15 claims
- Respondent concession of knowledge dated 30 April 2025

## Out of Scope

- s13 EA 2010 direct discrimination claims (separate legal test)
- s20/21 EA 2010 reasonable adjustments as standalone claim (checklist here is supporting evidence only)
- Remedy or compensation calculations for discrimination
- Comparator analysis (not required for s15 claims)
- Frontend display of authority chains
