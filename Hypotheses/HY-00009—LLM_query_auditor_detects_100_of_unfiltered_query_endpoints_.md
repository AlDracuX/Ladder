---
id: HY-00009
title: "LLM query auditor detects 100% of unfiltered query endpoints with under 5% false positive rate"
status: draft
created: 2026-03-24
idea: ID-00025
tags: [llm, query-audit, security, semantic-analysis, tooling]
prediction: "LLM classifies all query _impl functions correctly as filtered/unfiltered with <5% false positive rate"
metric: "true positive rate and false positive rate on known-good/known-bad query endpoints"
success_criteria: "100% true positive (catches all unfiltered), <5% false positive (doesn't flag filtered queries)"
---

## Hypothesis

If we build a tree-sitter + LLM pipeline that extracts all `#[query]` endpoint `_impl` functions and classifies each as "caller-filtered" or "unfiltered", then it detects 100% of endpoints that return unscoped data with a false positive rate under 5%.

## Rationale

SR-00037 found 21 query endpoints leaking cross-user data. The audit was manual and one-off. AL-00007 showed that grep-based detection produces false positives (SR-00027). An LLM can understand code context — whether a `Principal` parameter is actually used to filter results vs. just accepted and ignored. This makes the audit repeatable and CI-integrated.

## Testing Plan

1. Ground truth: manually label all ~60 `#[query]` endpoints across 9 canisters as "filtered" or "unfiltered" (the SR-00037 fix gives us this data)
2. Build extractor: tree-sitter parses each canister lib.rs, extracts `_impl` function bodies for `#[query]` methods
3. Build classifier: LLM prompt "Does this function filter returned data by the caller principal? Answer YES/NO with evidence."
4. Run on all endpoints, compare against ground truth
5. Calculate: TPR = true positives / actual unfiltered, FPR = false positives / actual filtered

## Success Criteria

- 100% TPR: every actually-unfiltered endpoint is flagged
- <5% FPR: no more than 3 of ~60 filtered endpoints incorrectly flagged
- Runs in <2 minutes total across all 9 canisters

## Risks

- LLM may not understand stable storage access patterns (thread_local! + .with closure)
- Complex multi-function filtering (where filter is in a helper, not the _impl directly) may fool the classifier
- Cost: running LLM inference on ~60 functions per CI run adds latency and API cost
