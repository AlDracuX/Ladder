---
task: Audio Evidence Contradiction Matrix
slug: 20260404-140000_audio-contradiction-matrix
effort: medium
phase: ready
progress: 0/6
mode: dev-job
started: 2026-04-04T14:00:00Z
updated: 2026-04-04T14:00:00Z
ladder_refs: [HY-00041, ID-00060]
domain: legal-evidence
canisters: [legal_analysis, evidence_vault]
---

## Context

Two audio recordings contain admissions that directly contradict Grounds of Resistance paragraphs. Lott's "instruction from Griffiths" contradicts GoR para 22 ("Lott reasonably decided"), demonstrating Lott was not the independent decision-maker the respondent claims. Griffiths' "personalities not safety" contradicts the entire safety-grounds justification underpinning the dismissal.

These contradictions are forensic gold -- the respondent's own witnesses, in their own words, destroying the respondent's pleaded case. A structured matrix mapping each admission to the specific GoR paragraph it contradicts enables systematic cross-examination preparation and skeleton argument construction.

## Scope

- Define `AudioAdmission` and `ContradictionMapping` types in `legal_analysis`
- Implement contradiction strength classification (direct/inferential/contextual)
- Build query interface for retrieving all audio-vs-GoR contradictions per case
- Create matrix data structure for visualization (admission x paragraph x strength)
- Store admission records in `evidence_vault` with chain-of-custody linkage
- Unit tests modelling the known Lott and Griffiths admissions

## Acceptance Criteria

- [ ] ISC-1: AudioAdmission type with fields: transcript_id, timestamp, speaker, quote_text, contradicts_paragraph
- [ ] ISC-2: ContradictionMapping type with fields: admission_id, gor_paragraph, gor_claim_text, contradiction_strength
- [ ] ISC-3: Query get_contradictions_for_gor(case_id) returns all audio vs GoR contradictions
- [ ] ISC-4: Strength classification enum: direct (verbatim opposite), inferential (logically inconsistent), contextual (undermines credibility)
- [ ] ISC-5: Matrix visualization data structure mapping admission x paragraph x strength
- [ ] ISC-6: Unit tests with Lott/Griffiths admission data covering both known contradictions

## Dependencies

- `evidence_vault` canister for transcript storage and evidence linking
- `legal_analysis` canister for contradiction analysis types and queries
- `awen_types` for shared type definitions and validation

## Evidence

- Lott audio recording: "instruction from Griffiths" admission
- Griffiths audio recording: "personalities not safety" admission
- Grounds of Resistance document (GoR para 22 and safety justification sections)
- Case reference: 6013156/2024

## Out of Scope

- Audio transcription or speech-to-text processing
- Audio playback or media serving
- Automated contradiction detection via NLP
- GoR full-text storage (only paragraph references and claim summaries)
