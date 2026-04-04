---
id: EX-00030
title: "Implement step definitions for 14 BDD scenarios and measure pass rate of 61 Gherkin steps"
status: draft
created: 2026-03-27
hypothesis: HY-00018
algorithm: ""
tags: [bdd, cucumber, gherkin, statutory-calculations, settlement, deadline-alerts, awen-uk-employment, testing]
methodology: "Read all 7 feature files (26 scenarios, 107 steps), implement Rust step definitions calling _impl functions from settlement, deadline_alerts, and awen_uk_employment, run cucumber runner, count passing vs failing steps"
duration: "8 hours"
success_criteria: "All step definitions implemented; pass rate measured for all scenarios; failures documented with root cause per failing step"
---

## Objective

Validate that the existing canister calculation logic correctly implements UK employment law statutory rules by running BDD scenarios against the `_impl` functions. The hypothesis (HY-00018) targets 14 scenarios with 61 steps across 3 feature files. The actual codebase has expanded to 7 feature files with 26 scenarios and 107 steps. This experiment implements step definitions for all available scenarios and measures the first-run pass rate, confirming the business logic without modifying any canister code.

## Methodology

1. **Inventory all BDD feature files and count scenarios/steps**
   ```bash
   cd /mnt/media_backup/PROJECTS/awen-network-canisters
   # List feature files
   ls tests/bdd/features/
   # Count scenarios per file
   rg 'Scenario:' tests/bdd/features/ --count
   # Count steps per file (Given/When/Then/And)
   rg '^\s+(Given|When|Then|And) ' tests/bdd/features/ --count
   ```
   Expected: 7 files, 26 scenarios, 107 steps.

2. **Read each feature file to extract unique step patterns**
   ```bash
   # Extract all unique step text patterns
   rg '^\s+(Given|When|Then|And) (.+)' tests/bdd/features/ -o --no-filename | sort -u
   ```
   Group steps by domain: basic award, compensatory award, ACAS deadlines, settlement valuation, redundancy pay, notice periods, injury to feelings.

3. **Review the existing cucumber runner configuration**
   ```bash
   cat tests/bdd/Cargo.toml
   # Check for existing step definitions
   ls tests/bdd/src/ 2>/dev/null
   cat tests/bdd/tests/cucumber_runner.rs 2>/dev/null
   ```

4. **Implement step definitions calling _impl functions**
   ```rust
   // tests/bdd/tests/cucumber_runner.rs (or equivalent)
   // Each Given/When/Then maps to a _impl function call:
   //
   // Given "an employee with {int} complete years of service"
   //   -> store years_of_service in World state
   //
   // When "the basic award is calculated"
   //   -> call awen_uk_employment::calculate_basic_award_impl(...)
   //
   // Then "the basic award should be {int} pounds"
   //   -> assert result.basic_award_pence == expected * 100
   //
   // Domain mapping:
   //   basic_award.feature -> awen_uk_employment basic award functions
   //   compensatory_award.feature -> settlement::calculate_compensatory_award_impl
   //   acas_deadlines.feature -> deadline_alerts::calculate_acas_deadline_impl
   //   settlement_valuation.feature -> settlement::calculate_settlement_value_impl
   //   redundancy_pay.feature -> awen_uk_employment redundancy pay functions
   //   notice_periods.feature -> awen_uk_employment notice period functions
   //   injury_to_feelings.feature -> settlement injury to feelings band calculations
   ```

5. **Run the cucumber test suite**
   ```bash
   # Build the BDD test crate
   cargo nextest run -p awen-bdd-tests --run-ignored 2>&1 | tee /tmp/bdd-results.txt
   # Or if cucumber needs special runner:
   cargo test -p awen-bdd-tests --test cucumber_runner -- --nocapture 2>&1 | tee /tmp/bdd-results.txt
   ```

6. **Analyze results: count passing vs failing steps**
   ```bash
   # Parse cucumber output for pass/fail counts
   rg 'passed|failed|skipped|undefined' /tmp/bdd-results.txt
   # For each failing step: document the root cause
   # Categories: _impl signature mismatch, calculation error, step definition bug, missing function
   ```

## Setup

- Working directory: `/mnt/media_backup/PROJECTS/awen-network-canisters`
- Branch: `experiment/ex-00030-bdd-step-definitions`
- Dependencies: `cucumber 0.22` (already in workspace), `awen_types`, `chrono`, `tokio`
- BDD crate: `tests/bdd/` (Cargo.toml already configured with `cucumber_runner` test harness)
- Feature files (7):
  - `tests/bdd/features/basic_award.feature` (3 scenarios, 12 steps)
  - `tests/bdd/features/compensatory_award.feature` (4 scenarios, 16 steps)
  - `tests/bdd/features/acas_deadlines.feature` (3 scenarios, 14 steps)
  - `tests/bdd/features/settlement_valuation.feature` (4 scenarios, 19 steps)
  - `tests/bdd/features/redundancy_pay.feature` (4 scenarios, 17 steps)
  - `tests/bdd/features/notice_periods.feature` (4 scenarios, 12 steps)
  - `tests/bdd/features/injury_to_feelings.feature` (4 scenarios, 17 steps)
- Target _impl functions: in `packages/awen_uk_employment/`, `src/settlement/src/`, `src/deadline_alerts/src/`
- Note: BDD test crate has relaxed lints (`unwrap_used = "allow"`, `panic = "allow"`)

## Algorithm

No specific AL- entry. Uses the BDD testing pattern: feature files describe behavior in natural language (Gherkin), step definitions translate each step into Rust function calls against _impl functions. The cucumber 0.22 crate provides the runner that parses feature files and invokes step definitions. Key constraint: step definitions must ONLY call existing _impl functions -- no canister code changes.

## Success Criteria

- [ ] All 7 feature files inventoried with scenario and step counts
- [ ] Unique step patterns extracted and grouped by domain
- [ ] Step definitions implemented for basic_award.feature scenarios
- [ ] Step definitions implemented for compensatory_award.feature scenarios
- [ ] Step definitions implemented for acas_deadlines.feature scenarios
- [ ] Step definitions implemented for settlement_valuation.feature scenarios
- [ ] Step definitions implemented for redundancy_pay.feature scenarios
- [ ] Step definitions implemented for notice_periods.feature scenarios
- [ ] Step definitions implemented for injury_to_feelings.feature scenarios
- [ ] Cucumber runner executes all 26 scenarios
- [ ] Pass rate measured: {passing_steps}/{total_steps} documented
- [ ] Each failing step has root cause documented (calculation error vs step definition bug vs missing function)
- [ ] No canister code (src/) modified -- step definitions only

## Data Collection

| Metric | Target | Actual |
|--------|--------|--------|
| Feature files | 7 | TBD |
| Total scenarios | 26 | TBD |
| Total steps | 107 | TBD |
| Unique step patterns | TBD (inventory) | TBD |
| Step definitions implemented | 107/107 | TBD |
| Passing steps | 107/107 (ideal) | TBD |
| Failing steps | 0 (ideal) | TBD |
| Undefined/skipped steps | 0 | TBD |
| Canister code changes | 0 | TBD |

## Risks & Mitigations

- **_impl functions may not accept the exact input format Gherkin specifies**: Feature files use human-readable values like "12,345 pounds" while _impl functions expect pence as integers. Mitigation: step definitions handle the conversion (pounds to pence, date strings to NaiveDate, etc.).
- **Some _impl functions may not be pub or accessible from the BDD crate**: canister _impl functions may have crate-private visibility. Mitigation: check visibility with `rg 'fn.*_impl' src/ | rg -v 'pub'`. If private, the BDD crate can use `integration_test` feature which may re-export internals.
- **cucumber 0.22 runner integration with nextest**: nextest may not support the custom harness. Mitigation: use `cargo test -p awen-bdd-tests --test cucumber_runner` directly (harness = false in Cargo.toml).
- **Feature files may reference calculations not yet implemented**: Some statutory calculations (injury to feelings bands, redundancy pay) may be in different canisters or not yet implemented. Mitigation: document which steps map to which functions during inventory; mark missing functions as "undefined" in results.
- **HY-00018 says 14 scenarios/61 steps but codebase has 26/107**: The hypothesis was written before additional feature files were added. Mitigation: test all available scenarios (26/107) and note the discrepancy. Original 3-file subset results can be reported separately for direct hypothesis validation.

## Results

(Fill in after running)

## Analysis

(Fill in after running)

## Next Steps

If 100% pass: create RE- result confirming all statutory calculations are correct. Add BDD tests to CI. If partial failures: classify failures as (a) genuine calculation bugs -- file issues, (b) step definition adapter errors -- fix definitions, (c) missing functions -- create HY- for implementing them. Consider creating AL- entry for "BDD-driven statutory validation pattern".
