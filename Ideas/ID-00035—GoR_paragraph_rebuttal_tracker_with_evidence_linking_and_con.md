---
id: ID-00035
title: "GoR paragraph rebuttal tracker with evidence linking and contradiction detection"
status: draft
created: 2026-03-25
sources: [SR-00057]
phase: dream
domain: "case-domain"
tags: [gor, rebuttal, contradiction, evidence-linking, legal-analysis]
scores:
  feasibility: 6
  novelty: 7
  impact: 9
  elegance: 7
---

## Description

Build a `StoredRebuttal` type in legal_analysis that maps each GoR paragraph to: (a) the factual claim made, (b) contradicting evidence with exhibit references, (c) internal contradictions with other GoR paragraphs, and (d) audio transcript quotes that disprove the claim. The current GoR has 4 inconsistent dismissal reasons across paras 22, 28, 31, and 58 — this structure makes those contradictions machine-queryable rather than requiring manual cross-referencing.

## Provenance

Generated during dream phase from [SR-00057, SR-00058, SR-00063]. Theme: case-domain gaps. SR-00057 identified missing GoR rebuttal tracking; SR-00058 identified Stage 3 appeal contradictions; SR-00063 identified the cross-module rebuttal linking pattern.

## Connection

Directly addresses the core litigation problem: proving respondent's pleading is internally inconsistent. Affects legal_analysis (storage + queries), procedural_intel (pattern detection), case_hub (case-level contradiction summary). Currently this analysis exists only in vault markdown files with no programmatic access.

## Next Steps

Hypothesis: "Structured GoR rebuttal tracking surfaces at least 3 previously undetected internal contradictions per case". Test by encoding the existing GoR analysis into the new types and comparing against manual vault notes.
