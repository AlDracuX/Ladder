---
id: HY-00032
title: "AST-aware Call classification in pollinator reduces false positive source entries by 80 percent"
status: draft
created: 2026-03-27
idea: ID-00008
tags: [ladder, pollinator, ast, call-classification]
prediction: "Classifying Call::bounded_wait sites by surrounding context (update vs query endpoint, return type mutability) reduces pollinator false positives from the current rate to under 20% of flagged sites"
metric: "Percentage of pollinator-flagged Call:: sites that are actually read-only queries not needing idempotency"
success_criteria: "Of the 23 Call::bounded_wait sites in the codebase, the improved pollinator correctly classifies at least 80% as write (needs idempotency) vs read (no action needed)"
---

## Hypothesis

If the Ladder pollinator classifies Call::bounded_wait sites by examining surrounding context (whether the call is inside an #[update] vs #[query] function, whether the called method name matches known query patterns, and whether the return value is used for reads vs writes), then at least 80% of flagged sites are correctly classified as write-needing-idempotency vs read-only, reducing false positive source entries by 80%.

## Rationale

The pollinator currently uses `grep 'Call::bounded_wait'` to find inter-canister calls, producing 23 matches across 9 files. However, some of these are read-only query calls that do not mutate state and therefore do not need idempotency protection. The pollinator flags all 23 as reliability gaps, creating noise. Context-aware classification can distinguish: (1) calls inside #[update] functions that modify state = true positives, (2) calls inside #[query] functions or calls to known query methods = false positives. The LLM-based approach reads the surrounding 20 lines of code context to make this determination.

## Testing Plan

1. Baseline: run current pollinator, count total Call:: flags and manually classify each as write vs read
2. Implement context-aware classifier: for each Call::bounded_wait match, extract the enclosing function's #[update]/#[query] annotation and the target method name
3. Compare classifier output against manual ground truth
4. Measure precision and recall of write-vs-read classification

## Success Criteria

- Classifier correctly labels at least 80% of the 23 Call sites (18+ correct)
- False positive rate (read-only calls flagged as write) drops below 20%
- No false negatives (write calls incorrectly classified as read-only)

## Risks

- Some Call::bounded_wait calls are ambiguous -- they read data that influences subsequent writes
- AST parsing of Rust macros (ic_cdk macros) may be unreliable; LLM context reading may be more practical than true AST parsing
- The 23 call sites may change as the codebase evolves, requiring re-calibration
