---
id: HY-00017
title: "CI grep check detects multiple MemoryManager init calls per crate preventing dual-manager bug"
status: complete
updated: 2026-03-24
created: 2026-03-24
idea: ID-00018
tags: [memory-manager, lint, ci, stable-structures, safety]
prediction: "CI script flags any crate with >1 MemoryManager::init call"
metric: "count of MemoryManager::init calls per canister crate"
success_criteria: "exactly 1 per canister crate, CI fails if >1 detected in any crate"
---

## Hypothesis

If we add a CI script that counts `MemoryManager::init` calls per canister crate and fails when any crate has more than one, then the dual-MemoryManager bug class (SR-00035) is prevented from recurring.

## Rationale

SR-00035 documented a critical bug where `legal_analysis` had two `MemoryManager::init(DefaultMemoryImpl::default())` calls causing overlapping virtual memory. ID-00018 proposes compile-time detection. A simple `rg` count per crate is the fastest path to prevention — no custom lint needed, just a CI script.

## Testing Plan

1. Write script: for each canister in src/*, count `rg 'MemoryManager::init' src/<canister>/src/ --count`
2. Assert each count is exactly 1
3. Verify pass: current codebase (all fixed) should pass
4. Verify fail: temporarily add a second `MemoryManager::init` to a test file — script should fail
5. Add to `mise.toml` as `mise run check-memory-managers`

## Success Criteria

- Primary: script detects dual init in any crate (exit non-zero)
- Secondary: current codebase passes (all canisters have exactly 1)
- Tertiary: runs in <5 seconds (just grep, no compilation)

## Risks

- False positive: test files or comments containing `MemoryManager::init` — filter to non-test .rs files
- Edge case: some canisters may use a helper module that's technically in the same crate but a different file — still only 1 init should exist
