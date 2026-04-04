---
task: Witness Credibility Scorecard
slug: 20260404-160000_witness-credibility-scorecard
effort: medium
phase: ready
progress: 0/6
mode: dev-job
started: 2026-04-04T16:00:00Z
updated: 2026-04-04T16:00:00Z
ladder_refs: [HY-00061, ID-00094]
domain: legal-intel
canisters: [legal_analysis, procedural_intel]
---

## Context

TLT witness statements (Sims, Bains) contain 7 verified errors across their statements. These errors range from factual inaccuracies and date contradictions to self-contradictions and outright false claims. Each error has been independently verified against known facts, contemporaneous documents, and audio evidence. This PRD creates structured types to map each error against contradicting evidence and generate cross-examination questions that exploit these weaknesses systematically. The credibility scorecard transforms scattered observations into a weaponised cross-examination tool with audio overlay capability.

## Scope

- Define WitnessProfile and StatementError types in legal_analysis canister
- Implement CredibilityScore calculator with severity-weighted error ratios
- Build CrossExamQuestion generator that produces structured questions per error
- Create audio contradiction overlay linking witness claims to audio admissions
- Store and query witness profiles with their associated errors and scores
- Unit tests modelling known Sims and Bains statement errors

## Acceptance Criteria

- [ ] ISC-1: WitnessProfile type with fields: name, employer_claimed, employer_actual, statement_date, error_count
- [ ] ISC-2: StatementError type with fields: paragraph, claim, contradicting_evidence, error_type enum (factual/date/self-contradiction/false_claim)
- [ ] ISC-3: CredibilityScore calculator producing errors_per_paragraph ratio with severity weighting per error_type
- [ ] ISC-4: CrossExamQuestion generator producing structured question per error with anticipated_answer and evidence_to_deploy fields
- [ ] ISC-5: Audio contradiction overlay linking witness claims to audio admissions that refute them via timestamp and transcript reference
- [ ] ISC-6: Unit test modelling Sims para 2/3/10 errors and Bains para 2 employer contradiction

## Dependencies

- legal_analysis canister must support new types in stable storage
- procedural_intel canister for cross-examination strategy persistence
- Audio transcript references must be representable as structured data (no audio file processing)

## Evidence

- **HY-00061**: Hypothesis that structured credibility scoring improves cross-examination effectiveness
- **ID-00094**: Idea for witness credibility analysis with impact score 90
- TLT witness statements (Sims, Bains) -- 7 verified errors identified through manual review
- Audio recordings containing admissions that contradict specific witness claims

## Out of Scope

- Audio file processing or transcription (references only)
- Witness statements from non-TLT parties
- Automated evidence gathering or discovery
- Real-time cross-examination prompting during hearing
- UI/frontend for scorecard display
