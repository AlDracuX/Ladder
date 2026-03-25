---
id: ID-00034
title: "Audio transcript domain types with speaker attribution and quote extraction for evidence_vault"
status: draft
created: 2026-03-25
sources: [SR-00056]
phase: dream
domain: "case-domain"
tags: [audio, transcript, speaker-diarization, evidence, hearing]
scores:
  feasibility: 7
  novelty: 6
  impact: 8
  elegance: 7
---

## Description

Add `StoredTranscript`, `SpeakerMapping`, and `QuoteExtract` types to evidence_vault enabling structured indexing of hearing audio. Each transcript chunk links to a speaker identity (Judge, Counsel, Claimant, Clerk) with timestamps, and quote extracts can be tagged as rebuttal evidence against specific GoR paragraphs. This closes the gap between raw Deepgram output and legally actionable evidence references.

## Provenance

Generated during dream phase from [SR-00056, SR-00063]. Theme: case-domain gaps. SR-00056 identified the absence of audio transcript domain types; SR-00063 identified the cross-module rebuttal linking pattern.

## Connection

Addresses the inability to programmatically cite hearing transcript passages in legal documents. Affects evidence_vault (storage), legal_analysis (citation generation), and procedural_intel (pattern matching on spoken testimony). Without this, transcript quotes remain unstructured text in vault markdown files.

## Next Steps

Hypothesis: "Adding StoredTranscript with speaker attribution reduces manual transcript citation time by >50%". Would need to define the Candid interface, implement Storable, and test with the existing Mar 4 hearing transcript data.
