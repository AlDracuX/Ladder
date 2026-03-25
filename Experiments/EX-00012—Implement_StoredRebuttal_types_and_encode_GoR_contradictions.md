---
id: EX-00012
title: "Implement StoredRebuttal types and encode GoR contradictions in legal_analysis"
status: draft
created: 2026-03-25
hypothesis: HY-00020
algorithm: 
tags: [gor, rebuttal, contradiction, legal-analysis, types]
methodology: "Add types to awen_types, implement in legal_analysis, encode known contradictions, run tests"
duration: "1 session (~30 min)"
success_criteria: "4+ contradictions detected, types compile, Storable round-trip, tests pass"
---

## Objective

Add `StoredRebuttal`, `ContradictionType`, and `find_contradictions` to the legal_analysis canister. Encode the known Para 22/28/31/58 contradiction cluster. Verify automated detection matches manual analysis.

## Methodology

1. Add types to `packages/awen_types/src/lib.rs`: StoredRebuttal, ContradictionType enum, Contradiction struct
2. Add `store_rebuttal_impl` and `find_contradictions_impl` to `src/legal_analysis/src/lib.rs`
3. Encode 15 key GoR paragraphs as test data in unit tests
4. Seed 4 known contradictions as expected results
5. Run `cargo nextest run -p legal_analysis -E 'test(/rebuttal/)'`
6. Count contradictions found vs expected

## Setup

- Branch: experiment/ex-00012-gor-rebuttal (worktree)
- Baseline: 0 rebuttal types exist, 0 contradiction detection
- Tools: cargo nextest, clippy

## Algorithm

Uses AL-00001 (_impl pattern): `store_rebuttal` calls `store_rebuttal_impl`, `find_contradictions` calls `find_contradictions_impl`.

## Success Criteria

- [ ] StoredRebuttal type compiles with CandidStorable derive
- [ ] ContradictionType enum has 3+ variants
- [ ] find_contradictions_impl returns 4+ hits for the Para 22/28/31/58 cluster
- [ ] All existing legal_analysis tests still pass
- [ ] cargo clippy clean

## Data Collection

Count of contradictions: expected >= 4, actual = TBD
New test count: TBD
Compilation: pass/fail

## Results

*To be filled after execution*

## Analysis

*To be filled after execution*

## Next Steps

If successful: distill as algorithm, create RE- entry, consider extending to full 62-paragraph encoding
