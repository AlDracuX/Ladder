---
task: Multi-Stage Disciplinary Contradiction Detection
slug: 20260404-130700_stage-contradiction-detection
effort: medium
phase: complete
progress: 0/6
mode: dev-job
started: 2026-04-04T13:00:00Z
updated: 2026-04-04T13:00:00Z
ladder_refs: [ID-00039, HY-00022]
domain: legal-procedural
canisters: [procedural_intel, legal_analysis, awen_types]
---

## Context

Employment dismissals typically follow a multi-stage disciplinary process: investigation, disciplinary hearing, and appeal. Each stage is supposed to be independent -- the appeal should be a genuine rehearing, not a rubber stamp. The ACAS Code of Practice requires this independence.

In practice, contradictions between stages are common and legally significant. The investigation might find "no evidence of misconduct" but the disciplinary hearing concludes "gross misconduct." The disciplinary hearing might say "the claimant failed to attend meetings" but the appeal panel says "the claimant attended all required meetings." These contradictions prove procedural unfairness -- a key element in unfair dismissal claims.

The Bylor case has a 3-stage process (investigation by A. Barnes, disciplinary by R. Turley, appeal by S. Phillips) with contradictions across all three stages. The investigation found certain facts, the disciplinary hearing recharacterized those facts, and the appeal upheld the recharacterized version without addressing the contradictions.

This PRD provides structured types for capturing stage findings and a pure detection function that identifies contradictions between stages. The severity scoring helps prioritize which contradictions to lead with in cross-examination.

ID-00039 identified the pattern. HY-00022 hypothesized that automated stage contradiction detection would surface procedural unfairness arguments that manual review frequently misses when dealing with lengthy disciplinary packs.

## Scope

1. Define `StageFinding`, `DisciplinaryStage`, and `ContradictionEvent` types in `awen_types`
2. Implement `DisciplinaryStage` enum with transition validation
3. Build `detect_contradictions()` pure function in `procedural_intel`
4. Implement severity scoring (minor/moderate/critical)
5. Unit tests using real patterns from the Bylor 3-stage process

## Acceptance Criteria

- [ ] ISC-1: StageFinding type defined with fields: finding_id, case_id, stage (DisciplinaryStage), finding_text (String), date (ISO 8601), decision_maker (String), decision_maker_role (String), outcome (enum: NoAction, InformalWarning, FirstWrittenWarning, FinalWrittenWarning, Dismissal, DismissalUpheld, DismissalOverturned, Reinstated)
- [ ] ISC-2: DisciplinaryStage enum defined with variants: Investigation, Disciplinary, Appeal -- includes can_transition_to(next: DisciplinaryStage) validation that enforces the correct sequence (Investigation -> Disciplinary -> Appeal, no skipping, no reversal)
- [ ] ISC-3: ContradictionEvent type defined with fields: contradiction_id, case_id, stage_a (DisciplinaryStage), stage_b (DisciplinaryStage), finding_a (finding_id), finding_b (finding_id), contradiction_description (String), severity (enum: Minor, Moderate, Critical), detected_at (ISO 8601)
- [ ] ISC-4: detect_contradictions(findings: Vec<StageFinding>) -> Vec<ContradictionEvent> pure function implemented in procedural_intel that takes all findings for a case and returns detected contradictions -- no side effects, no canister state, fully unit-testable
- [ ] ISC-5: Severity scoring implemented: Minor (wording changes between stages that alter emphasis but not substance), Moderate (factual inconsistency where stages disagree on what happened), Critical (opposing conclusions where one stage finds for and another finds against on the same point)
- [ ] ISC-6: Unit tests covering real case patterns from the Bylor 3-stage process: (a) investigation finding contradicted by disciplinary conclusion, (b) disciplinary finding contradicted by appeal rationale, (c) all three stages making different claims about the same event, (d) valid process with no contradictions (negative test)

## Dependencies

None. This is a standalone detection module that feeds into PRD 7 (Case Narrative Evidence Graph) as a source of "contradicts" edges.

## Evidence

- **ID-00039**: Analysis of the Bylor disciplinary pack revealed contradictions across all three stages -- the investigation report, disciplinary outcome letter, and appeal outcome letter make conflicting factual claims about the same events
- **HY-00022**: Hypothesis that automated stage contradiction detection would surface procedural unfairness arguments in cases with lengthy disciplinary packs (50+ pages) where manual comparison between stages is error-prone and time-consuming

## Out of Scope

- Natural language processing for automatic finding extraction from documents -- findings are entered manually or via structured input
- Comparison of witness statements between stages -- this PRD focuses on the formal findings/conclusions at each stage
- Remedies calculation based on procedural unfairness -- separate from detection
- ACAS Code compliance scoring -- related but separate feature
- GoR paragraph rebuttal integration -- handled by PRD 5, which can consume ContradictionEvent data
