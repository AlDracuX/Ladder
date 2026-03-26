---
id: ID-00042
title: "BDD scenario auto-generation from Ascent Datalog rules via cucumber step synthesis"
status: draft
created: 2026-03-26
sources: [SR-00041, SR-00028]
phase: dream
domain: "testing"
tags: [BDD, Datalog, ascent, cucumber, auto-generation, legal-rules, test-synthesis]
scores:
  feasibility: 4
  novelty: 9
  impact: 7
  elegance: 8
---

## Description

Generate cucumber BDD test scenarios automatically from Ascent Datalog rule definitions. When a legal rule is expressed in Datalog (e.g., claim viability conditions, limitation period calculations, or protected disclosure requirements), the system generates corresponding Gherkin feature files with Given/When/Then steps that exercise every rule path. This closes the loop between rule definition and test coverage -- when a new Datalog rule is added, the test suite automatically grows to cover it. The generator analyses the rule's input relations and output relations to synthesize meaningful scenario names and step definitions.

## Provenance

Derived from two sources: SR-00041 (14 BDD scenarios already identified for legal rule testing) and SR-00028 (Ascent Datalog as the rule engine for legal reasoning). The insight is that these two concerns are mechanically linked -- every Datalog rule implies a set of test scenarios covering its positive and negative paths. Currently, BDD scenarios are written manually, creating a maintenance burden and coverage gaps. Automating this connection eliminates the gap between rule definition and verification. Feasibility is low (4) because Ascent's macro-based DSL makes static analysis of rule structure challenging.

## Connection

Connects the `ascent` Datalog rule engine (used for legal reasoning in `legal_analysis`) with the BDD testing infrastructure. The generated Gherkin files would feed into the existing `tests/` structure. This idea also relates to the property testing approach in `tests/property_tests/` -- auto-generated BDD scenarios complement property tests by providing human-readable rule coverage. The high novelty score (9) reflects that rule-to-test generation from Datalog is an uncommon pattern, even in academic literature.

## Next Steps

1. Prototype a Datalog rule parser that extracts input/output relation schemas from Ascent macro invocations
2. Define a mapping from relation schemas to Gherkin Given/When/Then templates
3. Implement the generator as a build-time tool (not runtime) producing `.feature` files
4. Validate against the 14 existing BDD scenarios from SR-00041 to ensure generated output matches hand-written quality
5. Add negative-path generation (what happens when rule preconditions are not met)
