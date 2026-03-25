---
id: HY-00019
title: "Traversable evidence graph surfaces non-obvious connections missed by manual cross-referencing"
status: draft
created: 2026-03-25
idea: ID-00038
tags: [evidence-graph, traversal, case-domain, cross-canister]
prediction: "Graph traversal from any evidence node reaches all related nodes within 2 hops"
metric: "Number of non-obvious connections discovered per 10 evidence items"
success_criteria: "At least 2 connections per 10 items that were not explicitly documented in vault prose"
---

## Hypothesis

If we build bidirectional EvidenceLink types connecting timeline events, evidence exhibits, GoR paragraphs, transcript quotes, and legal claims, then traversing from any single node will surface at least 2 non-obvious connections per 10 evidence items that manual vault analysis missed.

## Rationale

The HPC case has ~30 evidence exhibits, 62+ GoR paragraphs, 3000+ transcript lines, and 15+ timeline events. Currently connections exist only in Alex's head or scattered vault prose. The Para 22 → audio contradiction → GoR para 28 notice pay admission chain is the strongest example: 3 nodes linked by 2 edges that took manual work to discover. A graph makes this traversal instant and reveals chains humans miss under cognitive load. Parent: ID-00038, sources: SR-00057, SR-00058, SR-00059, SR-00064.

## Testing Plan

1. Define `EvidenceLink { from_id, to_id, link_type, strength }` in awen_types
2. Define `EvidenceNode` enum: `Event | Exhibit | GorParagraph | TranscriptQuote | Claim | Rebuttal`
3. Encode the known Para 22 contradiction chain (5 nodes, 4 edges) as test data
4. Implement `traverse(node_id, max_depth) -> Vec<EvidenceNode>` in legal_analysis
5. Load 10 real evidence items, build links, count connections not in existing vault notes
6. Baseline: grep existing vault files for explicit cross-references between these 10 items

## Success Criteria

- `traverse(para_22, 2)` returns audio quote + notice pay admission + timeline event (known chain)
- At least 2 additional connections surface that aren't in any vault markdown file
- All types compile, pass Storable round-trip, and have unit tests

## Risks

- Defining "non-obvious" is subjective — mitigate by comparing strictly against vault grep results
- Graph could explode with false connections if link_type isn't constrained — use typed enum not free text
