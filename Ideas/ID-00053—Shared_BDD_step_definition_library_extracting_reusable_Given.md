---
id: ID-00053
title: "Shared BDD step definition library extracting reusable Given-When-Then steps across employment law feature files"
status: draft
created: 2026-03-27
sources: [SR-00030, SR-00031, SR-00041]
phase: dream
domain: "testing"
tags: [bdd, cucumber, step-definitions, reuse, employment-law]
scores:
  feasibility: 8
  novelty: 5
  impact: 6
  elegance: 8
---

## Description

With 14 BDD scenarios and 61 steps across 3+ feature files (compensatory award, ACAS deadlines, settlement valuation), step definition duplication is already emerging. Common patterns like "Given an employee with gross weekly pay of X", "Given employment started on DATE", and "Then the award should be AMOUNT" appear across multiple features. This idea proposes extracting a shared step definition module (`tests/bdd/steps/common_employment.rs`) containing parameterized Given/When/Then implementations that all feature files can reuse. This follows the standard cucumber-rs pattern of module-based step organization. The shared library would include: employment context setup (salary, dates, service length), calculation triggers (compute_award, check_deadline), assertion helpers (amount_within_tolerance, date_equals), and statutory constant accessors (pulling from `uk_caps.rs`). This reduces maintenance cost as new feature files are added and ensures consistent test setup across scenarios.

## Provenance

Generated during dream phase from [SR-00030, SR-00031, SR-00041]. Theme: testing. SR-00030 establishes the cucumber 0.22 framework. SR-00031 provides the 3 initial feature files with implicit step duplication. SR-00041 confirms 61 steps across 14 scenarios, making the case for extraction.

## Connection

Lives in `tests/bdd/` alongside existing feature files. References `packages/awen_types/src/uk_caps.rs` for statutory constants and `packages/awen_uk_employment/` for domain calculation functions. Complements ID-00015 (implement step definitions) by providing the shared infrastructure those definitions live in. Also supports ID-00049 (adversarial BDD scenarios) since error-path scenarios would reuse the same setup steps.

## Next Steps

Hypothesis: "Extracting common steps into a shared module will reduce total step definition LOC by at least 20% while enabling 3+ new feature files without any new step implementations." Experiment by auditing current step definitions for duplicated patterns and prototyping the shared module.
