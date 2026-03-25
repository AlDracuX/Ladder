---
id: EX-00014
title: "Implement StoredTranscript types and query Mar 4 hearing transcript"
status: draft
created: 2026-03-25
hypothesis: HY-00021
algorithm: 
tags: [audio, transcript, speaker, evidence-vault, query]
methodology: "Add transcript types to awen_types, implement store/query in evidence_vault, test with 5 known quotes"
duration: "1 session (~30 min)"
success_criteria: "5/5 test queries return correct speaker + timestamp"
---

## Objective

Add typed audio transcript storage and query to evidence_vault. Parse a sample of the Mar 4 hearing transcript into structured segments and verify speaker-attributed queries work.

## Methodology

1. Add `StoredTranscript`, `TranscriptSegment`, `Speaker` enum to awen_types
2. Add `store_transcript_impl` and `query_transcript_impl` to evidence_vault
3. Encode 20 representative segments from the Mar 4 transcript as test data
4. Query 5 known quotes by speaker+keyword combination
5. Verify speaker attribution and timestamp accuracy

## Setup

- Branch: experiment/ex-00014-transcript-types (worktree)
- Data: Mar 4 hearing transcript at Z-Infrastructure/hearing-transcriber/

## Algorithm

Uses AL-00001 (_impl pattern). Segments stored in StableBTreeMap<u64, StoredTranscript>.

## Success Criteria

- [ ] StoredTranscript with CandidStorable compiles
- [ ] Speaker enum covers Judge, Counsel, Claimant, Clerk, Witness variants
- [ ] 5/5 test queries return correct speaker attribution
- [ ] Timestamps within 500ms of Deepgram source
- [ ] All existing evidence_vault tests still pass

## Data Collection

Query accuracy: X/5, Latency: TBD ms, New test count: TBD

## Results

*To be filled after execution*

## Analysis

*To be filled after execution*

## Next Steps

If successful: integrate with EX-00013 evidence graph for transcript→evidence links
