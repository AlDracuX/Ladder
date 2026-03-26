---
id: ID-00041
title: "Case-specific domain crate with canonical fact constructors and rebuttal graph"
status: draft
created: 2026-03-26
sources: [SR-00062, SR-00063, SR-00064]
phase: dream
domain: "architecture"
tags: [domain-crate, case-specific, rebuttal, fact-constructors, separation-of-concerns]
scores:
  feasibility: 8
  novelty: 7
  impact: 8
  elegance: 9
---

## Description

Create a separate case-specific domain crate (e.g., `awen_hpc`) that encodes real case facts as reusable Rust constructors, links audio transcript quotes to Grounds of Resistance paragraph rebuttals via cross-module `as_rebuttal()` methods, and provides canonical test data derived from actual case materials. This cleanly separates case-specific knowledge from the generic `awen_types` shared library, preventing domain contamination. The fact constructors produce typed, validated case data that can be used in tests, analysis pipelines, and document generation without scattering raw strings across the codebase.

## Provenance

Derived from three related sources: SR-00062 (need for a case-specific crate separate from generic types), SR-00063 (cross-module rebuttal linking between transcript evidence and GoR paragraphs), and SR-00064 (canonical fact constructors from real case materials). The convergence of these three gaps points to a single architectural solution: a dedicated crate that owns case-specific domain knowledge while exposing it through clean interfaces that the rest of the system can consume.

## Connection

This is an architectural separation-of-concerns idea that affects the workspace structure. The new crate would depend on `awen_types` for shared types but not vice versa, maintaining the dependency direction. The `as_rebuttal()` pattern connects to `legal_analysis` canister workflows where transcript evidence must be mapped to specific GoR paragraphs. The canonical fact constructors serve as golden test data for integration tests across all canisters. High elegance score (9) reflects the clean architectural boundary this creates.

## Next Steps

1. Create `awen_hpc` crate with workspace membership, depending on `awen_types`
2. Define `CaseFact` constructors for key evidence items (typed builders, not raw strings)
3. Implement `as_rebuttal()` trait method linking transcript quotes to GoR paragraph references
4. Build canonical test fixtures that all canister integration tests can import
5. Migrate any case-specific constants currently scattered in canister code into the new crate
