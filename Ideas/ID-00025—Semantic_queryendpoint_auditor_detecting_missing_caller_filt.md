---
id: ID-00025
title: "Semantic query-endpoint auditor detecting missing caller filters via LLM analysis"
status: active
updated: 2026-03-23
created: 2026-03-23
sources: [SR-00037]
phase: mate
domain: "security"
tags: [query-audit, llm, semantic-analysis, caller-filter, security, tooling]
scores:
  feasibility: 6
  novelty: 7
  impact: 8
  elegance: 6
---

## Description

Build an LLM-powered auditor that reads every `#[query]` endpoint's `_impl` function and determines whether it filters returned data by `caller`. Unlike grep-based approaches (which AL-00007 documents as prone to false positives — see SR-00027), the semantic auditor understands code context: it can distinguish a function that accepts a `Principal` parameter but ignores it from one that actively filters `entry.value().owner == caller`. This directly addresses the class of vulnerability found in SR-00037 (21 query endpoints leaking cross-user data) by making the audit repeatable and automatic rather than a one-off manual review.

## Provenance

Generated during MATE phase from AL-00007 (Semantic pattern gap analysis) × SR-00037 (21 query endpoints leaked cross-user data). AL-00007 established that grep-based pattern detection produces false positives because it can't read context. SR-00037 demonstrated the real-world impact of missed query-level access control. Combining them: use LLM semantic analysis specifically targeted at query endpoint authorization, the highest-impact gap class found so far.

## Connection

Would run as a CI or pre-commit check across all 9 canisters. Could be implemented as a Ladder experiment: extract all `#[query]` functions via tree-sitter, feed each to an LLM with the prompt "Does this function filter returned data by the caller principal?", collect results. Highest value in `legal_analysis` and `settlement` (most query endpoints). Complements ID-00019 (QueryAuth gate) — ID-00019 is the fix, this idea is the ongoing detection mechanism.

## Next Steps

- Hypothesis: "LLM-based query auditor detects 100% of unfiltered query endpoints with <5% false positive rate"
- Design: tree-sitter extracts query _impl functions → LLM classifies each → report flagged functions
- Consider: could this be a `mise run audit-queries` task that runs in CI?
