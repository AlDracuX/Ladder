---
task: Protected Disclosure Strength Scorer
slug: 20260404-140800_disclosure-strength-scorer
effort: medium
phase: ready
progress: 0/6
mode: dev-job
started: 2026-04-04T14:00:00Z
updated: 2026-04-04T14:00:00Z
ladder_refs: [HY-00048, ID-00072]
domain: legal-strategy
canisters: [legal_analysis, procedural_intel]
---

## Context

Protected disclosure (whistleblowing) claims under ERA 1996 Part IVA depend on multiple evidential factors whose combined strength determines litigation viability. In case 6013156/2024, Alex's Code 1 safety disclosure has unusually strong supporting evidence across multiple dimensions: temporal proximity (hours between disclosure and first detriment), independent regulatory validation (ONR/NNB confirmation of the safety concern), audio admissions from managers contradicting the official narrative, contemporaneous documentary trail, and witness corroboration.

Currently, disclosure strength is assessed by gut feeling. A quantified scoring system with weighted factors replaces subjective judgment with structured analysis. Each factor stores evidence references and score justification, producing a total score with a strength rating that directly informs litigation strategy and settlement positioning.

## Scope

- Define `DisclosureScore` type in `legal_analysis` with factor-based scoring
- Implement `ScoringFactor` enum covering all five evidence dimensions
- Configure weight distribution across factors (temporal 30%, regulatory 25%, audio 25%, documentary 15%, witness 5%)
- Implement strength rating thresholds: strong (>75), moderate (50-75), weak (<50)
- Store factor details with evidence references and score justification
- Connect to `procedural_intel` for strategic assessment integration
- Unit test with Alex's Code 1 disclosure fully populated

## Acceptance Criteria

- [ ] ISC-1: DisclosureScore type with fields: disclosure_id, factors (Vec<ScoringFactor>), total_score (u32), strength_rating (Strong/Moderate/Weak)
- [ ] ISC-2: ScoringFactor enum variants: TemporalProximity (hours/days to first detriment), RegulatoryValidation (independent confirmation of concern), AudioAdmissions (recorded contradictions from respondent witnesses), DocumentaryTrail (contemporaneous documents supporting disclosure), WitnessCorroboration (third-party witness support)
- [ ] ISC-3: Weight configuration: TemporalProximity 30%, RegulatoryValidation 25%, AudioAdmissions 25%, DocumentaryTrail 15%, WitnessCorroboration 5% -- weights sum to 100%
- [ ] ISC-4: Strength rating derivation: Strong when total_score exceeds 75, Moderate when 50 to 75 inclusive, Weak when below 50
- [ ] ISC-5: Factor detail: each ScoringFactor stores evidence_refs (Vec<String>) and score_justification (String) explaining the raw factor score
- [ ] ISC-6: Unit test: score Alex's Code 1 disclosure with all 5 factors populated, verify total_score computation and Strong rating assignment

## Dependencies

- `legal_analysis` canister for scoring types and computation logic
- `procedural_intel` canister for strategic assessment storage
- `awen_types` for shared type definitions and validation
- `evidence_vault` for evidence reference resolution

## Evidence

- Alex's Code 1 safety disclosure to ONR/NNB
- Temporal proximity: disclosure made, detriment followed within hours
- ONR/NNB regulatory validation of the safety concern
- Audio recordings: Lott and Griffiths admissions contradicting official narrative
- Contemporaneous emails, meeting notes, and internal documents
- ERA 1996 Part IVA -- protected disclosure statutory framework

## Out of Scope

- Automated evidence gathering or document ingestion
- Legal advice generation or litigation outcome prediction
- Settlement valuation calculation
- Comparison across multiple disclosures within the same case
- Integration with external legal databases or case law search
