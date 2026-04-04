---
id: EX-00023
title: "Generate BDD scenarios from Ascent Datalog rules and measure first-run pass rate against canister logic"
status: draft
created: 2026-03-27
hypothesis: HY-00035
algorithm: ""
tags: [datalog, bdd, gherkin, test-generation, legal-rules, ascent, legal-analysis]
methodology: "Parse Ascent rule definitions from legal_analysis/src/rules.rs, generate positive and negative Gherkin scenarios per rule, write step definitions calling _impl functions, measure first-run pass rate"
duration: "6 hours"
success_criteria: "Generator produces 2+ scenarios per rule; at least 80% pass on first run; all input relations covered; no hand-written step definitions beyond template mapping"
---

## Objective

Validate that a generator reading Ascent Datalog rule definitions (TimeLimitRules and ClaimViabilityRules) from `legal_analysis/src/rules.rs` can produce valid Gherkin Given/When/Then scenarios that pass at 80%+ rate against existing canister calculation logic on first run, proving that rules and tests are dually derivable from the same source.

## Methodology

1. **Baseline: document existing Ascent rules and their structure**
   ```bash
   cd /mnt/media_backup/PROJECTS/awen-network-canisters
   # Extract all relation declarations from rules.rs
   grep -n 'relation ' src/legal_analysis/src/rules.rs
   # Extract all rule bodies (lines containing <--)
   grep -n '<--' src/legal_analysis/src/rules.rs
   # Count total rules in TimeLimitRules and ClaimViabilityRules
   ```

2. **Document the rule-to-scenario mapping template**
   ```
   Rule pattern:
     derived_relation(args) <-- input_rel1(args1), input_rel2(args2), if condition

   Maps to positive scenario:
     Feature: {derived_relation}
     Scenario: {derived_relation} holds when all conditions met
       Given a claim with {input_rel1} of {test_value1}
       And a claim with {input_rel2} of {test_value2}
       When the rules engine is run
       Then {derived_relation} is derived

   Maps to negative scenario:
     Scenario: {derived_relation} absent when {input_rel1} missing
       Given a claim with {input_rel2} of {test_value2}
       When the rules engine is run
       Then {derived_relation} is NOT derived
   ```

3. **Build the generator** (describe, not implement)
   - File: `ladder/Tools/bdd-generator/generate.ts`
   - Parse `rules.rs` to extract:
     a. `relation` macro invocations (name, arity, types)
     b. Rule bodies (derived <- input conditions)
     c. Conditions (if expressions with operators)
   - For each rule, generate:
     a. Positive scenario with concrete test values satisfying all conditions
     b. Negative scenario with one condition violated per scenario
   - Output: `.feature` files in `tests/bdd/generated/`
   - Test value generation: boundary values for numeric conditions (e.g., `if days <= limit` generates `days = limit` for positive, `days = limit + 1` for negative)

4. **Build step definitions** (describe, not implement)
   - File: `tests/bdd/steps.rs`
   - Template mapping:
     - `Given a claim with time_limit of {N} days` -> `TimeLimitRules::new().time_limit.push((claim_id, N))`
     - `When the rules engine is run` -> `rules.run()`
     - `Then in_time is derived` -> `assert!(!rules.in_time.is_empty())`
   - Step definitions generated from the same relation declarations as the scenarios

5. **Run generated scenarios**
   ```bash
   # Using cucumber-rs or a lightweight BDD runner
   cargo nextest run -p tests -E 'test(/bdd_generated/)' --no-capture 2>&1
   # Record: total scenarios, passed, failed
   ```

6. **Measure first-run pass rate**
   ```bash
   # Count passing scenarios / total scenarios
   # Target: >= 80%
   # Analyze failures: are they generator bugs, data bugs, or actual logic gaps?
   ```

7. **Cross-reference with existing BDD tests**
   ```bash
   # Compare generated scenarios against existing 14 BDD scenarios (HY-00018)
   # Verify generated scenarios are at least as specific
   ls tests/bdd/*.feature 2>/dev/null | wc -l
   ```

## Setup

- Working directory: `/mnt/media_backup/PROJECTS/awen-network-canisters`
- No branch needed -- tooling in `ladder/Tools/`, generated tests in `tests/bdd/generated/`
- Dependencies: `cucumber-rs` crate (for BDD test runner), bun for generator
- Key source files:
  - `src/legal_analysis/src/rules.rs` -- Ascent Datalog rules (TimeLimitRules, ClaimViabilityRules)
  - `src/legal_analysis/src/lib.rs` -- _impl functions that use the rules
- Existing BDD tests (if any): `tests/bdd/`

## Algorithm

No specific AL- entry. The generator uses structural parsing of Ascent macro syntax -- not full Rust AST parsing -- to extract rule definitions. Each Ascent `relation` declaration defines inputs/outputs; each rule body (`<--`) defines the transformation. The generator treats each rule as a function specification: inputs (Given), computation (When), outputs (Then).

## Success Criteria

- [ ] Generator parses all relation declarations from TimeLimitRules
- [ ] Generator parses all relation declarations from ClaimViabilityRules
- [ ] At least 2 scenarios generated per Datalog rule (positive + negative)
- [ ] All input relations covered by at least one scenario
- [ ] At least 80% of generated scenarios pass on first run without manual editing
- [ ] Step definitions generated from same templates as scenarios (no hand-written steps)
- [ ] Generated .feature files are valid Gherkin syntax

## Data Collection

| Metric | Target | Actual |
|--------|--------|--------|
| Total Ascent rules parsed | All in rules.rs | TBD |
| Total scenarios generated | 2+ per rule | TBD |
| Scenarios passed (first run) | 80%+ | TBD |
| Scenarios failed (first run) | <20% | TBD |
| Failure categories: generator bug | 0 | TBD |
| Failure categories: data bug | TBD | TBD |
| Failure categories: logic gap | TBD | TBD |
| Input relations covered | 100% | TBD |
| Hand-written step definitions | 0 | TBD |

## Risks & Mitigations

- **Ascent macro parsing complexity**: Ascent uses Rust macros; parsing rule structure from source text (not AST) may miss edge cases like multi-line rules, nested conditions, or comment-embedded rules. Mitigation: start with simple regex-based parsing, manually verify against the actual rules.rs content.
- **Complex numeric conditions**: Some rules have conditions like `if *days <= *limit` that need test data generation with appropriate boundary values. Mitigation: generate boundary-value test data (limit, limit+1, limit-1) and type-specific defaults.
- **Inter-dependent rules**: ClaimViabilityRules may have rules where testing one requires seeding facts for another (e.g., claim viability depends on time limit check). Mitigation: topologically sort rules and seed all prerequisite facts.
- **Generated scenarios may be tautological**: Testing that `in_time` is derived when `days <= limit` with `days=30, limit=90` is trivially true. Mitigation: include boundary values and edge cases (days=limit, days=0, negative values).

## Results

(Fill in after running)

## Analysis

(Fill in after running)

## Next Steps

If 80%+ pass rate achieved: create AL- entry for the Datalog-to-BDD generation pattern, integrate into CI as `mise run bdd-generate`. If pass rate too low: analyze failure patterns -- if mostly data/boundary issues, improve the test data generator; if mostly logic gaps, document the gaps as new hypotheses. Create RE- result entry.
