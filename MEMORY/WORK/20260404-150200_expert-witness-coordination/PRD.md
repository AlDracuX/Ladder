---
task: Expert Witness Coordination Dashboard
slug: 20260404-150200_expert-witness-coordination
effort: medium
phase: complete
progress: 0/6
mode: dev-job
started: 2026-04-04T15:00:00Z
updated: 2026-04-04T15:00:00Z
ladder_refs: [HY-00053, ID-00074]
domain: legal-evidence
canisters: [case_hub, legal_analysis, procedural_intel]
---

## Context

7 expert briefs across domains: ADHD workplace, employment law, nuclear safety, psychiatry, safety culture, regulatory capture, and disaster patterns. Each expert maps to specific claim elements (s103A ERA 1996 protected disclosure, s47B detriment, s15 EqA 2010 discrimination arising from disability). Need coordinated instruction sequencing to ensure all experts are instructed, reports received, and claim element coverage gaps identified before the Jul 6-10 final hearing. Impact score: 90.

## Scope

Build types and coordination logic within `case_hub`, `legal_analysis`, and `procedural_intel` canisters to:

1. Model expert briefs with lifecycle status tracking
2. Map experts to claim elements with strength contributions
3. Determine optimal instruction sequencing
4. Detect claim element coverage gaps
5. Calculate hearing readiness scores

## Acceptance Criteria

- [ ] ISC-1: ExpertBrief type -- expert_id (u64), expert_name (String), domain (ExpertDomain enum: AdhdWorkplace/EmploymentLaw/NuclearSafety/Psychiatry/SafetyCulture/RegulatoryCapture/DisasterPatterns), claim_elements_covered (Vec<ClaimElementId>), status (Drafted/Instructed/ReportReceived/Available), instruction_date (Option<u64>), report_deadline (Option<u64>)
- [ ] ISC-2: ClaimElementMapping -- expert_id to claim_element_ids with strength_contribution (f64 0.0-1.0), struct ClaimElementCoverage containing claim_element_id, description, statutory_basis (String), experts (Vec<ExpertContribution>), overall_strength (f64)
- [ ] ISC-3: InstructionSequence -- ordered list of experts with optimal instruction timing, considering dependencies between experts (e.g., psychiatry before ADHD workplace), deadline constraints, and report turnaround estimates, returned as Vec<InstructionStep> with expert_id, recommended_date, rationale, dependencies
- [ ] ISC-4: Coverage gap detector -- identifies claim elements without expert support or with weak coverage (overall_strength below threshold), returns Vec<CoverageGap> with claim_element_id, current_strength, gap_description, suggested_expert_domain
- [ ] ISC-5: Hearing readiness score -- percentage of experts with final reports (Available status), weighted by claim element importance, returned as HearingReadiness struct with overall_percentage, per_expert_status, critical_gaps (claim elements below 0.5 strength)
- [ ] ISC-6: Unit test -- model all 7 experts mapped to s103A, s47B, s15 claim elements, verify coverage gap detection finds unserved elements, verify instruction sequencing respects dependencies, verify readiness score calculation

## Dependencies

- Expert brief documents (7 briefs across domains)
- Claim element definitions (s103A, s47B, s15 and sub-elements)
- Final hearing date: Jul 6-10 2026 (deadline anchor)

## Evidence

- ADHD workplace expert brief
- Employment law expert brief
- Nuclear safety expert brief
- Psychiatry expert brief
- Safety culture expert brief
- Regulatory capture expert brief
- Disaster patterns expert brief
- Claim elements from ET1 and amended grounds

## Out of Scope

- Expert fee management or budget tracking
- Communication drafting (instruction letters)
- Calendar integration for scheduling
- Frontend dashboard UI (types and logic only)
- Expert discovery or recommendation
