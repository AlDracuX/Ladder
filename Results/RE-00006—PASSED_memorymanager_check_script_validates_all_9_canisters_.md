---
id: RE-00006
title: "PASSED: memory-manager check script validates all 9 canisters have exactly 1 init"
status: complete
created: 2026-03-24
experiment: EX-00006
outcome: success
tags: [memory-manager, ci, stable-structures, safety]
loops_to: [AL-00013]
---

## Summary

Created `scripts/check-memory-managers.sh` which verifies each canister crate has exactly one `awen_storage!` macro invocation (the consolidated MemoryManager pattern). All 9 canisters pass. HY-00017 validated.

## Data

| Canister | awen_storage! count | Status |
|----------|-------------------|--------|
| evidence_vault | 1 | OK |
| case_timeline | 1 | OK |
| deadline_alerts | 1 | OK |
| reference_shield | 1 | OK |
| mcp_gateway | 1 | OK |
| legal_analysis | 1 | OK |
| procedural_intel | 1 | OK |
| case_hub | 1 | OK |
| settlement | 1 | OK |

## Analysis

The script checks for `awen_storage!` (the project's MemoryManager wrapper macro) rather than raw `MemoryManager::init`, because the codebase standardized on the macro. This is more accurate and avoids false positives from comments or test code. Runs in <1 second (just grep).

## Outcome

**PASSED** — HY-00017 validated. The dual-MemoryManager bug class (SR-00035) is now preventable via CI.

## Lessons Learned

- Checking for the project's own macro (`awen_storage!`) is more reliable than checking the underlying API
- All 9 canisters already follow the consolidated pattern — the script guards against regression
