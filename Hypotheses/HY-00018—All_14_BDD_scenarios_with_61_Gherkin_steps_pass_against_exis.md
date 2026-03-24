---
id: HY-00018
title: "All 14 BDD scenarios with 61 Gherkin steps pass against existing canister calculation logic"
status: active
updated: 2026-03-24
created: 2026-03-24
idea: ID-00015
tags: [bdd, cucumber, gherkin, statutory-calculations, testing]
prediction: "All 61 Gherkin steps execute and pass against existing canister calculation logic"
metric: "count of passing vs failing BDD steps"
success_criteria: "61/61 steps pass, 14/14 scenarios green"
---

## Hypothesis

If we implement Rust step definitions for the 3 BDD feature files (compensatory award, ACAS deadlines, settlement valuation), then all 14 scenarios with 61 Gherkin steps pass against the existing canister calculation logic without any canister code changes — validating that the business logic already implements the statutory rules correctly.

## Rationale

SR-00030 added cucumber 0.22 BDD framework. SR-00031 created 3 feature files with 14 scenarios. SR-00041 confirmed 61 steps total. ID-00015 proposes implementing step definitions. The feature files encode UK employment law rules (basic award, compensatory award, ACAS early conciliation deadlines, settlement valuation). If step definitions call the existing _impl functions and all pass, it confirms the codebase correctly implements these rules.

## Testing Plan

1. Read the 3 feature files in `tests/features/` to understand all Given/When/Then steps
2. Create step definition modules calling _impl functions from settlement, deadline_alerts, and awen_uk_employment
3. Run: `cargo nextest run -E 'test(/bdd/)' -p awen_bdd_tests` or equivalent cucumber runner
4. Count: passing steps / total steps, passing scenarios / total scenarios

## Success Criteria

- Primary: 61/61 steps pass
- Secondary: 14/14 scenarios green
- Tertiary: no canister code changes needed (step definitions only call existing _impl functions)

## Risks

- Step definitions may reveal that _impl functions don't accept the exact input format the Gherkin specifies — adapter code needed
- Some statutory calculations may have edge cases not covered by BDD scenarios — partial validation only
- cucumber 0.22 runner integration with nextest may require configuration
