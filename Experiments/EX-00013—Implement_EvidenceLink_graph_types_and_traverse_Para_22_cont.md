---
id: EX-00013
title: "Implement EvidenceLink graph types and traverse Para 22 contradiction chain"
status: draft
created: 2026-03-25
hypothesis: HY-00019
algorithm: 
tags: [evidence-graph, traversal, cross-canister, types]
methodology: "Add EvidenceNode/EvidenceLink types, implement traverse function, test with Para 22 chain"
duration: "1 session (~45 min)"
success_criteria: "traverse(para_22, 2) returns 4+ connected nodes including audio and admission"
---

## Objective

Add bidirectional evidence graph types and a traverse function to legal_analysis. Encode the Para 22 contradiction chain as test data and verify automatic traversal.

## Methodology

1. Add `EvidenceNode` enum, `EvidenceLink` struct, `LinkType` enum to awen_types
2. Add `add_evidence_link_impl` and `traverse_evidence_impl` to legal_analysis
3. Encode the known 5-node chain: Para22 → AudioQuote → GriffithsInstruction → Para28Admission → TimelineJuly5
4. Test `traverse(para_22_id, max_depth=2)` returns all 4 connected nodes
5. Add 5 more evidence items and verify discovery of connections

## Setup

- Branch: experiment/ex-00013-evidence-graph (worktree)
- Depends on: EX-00012 completing first (shares legal_analysis canister)

## Algorithm

Uses AL-00001 (_impl pattern). Graph stored in StableBTreeMap<u64, StoredEvidenceLink>.

## Success Criteria

- [ ] EvidenceNode enum with 6 variants compiles
- [ ] traverse returns the known 5-node chain from any starting node
- [ ] At least 2 connections discovered that weren't seeded explicitly
- [ ] All tests pass, clippy clean

## Data Collection

Node count: TBD, Edge count: TBD, Connections discovered: TBD

## Results

*To be filled after execution*

## Analysis

*To be filled after execution*

## Next Steps

If successful: combine with EX-00012 rebuttal types for compound graph queries
