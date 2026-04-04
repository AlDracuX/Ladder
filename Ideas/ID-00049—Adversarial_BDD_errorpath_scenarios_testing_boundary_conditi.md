---
id: ID-00049
title: "Adversarial BDD error-path scenarios testing boundary conditions and invalid inputs in employment law features"
status: draft
created: 2026-03-27
sources: [SR-00031, SR-00032, SR-00041, SR-00030]
phase: dream
domain: "testing"
tags: [bdd, cucumber, adversarial, error-paths, employment-law]
scores:
  feasibility: 7
  novelty: 6
  impact: 7
  elegance: 5
---

## Description

The current 14 BDD scenarios (61 steps) across compensatory award, ACAS deadlines, and settlement valuation cover happy-path flows exclusively. SR-00032 revealed that contracts #[requires] annotations conflict with existing validation in test mode, suggesting error paths are under-explored. This idea proposes generating adversarial BDD Gherkin scenarios that specifically test boundary conditions (zero salary, negative durations, dates before ACAS early conciliation), invalid input combinations (missing required fields, overflowing numeric values), and error recovery paths (partial saga failures, concurrent modification). The adversarial scenarios would complement the existing happy-path suite and catch edge cases that contracts annotations alone cannot model.

## Provenance

Generated during dream phase from [SR-00031, SR-00032, SR-00041, SR-00030]. Theme: testing. SR-00031 provides the 3 feature files as baseline, SR-00041 confirms 14 scenarios are all positive paths, SR-00032 shows the contracts/validation conflict that reveals undertested error paths, SR-00030 provides the cucumber framework context.

## Connection

Addresses the gap between happy-path BDD coverage and real-world adversarial inputs in `awen_uk_employment` and `settlement` canisters. The `packages/awen_types/src/validation.rs` module defines input validation rules (MAX_SHORT_TEXT_LEN, MAX_VEC_LEN, etc.) that should be exercised by BDD scenarios but currently are not. Also relevant to `deadline_alerts` where invalid date arithmetic could cause silent failures.

## Next Steps

Hypothesis: "Adding 10 adversarial BDD scenarios covering zero/negative/overflow inputs to the 3 existing feature files will expose at least 2 unhandled error paths in settlement or deadline_alerts canister _impl functions." Design experiment with mutation testing to verify scenarios actually catch regressions.
