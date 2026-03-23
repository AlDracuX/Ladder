---
id: ID-00015
title: "Implement step definitions for compensatory award and ACAS deadline BDD scenarios"
status: draft
created: 2026-03-23
sources: [SR-00031]
phase: contemplate
domain: "testing"
tags: [bdd, gherkin, step-definitions, statutory-calculations]
scores:
  feasibility: 6
  novelty: 5
  impact: 7
  elegance: 7
---

## Description

Implement step definitions (glue code) for the 3 BDD Gherkin feature files covering compensatory award calculation, ACAS deadline extensions, and settlement valuation. The feature files exist but have no Rust step definitions connecting them to the actual canister logic. This would enable executable specifications that verify UK statutory calculations against plain-English scenarios.

## Provenance

CONTEMPLATE phase from SR-00031 (3 new BDD feature files). Theme: testing.

## Connection

Bridges the gap between Catala golden vectors (mathematical correctness) and BDD scenarios (business requirement correctness). Settlement and deadline_alerts canisters are the primary targets.

## Next Steps

Hypothesis: BDD step definitions catch requirements gaps that unit tests miss, finding 3+ issues not caught by existing 6,775 tests.
