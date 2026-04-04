---
id: EX-00020
title: "Measure AST-aware Call classification accuracy against manual ground truth of 20 call sites"
status: draft
created: 2026-03-27
hypothesis: HY-00032
algorithm: AL-00007
tags: [ladder, pollinator, ast, call-classification, inter-canister]
methodology: "Manually label all 20 Call::bounded_wait sites as write/read, build context-aware classifier using enclosing function attributes, compare classifier output against ground truth"
duration: "3 hours"
success_criteria: "Classifier correctly labels at least 80% of call sites (16+/20); false positive rate drops below 20%; zero false negatives on write calls"
---

## Objective

Validate that classifying `Call::bounded_wait` sites by surrounding context (whether the call is inside an `#[update]` vs `#[query]` function, the called method name, and whether the return value is used for reads vs writes) reduces pollinator false positive source entries by 80%. The current grep-based pollinator flags all 20 call sites as reliability gaps; many are read-only queries that do not need idempotency protection.

## Methodology

1. **Baseline: enumerate and manually label all Call::bounded_wait sites**
   ```bash
   cd /mnt/media_backup/PROJECTS/awen-network-canisters
   grep -rn 'Call::bounded_wait' src/*/src/lib.rs > /tmp/call-sites.txt
   wc -l /tmp/call-sites.txt
   # Expected: ~20 call sites
   ```
   Manual classification ground truth (from code review):
   - `case_hub/lib.rs:792` -- `get_stats` (READ: query call fetching stats)
   - `case_hub/lib.rs:805` -- `get_active_deadlines` (READ: query)
   - `case_hub/lib.rs:885` -- `get_active_deadlines` (READ: query)
   - `legal_analysis/lib.rs:1016` -- `get_case_summary` (READ: query)
   - `legal_analysis/lib.rs:1029` -- `get_upcoming_hearings` (READ: query)
   - `legal_analysis/lib.rs:1042` -- `get_suppression_profile` (READ: query)
   - `legal_analysis/lib.rs:1055` -- `list_deadlines` (READ: query)
   - `legal_analysis/lib.rs:1067` -- `get_stats` (READ: query)
   - `legal_analysis/lib.rs:1283` -- `get_case_summary` (READ: query)
   - `legal_analysis/lib.rs:1401` -- `search_metadata` (READ: query)
   - `legal_analysis/lib.rs:2909` -- `v1_chat` (WRITE: external LLM call with side effects)
   - `deadline_alerts/lib.rs:832` -- `add_event` (WRITE: creates timeline event)
   - `mcp_gateway/lib.rs:1373` -- dynamic dispatch (WRITE: routes to update methods)
   - `mcp_gateway/lib.rs:2076` -- dynamic dispatch (WRITE: routes to update methods)
   - `case_timeline/lib.rs:123` -- `evidence_exists` (READ: existence check)
   - `case_timeline/lib.rs:183` -- `system_add_deadline` (WRITE: creates deadline)
   - `case_timeline/lib.rs:1635` -- `evidence_exists` (READ: existence check)
   Save as `ladder/Experiments/data/ex-00020-ground-truth.json`

2. **Build context-aware classifier** (describe changes only)
   - File: `ladder/Tools/call-classifier/classify.ts`
   - For each Call::bounded_wait site, extract:
     a. Enclosing function's attribute (`#[update]` or `#[query]`)
     b. Called method name (second argument to Call::bounded_wait)
     c. 20 lines of surrounding context
   - Classification rules:
     - If enclosing function is `#[query]`: classify as READ
     - If called method starts with `get_`, `list_`, `search_`, `*_exists`: classify as READ
     - If called method starts with `add_`, `store_`, `create_`, `update_`, `delete_`: classify as WRITE
     - Dynamic dispatch (variable method): classify as WRITE (conservative)
     - LLM calls: classify as WRITE

3. **Run classifier**
   ```bash
   bun run ladder/Tools/call-classifier/classify.ts > /tmp/classifications.json
   ```

4. **Compare against ground truth**
   ```bash
   bun run ladder/Tools/call-classifier/evaluate.ts \
     --ground-truth ladder/Experiments/data/ex-00020-ground-truth.json \
     --predictions /tmp/classifications.json
   # Output: TP, FP, FN, TN, precision, recall, F1
   ```

5. **Measure false positive reduction**
   ```bash
   # Baseline FP rate: current pollinator flags all 20 as WRITE (needing idempotency)
   # True WRITE count from ground truth: ~7
   # Baseline FP: 13/20 = 65%
   # After classifier: target FP < 20% (i.e., < 4 READ sites misclassified as WRITE)
   ```

## Setup

- Working directory: `/mnt/media_backup/PROJECTS/awen-network-canisters`
- No branch needed -- tooling in `ladder/Tools/`, no canister code changes
- Dependencies: none (rule-based classifier in TypeScript, no LLM needed for v1)
- Key source files with Call::bounded_wait sites:
  - `src/case_hub/src/lib.rs` (3 sites)
  - `src/legal_analysis/src/lib.rs` (8 sites)
  - `src/deadline_alerts/src/lib.rs` (1 site)
  - `src/mcp_gateway/src/lib.rs` (2 sites)
  - `src/case_timeline/src/lib.rs` (3 sites)
  - `src/procedural_intel/src/lib.rs` (1 site, commented out)

## Algorithm

Extends AL-00007 (grep-based detection). The key improvement is context-aware classification: instead of flagging all Call:: sites, read the enclosing function's IC attribute and the called method name to distinguish read-only queries from state-mutating writes. Only WRITE calls need idempotency protection.

## Success Criteria

- [ ] Ground truth labels created for all 20 Call::bounded_wait sites
- [ ] Classifier correctly labels at least 80% of sites (16+/20)
- [ ] False positive rate (READ calls flagged as WRITE) drops below 20%
- [ ] Zero false negatives (no WRITE calls misclassified as READ)
- [ ] Classifier handles dynamic dispatch conservatively (labels as WRITE)
- [ ] Classification runs in under 5 seconds

## Data Collection

| Metric | Baseline (grep-only) | After (context-aware) |
|--------|---------------------|----------------------|
| Total Call::bounded_wait sites | 20 | 20 |
| Flagged as needing idempotency | 20 (all) | TBD (target: ~7) |
| True WRITE sites | ~7 | ~7 |
| True READ sites | ~13 | ~13 |
| False positives (READ flagged as WRITE) | 13 (65%) | TBD (target: <4, <20%) |
| False negatives (WRITE missed) | 0 | 0 |
| Precision (WRITE classification) | 35% | TBD (target: >80%) |
| Recall (WRITE classification) | 100% | 100% |

## Risks & Mitigations

- **Ambiguous call sites**: Some Call::bounded_wait calls read data that influences subsequent writes (e.g., `get_case_summary` result used to decide whether to create a timeline event). Mitigation: classify based on the called method, not the usage of the return value. Reading for decision-making is still READ.
- **IC macro complexity**: `#[update]` and `#[query]` attributes may be applied via custom macros that are harder to detect with grep. Mitigation: also check for `#[ic_cdk::update]` and `#[ic_cdk::query]` patterns.
- **Dynamic dispatch in mcp_gateway**: The 2 mcp_gateway sites use a runtime-variable method name, making static classification impossible. Mitigation: classify as WRITE conservatively (acceptable false positive for security).
- **Commented-out call sites**: The procedural_intel site is commented out. Mitigation: exclude commented lines from analysis.

## Results

(Fill in after running)

## Analysis

(Fill in after running)

## Next Steps

If classifier achieves >80% accuracy: integrate into pollinator as a filter stage, create AL- entry for the classification methodology. If accuracy is lower: try LLM-based classification (as in EX-00016) instead of rule-based. Create RE- result entry either way.
