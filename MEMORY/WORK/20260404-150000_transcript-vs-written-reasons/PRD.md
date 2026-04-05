---
task: Hearing Transcript vs Written Reasons Cross-Reference
slug: 20260404-150000_transcript-vs-written-reasons
effort: medium
phase: complete
progress: 0/6
mode: dev-job
started: 2026-04-04T15:00:00Z
updated: 2026-04-04T15:00:00Z
ladder_refs: [HY-00051, ID-00076]
domain: legal-strategy
canisters: [legal_analysis, procedural_intel]
---

## Context

Strike-out hearing transcript (4 Mar 2026 Deepgram capture) can be cross-referenced against EJ Leverson's written reasons (1 Apr 2026) to find material omissions, mischaracterizations, and points the judge made orally but didn't include in written reasons. This cross-reference is critical for the EAT appeal (EA-2026-000371) because discrepancies between what was said at hearing and what appeared in written reasons constitute grounds for appeal under the "inadequate reasons" and "procedural irregularity" categories. Impact score: 95.

## Scope

Build types and detection logic within `legal_analysis` and `procedural_intel` canisters to:

1. Model transcript segments with linkage to written reasons paragraphs
2. Detect omissions where transcript content has no written reasons counterpart
3. Flag mischaracterizations where written reasons diverge from transcript record
4. Enable bidirectional querying between transcript and written reasons
5. Link detected issues to specific EAT appeal grounds

## Acceptance Criteria

- [ ] ISC-1: TranscriptSegment type linked to written reasons paragraph numbers -- struct with segment_id, timestamp_range, speaker, transcript_text, linked_wr_paragraphs (Vec<u32>), coverage_status (Covered/Omitted/Mischaracterized)
- [ ] ISC-2: OmissionDetector -- identifies transcript points with no corresponding written reasons coverage, returns Vec<TranscriptSegment> filtered to Omitted status with relevance scoring
- [ ] ISC-3: MischaracterizationFlag -- written reasons claims that differ from transcript record, struct with wr_paragraph, wr_claim, transcript_segment_id, transcript_text, divergence_description, severity (Minor/Material/Critical)
- [ ] ISC-4: Cross-reference query -- given a written reasons paragraph number, return all transcript segments that relate, with match confidence score and coverage assessment
- [ ] ISC-5: EAT ground amplifier -- each omission/mischaracterization linked to specific appeal ground (ground_number, ground_summary, supporting_discrepancies Vec), with strength contribution score
- [ ] ISC-6: Unit test -- model 3+ known discrepancies between hearing and written reasons, verify OmissionDetector and MischaracterizationFlag correctly identify them, test cross-reference queries return expected segments

## Dependencies

- Deepgram transcript from 4 Mar 2026 strike-out hearing (audio capture)
- EJ Leverson's written reasons dated 1 Apr 2026
- EAT skeleton grounds (10 grounds filed for EA-2026-000371)
- Supplementary grounds filed 2 Apr 2026

## Evidence

- Deepgram transcript segments from strike-out hearing
- Written reasons document (EJ Leverson, 1 Apr 2026)
- EAT notice of appeal (EA-2026-000371)
- Supplementary grounds (filed 2 Apr 2026)

## Out of Scope

- Audio playback or re-transcription (transcript is pre-existing)
- Natural language processing for automatic divergence detection (manual annotation for now)
- Frontend UI for cross-reference visualization
- Candid interface generation (types and logic only at this stage)
