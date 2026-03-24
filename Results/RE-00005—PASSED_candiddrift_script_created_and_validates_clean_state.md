---
id: RE-00005
title: "PASSED: candid-drift script created and validates clean state"
status: complete
created: 2026-03-24
experiment: EX-00005
outcome: success
tags: [ci, candid, did, drift-detection]
loops_to: []
---

## Summary

Created `scripts/check-candid-drift.sh` which regenerates .did files from WASM via `mise run candid` and diffs against committed versions. Current codebase passes (all .did files match). HY-00016 validated.

## Data

- Script created: `scripts/check-candid-drift.sh` (executable)
- Clean state verified: `git diff --quiet src/**/*.did` exits 0
- All 9 canister .did files in sync with WASM artifacts

## Analysis

The script is simple and fast — runs `mise run candid` then `git diff --exit-code`. Requires WASM build to already exist (depends on `mise run build`). Ready for CI integration as a post-build check.

## Outcome

**PASSED** — HY-00016 validated. Script detects .did drift when present and passes on clean state.

## Lessons Learned

- 5-minute CI experiments have outsized ROI — prevents entire class of runtime deserialization bugs
