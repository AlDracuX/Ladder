---
task: Grounds of Resistance Paragraph Rebuttal Tracker
slug: 20260404-130400_gor-rebuttal-tracker
effort: medium
phase: complete
progress: 0/7
mode: dev-job
started: 2026-04-04T13:00:00Z
updated: 2026-04-04T13:00:00Z
ladder_refs: [ID-00035, HY-00019]
domain: legal-evidence
canisters: [legal_analysis, procedural_intel, case_hub]
---

## Context

Bylor's Grounds of Resistance contain 4 inconsistent dismissal reasons across paragraphs 22, 28, 31, and 58. This is not unusual -- respondents frequently make contradictory factual claims across different sections of their GoR because different people draft different sections, or because the narrative shifts to fit the legal test being addressed.

These contradictions are gold for cross-examination. But tracking them manually across a multi-paragraph GoR, linking each claim to contradicting evidence, and identifying internal inconsistencies is tedious and error-prone. A rebuttal gets prepared for paragraph 22 but the team forgets that paragraph 58 says something that contradicts paragraph 28.

This feature provides structured rebuttal storage with evidence linking and automatic contradiction detection. Each GoR paragraph's factual claims are captured, rebuttals are linked to specific evidence items, and the system detects when the respondent's own claims contradict each other.

ID-00035 identified this pattern from the Bylor case. HY-00019 hypothesized that structured rebuttal tracking would reduce preparation time and catch contradictions that manual review misses.

## Scope

1. Define `StoredRebuttal` and `ContradictionLink` types in `legal_analysis`
2. Implement storage and query functions for rebuttals by paragraph
3. Build contradiction detection logic that identifies conflicting claims from the same respondent
4. Enable evidence linking so each rebuttal references specific evidence items by ID
5. Expose queries through `case_hub` for cross-canister access

## Acceptance Criteria

- [ ] ISC-1: StoredRebuttal type defined with fields: gor_paragraph (u32), fact_claim (String), contradicting_evidence (Vec of evidence IDs), transcript_quotes (Vec of QuoteExtract IDs), rebuttal_text (String), status (draft/reviewed/final)
- [ ] ISC-2: ContradictionLink type defined connecting two StoredRebuttal IDs that conflict, with fields: rebuttal_a, rebuttal_b, contradiction_type (factual/temporal/logical), description, severity
- [ ] ISC-3: Query get_contradictions_for_case(case_id) returns all ContradictionLink pairs for a case, ordered by severity (critical first)
- [ ] ISC-4: Query get_rebuttals_by_paragraph(gor_paragraph) returns all rebuttals for a specific GoR paragraph number
- [ ] ISC-5: Internal contradiction detection: given all rebuttals for a case, detect when the same respondent makes different factual claims about the same event or topic across different GoR paragraphs
- [ ] ISC-6: Evidence linking: each rebuttal can reference specific evidence items by their evidence_vault ID, and the link is validated (evidence exists)
- [ ] ISC-7: Unit tests for contradiction detection logic covering: same-event conflicting claims, temporal impossibilities, and logical inconsistencies -- using patterns from the Bylor 4-paragraph scenario

## Dependencies

- ID-00034 / PRD 6 (Audio Transcript Domain Types): The `transcript_quotes` field in StoredRebuttal references QuoteExtract IDs. PRD 6 must define the QuoteExtract type first. Rebuttal tracking can proceed without quote linking, but full functionality requires transcript types.

## Evidence

- **ID-00035**: Analysis of Bylor GoR paragraphs 22, 28, 31, and 58 revealed 4 distinct dismissal narratives that contradict each other -- capability vs. conduct vs. performance vs. attitude
- **HY-00019**: Hypothesis that structured tracking of GoR contradictions would surface cross-examination opportunities that manual review consistently misses, particularly when GoR exceeds 20 paragraphs

## Out of Scope

- Automatic GoR parsing from PDF -- manual paragraph entry is acceptable for initial version
- AI-powered contradiction detection -- this PRD uses rule-based detection (same event, different claims)
- Witness statement rebuttal tracking -- this PRD focuses specifically on GoR paragraphs
- Cross-examination script generation -- separate feature that consumes rebuttal data
