---
id: ID-00011
title: "Datalog-driven BDD scenario generation from legal rules"
status: draft
created: 2026-03-23
sources: [SR-00028, SR-00030]
phase: dream
domain: "testing-automation"
tags: [datalog, bdd, cucumber, test-generation, legal-rules]
scores:
  feasibility: 60
  novelty: 90
  impact: 80
  elegance: 85
---

## Description

The ascent Datalog engine (SR-00028) encodes legal rules as logical relations. Cucumber BDD (SR-00030) runs human-readable scenarios. What if Datalog rules automatically generated BDD scenarios? Each rule produces its own test: given these facts, when evaluated, then this claim outcome. Rules produce tests, not humans.

The Datalog rule `claim_viable(X) :- employment(X), dismissal(X), within_limit(X)` auto-generates: "Given an employee with employment and dismissal facts within time limits, When claim viability is assessed, Then claim is viable."

## Provenance

DREAM phase: free-association from SR-00028 (ascent Datalog) crossing with SR-00030 (cucumber BDD). The leap: rules and tests are dual representations of the same knowledge — so generate one from the other. Every legal rule becomes a living test.

## Connection

Addresses test coverage completeness for UK employment law rules. Currently tests are hand-written; as rules grow, test coverage gaps are inevitable. Auto-generation ensures every rule has at least one test.

## Next Steps

Hypothesis: 80%+ of Datalog claim viability rules can auto-generate valid cucumber scenarios that pass on first run.
