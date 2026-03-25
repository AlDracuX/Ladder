---
id: HY-00021
title: "Typed audio transcript storage reduces manual citation lookup from minutes to seconds"
status: draft
created: 2026-03-25
idea: ID-00034
tags: [audio, transcript, speaker, evidence-vault, citation]
prediction: "Speaker-attributed transcript queries return matching quotes with timestamps"
metric: "Query returns correct speaker + timestamp for known transcript passages"
success_criteria: "100% of 5 known test quotes return correct speaker and timestamp within 1 second"
---

## Hypothesis

If we add `StoredTranscript { segments: Vec<TranscriptSegment> }` with `TranscriptSegment { speaker: Speaker, text: String, start_ms: u64, end_ms: u64 }` to evidence_vault, then querying "what did Neil Lott say about being instructed" returns the exact quote with speaker attribution and timestamp, replacing manual grep through 3000+ line transcript files.

## Rationale

The Mar 4 hearing transcript has 3154 lines with 5 speakers. Currently finding a specific quote requires grepping raw text and manually identifying speaker from context. With typed storage, `query_transcript(speaker: "Lott", keyword: "instruction")` returns `[{text: "I have no choice, no option...", speaker: Speaker::Witness("Neil Lott"), start_ms: 1234567, end_ms: 1234890}]`. Parent: ID-00034, source: SR-00056.

## Testing Plan

1. Define `StoredTranscript`, `TranscriptSegment`, `Speaker` enum in awen_types
2. Add `store_transcript` and `query_transcript` to evidence_vault
3. Parse the existing Mar 4 Deepgram transcript (3154 lines) into segments
4. Seed 5 known test quotes (Lott instruction, Iqbal strike-out argument, Judge reasons, etc.)
5. Verify each query returns correct speaker + timestamp
6. Measure query time (target: <1 second for any keyword search)

## Success Criteria

- All 5 test queries return correct speaker attribution
- Timestamps match the Deepgram output within 500ms tolerance
- Query latency <1 second for keyword search across full transcript
- Types compile, Storable round-trip, unit tests pass

## Risks

- Deepgram speaker diarization has errors (~5% mislabeling) — can't fix upstream, but should flag confidence
- Transcript segments may need re-segmenting (Deepgram chunks ≠ logical utterances)
