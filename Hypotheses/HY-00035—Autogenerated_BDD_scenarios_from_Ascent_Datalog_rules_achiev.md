---
id: HY-00035
title: "Auto-generated BDD scenarios from Ascent Datalog rules achieve 80 percent first-run pass rate against existing canister logic"
status: draft
created: 2026-03-27
idea: ID-00011
tags: [datalog, bdd, cucumber, test-generation, legal-rules]
prediction: "A generator that reads Ascent rule input/output relations from legal_analysis/src/rules.rs produces valid Gherkin scenarios where 80%+ pass against existing canister logic on first run"
metric: "Percentage of auto-generated BDD scenarios that pass without manual modification"
success_criteria: "Of all generated scenarios from TimeLimitRules and ClaimViabilityRules, at least 80% pass against existing legal_analysis _impl functions"
---

## Hypothesis

If we build a generator that reads the Ascent Datalog rule definitions in legal_analysis/src/rules.rs (TimeLimitRules and ClaimViabilityRules) and produces Gherkin Given/When/Then scenarios by mapping input relations to Given steps and derived relations to Then assertions, then at least 80% of generated scenarios pass against the existing canister calculation logic on first run, proving that rules and tests are dually derivable.

## Rationale

legal_analysis/src/rules.rs contains two Ascent programs: TimeLimitRules (with relations: time_limit, filing_date, acas_certificate, acas_extension_days -> in_time, out_of_time, acas_extended) and ClaimViabilityRules (claim viability, strength, relationships, remedy eligibility). Each rule has explicit input relations (facts) and derived relations (conclusions). A Datalog rule like `in_time(claim) <-- time_limit(claim, limit), filing_date(claim, days), if days <= limit` mechanically maps to: "Given a claim with time_limit=90 and filing_date=85, When claim viability is assessed, Then claim is in_time." The 14 existing BDD scenarios (HY-00018) serve as the validation baseline -- generated scenarios should be at least as specific.

## Testing Plan

1. Parse rules.rs to extract all `relation` declarations and rule bodies (input vs derived)
2. For each rule, generate positive scenario (all conditions met -> derived relation holds) and negative scenario (one condition fails -> derived relation absent)
3. Map relation names to Gherkin steps using a template: relation `time_limit(claim, 90)` -> `Given a "{claim}" with time limit of 90 days`
4. Generate .feature files in tests/ directory
5. Write step definitions that call the corresponding _impl functions
6. Run generated scenarios, measure pass rate

## Success Criteria

- Generator produces at least 2 scenarios per Datalog rule (positive + negative path)
- At least 80% of generated scenarios pass on first run without manual editing
- Generated scenarios cover all input relations in both TimeLimitRules and ClaimViabilityRules
- No hand-written step definitions needed beyond the template mapping

## Risks

- Ascent uses Rust macros; parsing rule structure from source text (not AST) may miss edge cases
- Some rules have complex conditions (`if *days <= *limit`) that need numeric test data generation
- ClaimViabilityRules may have inter-dependent rules where testing one requires seeding facts for another
- Generated Gherkin may be syntactically valid but semantically weak (testing obvious tautologies)
