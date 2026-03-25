---
id: ID-00038
title: "Case narrative evidence graph with bidirectional event-evidence-claim-rebuttal traversal"
status: draft
created: 2026-03-25
sources: [SR-00059]
phase: dream
domain: "case-domain"
tags: [evidence-graph, narrative, traversal, case-hub, cross-canister]
scores:
  feasibility: 5
  novelty: 8
  impact: 9
  elegance: 8
---

## Description

Build a bidirectional evidence graph where every node (timeline event, evidence item, legal claim, GoR paragraph, transcript quote, witness statement passage) links to every other node it supports or contradicts. From any single node — say, the July 5 disciplinary meeting — you can traverse to: audio transcript quotes from that meeting, the GoR paragraphs that misrepresent it, the evidence exhibits that contradict those paragraphs, and the legal claims those contradictions support. This is the "one question away from any answer" architecture.

## Provenance

Generated during dream phase from [SR-00057, SR-00058, SR-00059, SR-00064]. Theme: case-domain. SR-00057 (GoR rebuttal gap), SR-00058 (Stage 3 contradictions), SR-00059 (victimization chain), SR-00064 (canonical case data constructors) all point to the need for a traversable evidence structure rather than isolated flat records.

## Connection

This is the highest-impact domain idea because it transforms case analysis from "search and manually correlate" to "traverse and discover". Affects all 9 canisters — case_hub as the graph coordinator, evidence_vault for evidence nodes, case_timeline for event nodes, legal_analysis for claim/rebuttal nodes, procedural_intel for pattern nodes. Currently, connections between evidence items exist only in Alex's head or in vault prose — not queryable.

## Next Steps

Hypothesis: "A traversable evidence graph reveals at least 2 non-obvious connections per 10 evidence items that manual analysis missed". Start with a subset: the Para 22 → audio → GoR contradiction chain, and verify the graph can surface it automatically.
