---
id: EX-00016
title: "Build tree-sitter plus LLM query endpoint classifier and measure TPR-FPR against ground truth"
status: draft
created: 2026-03-27
hypothesis: HY-00009
algorithm: AL-00007
tags: [llm, query-audit, security, tree-sitter, semantic-analysis, ci-tooling]
methodology: "Extract all ~263 query _impl functions via tree-sitter, classify each with LLM, compare against manually labeled ground truth from SR-00037"
duration: "1 day"
success_criteria: "100% true positive rate on unfiltered endpoints, <5% false positive rate on filtered endpoints"
---

## Objective

Build a repeatable, CI-integratable pipeline that uses tree-sitter to extract `#[query]` endpoint `_impl` function bodies from all 9 canisters, then classifies each as "caller-filtered" or "unfiltered" using an LLM prompt. Validate against ground truth labels from the SR-00037 manual audit to measure true positive rate (TPR) and false positive rate (FPR).

## Methodology

1. **Build ground truth labels**
   ```bash
   cd /mnt/media_backup/PROJECTS/awen-network-canisters
   # Enumerate all #[query] endpoints across 9 canisters (~263 total):
   rg '#\[query\]' src/ -l
   # For each, identify the corresponding _impl function
   # Cross-reference with SR-00037 fix (which added caller filtering)
   # Create ground_truth.json: { "evidence_vault::list_evidence_impl": "filtered", ... }
   ```

2. **Build tree-sitter extractor** (TypeScript, bun)
   ```bash
   # Script: ladder/Tools/query-auditor/extract.ts
   # Uses tree-sitter-rust to parse each canister's lib.rs
   # Finds functions matching pattern: fn <name>_impl(...) where <name> has #[query] attribute
   # Extracts full function body as string
   # Output: JSON array of { canister, function_name, body, file, line }
   ```

3. **Build LLM classifier**
   ```bash
   # Script: ladder/Tools/query-auditor/classify.ts
   # For each extracted function:
   #   Prompt: "Analyze this Rust function. Does it filter returned data by the caller's
   #            Principal parameter? Look for: .filter(|entry| entry.value().owner == caller),
   #            .with(|s| s.borrow().get(&key)) where key includes caller, or similar patterns.
   #            Answer: FILTERED or UNFILTERED with a one-sentence justification."
   #   Parse response as { classification: "filtered"|"unfiltered", justification: string }
   ```

4. **Run classifier on all endpoints**
   ```bash
   bun run ladder/Tools/query-auditor/extract.ts > /tmp/query-functions.json
   bun run ladder/Tools/query-auditor/classify.ts < /tmp/query-functions.json > /tmp/classifications.json
   ```

5. **Compute metrics**
   ```bash
   # Script: ladder/Tools/query-auditor/evaluate.ts
   # Compare classifications.json against ground_truth.json
   # TP = classified unfiltered AND actually unfiltered
   # FP = classified unfiltered BUT actually filtered
   # FN = classified filtered BUT actually unfiltered
   # TN = classified filtered AND actually filtered
   # TPR = TP / (TP + FN), FPR = FP / (FP + TN)
   bun run ladder/Tools/query-auditor/evaluate.ts
   ```

6. **Measure execution time**
   ```bash
   time bun run ladder/Tools/query-auditor/extract.ts | bun run ladder/Tools/query-auditor/classify.ts > /dev/null
   # Target: < 2 minutes total
   ```

## Setup

- Working directory: `/mnt/media_backup/PROJECTS/awen-network-canisters`
- No branch needed -- this is a tooling experiment in `ladder/Tools/`, no canister code changes
- Dependencies: `tree-sitter`, `tree-sitter-rust` (bun packages), LLM API access (Claude API)
- Source files: 9 canister lib.rs files containing ~263 `#[query]` endpoints total:
  - `src/procedural_intel/src/lib.rs` (75 queries)
  - `src/evidence_vault/src/lib.rs` (40 queries)
  - `src/settlement/src/lib.rs` (25 queries)
  - `src/case_timeline/src/lib.rs` (24 queries)
  - `src/deadline_alerts/src/lib.rs` (22 queries)
  - `src/legal_analysis/src/lib.rs` (22 queries)
  - `src/case_hub/src/lib.rs` (20 queries)
  - `src/reference_shield/src/lib.rs` (19 queries)
  - `src/mcp_gateway/src/lib.rs` (12 queries)

## Algorithm

Extends AL-00007 (grep-based detection was too noisy per SR-00027). This experiment tests whether semantic LLM classification reduces false positives while maintaining 100% true positive rate.

## Success Criteria

- [ ] 100% TPR: every actually-unfiltered endpoint is flagged (zero false negatives)
- [ ] <5% FPR: no more than ~13 of ~263 filtered endpoints incorrectly flagged as unfiltered
- [ ] Total pipeline execution time < 2 minutes
- [ ] Ground truth labels cover all ~263 query endpoints
- [ ] Classifier handles complex patterns: multi-function filtering, helper-based scoping, closure-based access

## Data Collection

| Metric | Target | Actual |
|--------|--------|--------|
| Total query endpoints | ~263 | TBD |
| Ground truth: unfiltered | TBD (from SR-00037) | TBD |
| Ground truth: filtered | TBD | TBD |
| True Positives (TP) | = actual unfiltered | TBD |
| False Positives (FP) | < 5% of filtered | TBD |
| False Negatives (FN) | 0 | TBD |
| True Negatives (TN) | > 95% of filtered | TBD |
| TPR | 100% | TBD |
| FPR | < 5% | TBD |
| Execution time | < 2 min | TBD |
| API cost per run | TBD | TBD |

## Risks & Mitigations

- **LLM may not understand stable storage access patterns**: The `thread_local! { static STORE: RefCell<StableBTreeMap<...>> }` pattern with `.with(|s| s.borrow()...)` is IC-specific. Mitigation: include a brief explanation of the pattern in the system prompt.
- **Complex multi-function filtering**: Some endpoints delegate filtering to helper functions not visible in the `_impl` body. Mitigation: include helper function bodies in context (extract callees as well).
- **Cost per CI run**: Running LLM inference on ~263 functions adds API cost. Mitigation: cache classifications keyed by function body hash; only re-classify on code change.
- **Tree-sitter attribute association**: `#[query]` attribute may not be directly on the function (IC macros). Mitigation: also match on function naming convention (`_impl` suffix) and cross-reference with `.did` files.

## Results

(Fill in after running)

## Analysis

(Fill in after running)

## Next Steps

If TPR=100% and FPR<5%: package as `mise run query-audit` CI task, create AL- entry for the methodology. If FPR too high: experiment with different prompts, add more context per function, or try a two-stage classifier (grep pre-filter + LLM for ambiguous cases).
