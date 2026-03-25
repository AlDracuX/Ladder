---
id: HY-00020
title: "Structured GoR rebuttal tracking surfaces internal contradictions across pleading paragraphs"
status: draft
created: 2026-03-25
idea: ID-00035
tags: [gor, rebuttal, contradiction, legal-analysis, pleading]
prediction: "Encoding GoR paragraphs as typed rebuttals detects 4+ internal contradictions"
metric: "Count of machine-detected internal contradictions in respondent's GoR"
success_criteria: "At least 4 contradictions detected, including the known Para 22/28/31/58 inconsistency cluster"
---

## Hypothesis

If we encode each GoR paragraph as a `StoredRebuttal { paragraph_num, claim_text, contradicted_by, evidence_refs, audio_quotes }` in legal_analysis, then automated contradiction detection across paragraphs will surface at least 4 internal inconsistencies, including the known cluster where Para 22 (conduct), Para 28 (notice pay admission), Para 31 (capability alternative), and Para 58 (poor performance) give four different dismissal reasons.

## Rationale

The respondent's GoR contains at least 4 known contradictions discovered manually: (1) Para 22 says "conduct" but audio proves Griffiths instructed it, (2) Para 28 admits notice pay recommendation contradicting Para 62's gross misconduct claim, (3) Para 31 offers "capability" as alternative to "conduct", (4) Para 58 says "poor performance" — a fourth reason. A structured encoding with `contradicted_by: Vec<u32>` fields makes these machine-queryable and may surface additional inconsistencies in the 62+ paragraphs that haven't been manually audited. Parent: ID-00035, sources: SR-00057, SR-00058.

## Testing Plan

1. Define `StoredRebuttal` and `ContradictionType` enum in awen_types
2. Encode all 62+ GoR paragraphs as structured data (paragraph number + claim summary)
3. Implement `find_contradictions(case_id) -> Vec<Contradiction>` comparing claim texts
4. Seed the 4 known contradictions as test expectations
5. Run against full GoR encoding and count additional hits
6. Baseline: count contradictions documented in vault's `FORENSIC-AMBUSH-PATTERN-ANALYSIS.md`

## Success Criteria

- 4+ contradictions detected including the Para 22/28/31/58 cluster
- Each contradiction has typed evidence: `{ para_a, para_b, contradiction_type, evidence_ref }`
- Types compile, Storable round-trip works, unit tests pass
- No false positives (every reported contradiction is genuinely inconsistent)

## Risks

- "Contradiction" needs a precise definition — mitigate with typed ContradictionType enum (claim_inconsistency, factual_conflict, admission_against_interest)
- 62 paragraphs is manual encoding work — could scope to the 15 most legally significant paras first
