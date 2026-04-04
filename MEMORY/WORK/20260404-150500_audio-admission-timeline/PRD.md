---
task: Audio Admission Chronological Timeline
slug: 20260404-150500_audio-admission-timeline
effort: small
phase: ready
progress: 0/5
mode: dev-job
started: 2026-04-04T15:00:00Z
updated: 2026-04-04T15:00:00Z
ladder_refs: [HY-00056, ID-00077]
domain: legal-evidence
canisters: [evidence_vault, legal_analysis]
---

## Context

Two key audio recordings form the forensic backbone of the case. Lott's recording (5 Jul 2024) captures the dismissal meeting where he admits acting on "instruction from Griffiths" -- destroying the GoR claim that Lott independently and reasonably decided to dismiss. Griffiths' recording (18 Jul 2024) captures the appeal meeting where he states the issue was "personalities not safety" -- demolishing the entire safety-grounds justification pleaded in the GoR.

Each admission carries a precise timestamp within the recording and contradicts specific GoR paragraphs. A chronological timeline mapping every admission to its contradicting GoR paragraph enables systematic cross-examination preparation, skeleton argument construction, and hearing bundle annotation. The timeline must be ordered by recording date and internal timestamp, with each admission linked to the specific GoR claim it reverses, undermines, or contextually weakens.

This differs from PRD 20 (Audio Contradiction Matrix) in scope: that PRD defines the general matrix structure, while this PRD implements the specific chronological timeline view with exact timestamps and exhaustive GoR paragraph mapping for both recordings.

## Scope

- Define `AudioAdmission` type in `legal_analysis` with recording metadata and precise timestamps
- Define `GoRContradiction` type linking admissions to specific GoR paragraph claims
- Implement chronological timeline query returning all admissions ordered by date with GoR mappings
- Implement contradiction strength classification hierarchy
- Unit tests modelling the known Lott and Griffiths admissions against GoR paragraphs 22, 28, 31, 58

## Acceptance Criteria

- [ ] ISC-1: AudioAdmission type with fields: recording_id, timestamp, speaker, quote, legal_significance
- [ ] ISC-2: GoRContradiction type with fields: admission_id, gor_version, paragraph_number, gor_claim, contradiction_type
- [ ] ISC-3: Chronological timeline query returning all admissions ordered by date with GoR mappings per case
- [ ] ISC-4: Contradiction strength hierarchy: direct_reversal > factual_inconsistency > contextual_undermining
- [ ] ISC-5: Unit tests modelling Lott "instruction" admission and Griffiths "personalities" admission against GoR paras 22, 28, 31, 58

## Dependencies

- `evidence_vault` canister for recording storage and chain-of-custody linkage
- `legal_analysis` canister for admission types, contradiction types, and timeline queries
- `awen_types` for shared type definitions, validation, and error enums

## Evidence

- Lott audio recording (5 Jul 2024): dismissal meeting, "instruction from Griffiths" admission
- Griffiths audio recording (18 Jul 2024): appeal meeting, "personalities not safety" admission
- Grounds of Resistance: paras 22 (Lott's independent decision), 28 (safety justification), 31 (process fairness), 58 (proportionality)
- Case reference: 6013156/2024

## Out of Scope

- Audio transcription or speech-to-text processing
- Audio playback or media file serving from canisters
- Automated NLP-based admission detection
- Full GoR text storage (only paragraph numbers and claim summaries)
- Witness statement cross-referencing (separate PRD)
