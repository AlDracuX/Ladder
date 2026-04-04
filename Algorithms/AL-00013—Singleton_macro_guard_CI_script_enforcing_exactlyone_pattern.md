---
id: AL-00013
title: "Singleton macro guard: CI script enforcing exactly-one pattern per canister crate"
status: active
created: 2026-03-27
domain: icp-canister-ci
tags: [memory-manager, ci, stable-structures, safety, singleton, lint]
experiments: [EX-00006]
complexity: low
---

## Description

A CI guard pattern that enforces singleton initialization of critical resources (e.g., `MemoryManager`) across canister crates. The script counts occurrences of a specific macro or initialization call per crate and fails if any crate has more than one. This prevents the dual-MemoryManager bug class where two separate MemoryManager instances in the same canister silently corrupt stable storage by assigning overlapping memory IDs.

Chain: EX-00006 -> HY-00017 -> SR-00035

## Method

1. **Define the target pattern** -- identify the macro or function call that must appear exactly once per crate. In this project, that is `awen_storage!` (the consolidated MemoryManager wrapper macro).

2. **Iterate all canister crate directories**:

```bash
CANISTERS="evidence_vault case_timeline deadline_alerts reference_shield mcp_gateway legal_analysis procedural_intel case_hub settlement"
```

3. **Count occurrences per crate**, excluding test files:

```bash
for canister in $CANISTERS; do
    count=$(rg 'awen_storage!' "src/$canister/src" --glob '!*test*' -c \
        | awk -F: '{sum+=$2} END {print sum+0}')
done
```

4. **Classify results**:
   - Exactly 1: OK (correct singleton pattern)
   - 0: WARNING (macro missing -- may indicate incomplete migration)
   - Greater than 1: ERROR (duplicate initialization -- fail CI)

5. **Exit with appropriate code**:
   - Exit 0 if all canisters have exactly 1 occurrence
   - Exit 1 if any canister has more than 1 (the dangerous case)

## When to Use

- Any ICP canister project using `ic-stable-structures` MemoryManager (singleton requirement)
- Projects with a consolidation macro wrapping MemoryManager initialization
- CI pipelines that need to guard against accidental duplication of singleton resources
- Any codebase where a specific pattern must appear exactly N times per module/crate

## When NOT to Use

- Projects where multiple MemoryManager instances per canister are intentional (rare/unusual)
- Canisters not using stable storage (no MemoryManager at all)
- Projects without a standardized macro (would need to grep for raw API calls, which is less reliable)

## Inputs

- List of canister crate directories (e.g., `src/evidence_vault/src`)
- Target pattern string (e.g., `awen_storage!`)
- `rg` (ripgrep) for fast pattern counting

## Outputs

- Per-canister status table: canister name, occurrence count, OK/WARNING/ERROR classification
- Exit code 0: All canisters pass (exactly 1 occurrence each)
- Exit code 1: At least one canister has duplicate initialization

## Limitations

- Pattern matching is syntactic, not semantic -- comments containing the pattern string will be counted
- Excluding test files via glob (`!*test*`) may miss unconventional test file naming
- Only checks for the project-specific macro (`awen_storage!`), not the underlying `MemoryManager::init` call directly
- Does not detect the case where MemoryManager is initialized via a different code path (e.g., a helper function that wraps init)
- Runs in under 1 second (just grep) -- negligible CI overhead

## Evidence

- **EX-00006**: Created `scripts/check-memory-managers.sh` implementing this pattern. All 9 canisters verified with exactly 1 `awen_storage!` invocation.
- **RE-00006**: PASSED -- HY-00017 validated. The dual-MemoryManager bug class (SR-00035) is now preventable via CI. Checking the project's own macro is more reliable than checking the underlying API.
- Script location: `scripts/check-memory-managers.sh`
