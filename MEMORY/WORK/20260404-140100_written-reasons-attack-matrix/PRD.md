---
task: Written Reasons EAT Attack Matrix
slug: 20260404-140100_written-reasons-attack-matrix
effort: medium
phase: complete
progress: 0/6
mode: dev-job
started: 2026-04-04T14:00:00Z
updated: 2026-04-04T14:00:00Z
ladder_refs: [HY-00042, ID-00064]
domain: legal-strategy
canisters: [legal_analysis, procedural_intel]
---

## Context

Written reasons from Employment Judge Leverson (1 Apr 2026) contain 11 identified attack vectors, 5 rated STRONG. Each vector represents a paragraph or finding where the judge's reasoning is susceptible to appeal on grounds of misdirection, inadequate reasoning, application of the wrong test, or procedural unfairness.

A structured mapping from each vulnerable paragraph to the corresponding EAT ground, supporting authority, and argument summary enables systematic appeal preparation. The 8 supplementary grounds filed 2 Apr 2026 provide the framework -- each attack vector must link to the specific supplementary ground paragraph (1-31) that it supports.

## Scope

- Define `AttackVector` and `EATGroundMapping` types in `legal_analysis`
- Implement strength rating with evidence weight classification
- Build ranked query interface for attack vectors by strength
- Cross-reference each vector to supplementary ground paragraphs (1-31)
- Store attack analysis in `procedural_intel` for strategic planning
- Unit tests modelling the 8 supplementary grounds filed 2 Apr 2026

## Acceptance Criteria

- [ ] ISC-1: AttackVector type with fields: paragraph_ref, judge_reasoning, error_type (misdirection/inadequate_reasoning/wrong_test/procedural_unfairness), strength
- [ ] ISC-2: EATGroundMapping type with fields: attack_vector_id, eat_ground_number, supporting_authority, argument_summary
- [ ] ISC-3: Strength rating enum: strong/moderate/weak with evidence_weight field
- [ ] ISC-4: Query get_attack_vectors_by_strength() returns ranked list ordered by strength descending
- [ ] ISC-5: Cross-reference: each vector links to supplementary ground paragraph number (1-31)
- [ ] ISC-6: Unit tests with the 8 supplementary grounds filed 2 Apr 2026

## Dependencies

- `legal_analysis` canister for attack vector types and queries
- `procedural_intel` canister for strategic pattern storage
- `awen_types` for shared type definitions
- Written reasons document (EJ Leverson, 1 Apr 2026)
- Supplementary grounds document (filed 2 Apr 2026)

## Evidence

- Written reasons: EJ Leverson, 1 Apr 2026 (source document for attack vectors)
- Supplementary grounds: 8 grounds, paragraphs 1-31, filed 2 Apr 2026
- EAT appeal: EA-2025-001649-AT
- Case reference: 6013156/2024

## Out of Scope

- Full text storage of written reasons (only paragraph references and summaries)
- Automated detection of legal errors via NLP
- Drafting of skeleton arguments or notices of appeal
- Authority database or case law search
