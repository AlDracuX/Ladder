---
task: Audio Transcript Domain Types and Storage
slug: 20260404-130500_audio-transcript-types
effort: medium
phase: ready
progress: 0/6
mode: dev-job
started: 2026-04-04T13:00:00Z
updated: 2026-04-04T13:00:00Z
ladder_refs: [ID-00034]
domain: legal-evidence
canisters: [evidence_vault, legal_analysis, procedural_intel]
---

## Context

Hearing transcripts are critical evidence in employment tribunal cases. Preliminary hearings, case management discussions, and substantive hearings all produce audio that can be transcribed. The transcription output contains timestamped segments with speaker attribution -- who said what, when.

Currently there is no structured way to store transcript data in the Awen Network. Audio files can be stored as raw evidence in evidence_vault, but the transcribed text, speaker mapping, and individual quotes cannot be queried, searched, or linked to rebuttals.

This PRD defines the foundational domain types for transcript storage: the transcript itself (with timestamped chunks), speaker mapping (who is who in the recording), and quote extraction (specific segments pulled out for use in rebuttals or evidence graphs).

This is a foundation PRD. PRD 5 (GoR Rebuttal Tracker) depends on the QuoteExtract type for linking transcript quotes to rebuttals. PRD 7 (Case Narrative Evidence Graph) depends on TranscriptQuote as a node type.

ID-00034 identified the need for structured transcript storage after the Bylor preliminary hearing recordings revealed contradictions that were difficult to reference precisely.

## Scope

1. Define `StoredTranscript`, `TranscriptChunk`, `SpeakerMapping`, and `QuoteExtract` types
2. Implement storage in `evidence_vault` (transcript is evidence)
3. Implement query functions for speaker-based and keyword-based quote search
4. Define the ingestion pipeline specification for Deepgram transcription output
5. Expose search queries through `legal_analysis` and `procedural_intel`

## Acceptance Criteria

- [ ] ISC-1: StoredTranscript type defined with fields: transcript_id, case_id, hearing_date (ISO 8601), hearing_type (preliminary/CMD/substantive/appeal), duration_seconds (u64), chunks (Vec of TranscriptChunk), speaker_map (Vec of SpeakerMapping), source_evidence_id (link to raw audio in evidence_vault)
- [ ] ISC-2: SpeakerMapping type defined with fields: speaker_id (String, e.g. "speaker_0"), name (String), role (enum: Judge, Claimant, RespondentCounsel, RespondentWitness, ClaimantWitness, Unknown), confirmed (bool -- whether attribution is verified or inferred)
- [ ] ISC-3: QuoteExtract type defined with fields: quote_id, transcript_id, start_time_ms (u64), end_time_ms (u64), speaker_id (String), text (String), linked_rebuttal_id (Option), tags (Vec of String), created_at (ISO 8601)
- [ ] ISC-4: Query search_quotes_by_speaker(case_id, speaker_id) returns all QuoteExtract entries for a given speaker across all transcripts in a case, ordered chronologically
- [ ] ISC-5: Query search_quotes_by_keyword(case_id, text_pattern) returns all QuoteExtract entries where the text field contains the search pattern, with case-insensitive matching
- [ ] ISC-6: Ingestion pipeline specification documented: input format (Deepgram JSON with word-level timestamps and speaker diarization), mapping rules (Deepgram speaker labels to SpeakerMapping), chunking strategy (paragraph-level segments from word-level data), and validation rules (no overlapping chunks, all speakers mapped)

## Dependencies

None. This is a foundation PRD that other PRDs build upon.

## Evidence

- **ID-00034**: Analysis of Bylor preliminary hearing recordings identified the need for structured transcript storage -- contradictions between what was said in hearings and what appears in the GoR could not be precisely referenced without timestamped, speaker-attributed transcript data

## Out of Scope

- Audio transcription itself -- this PRD assumes transcription is done externally (Deepgram) and focuses on storing and querying the output
- Audio file storage -- raw audio is already handled by evidence_vault as generic evidence
- Real-time transcription during hearings -- offline processing only
- Speaker identification / voice fingerprinting -- speaker mapping is manual or from Deepgram diarization
- Transcript summarization or analysis -- separate feature that consumes these types
