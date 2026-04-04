---
id: AL-00012
title: "Candid drift detection: regenerate-and-diff CI guard for .did file consistency"
status: active
created: 2026-03-27
domain: icp-canister-ci
tags: [ci, candid, did, drift-detection, build-pipeline, wasm]
experiments: [EX-00005]
complexity: low
---

## Description

A CI guard pattern that detects when committed Candid interface files (.did) have drifted from the actual WASM canister implementations. The script regenerates .did files from compiled WASM artifacts and diffs them against the committed versions. Any discrepancy causes CI failure, preventing an entire class of runtime deserialization bugs where the declared interface no longer matches the compiled code.

Chain: EX-00005 -> HY-00016

## Method

1. **Prerequisite**: Ensure WASM build artifacts exist (the script depends on a prior `mise run build` step).

2. **Regenerate Candid interfaces** from WASM using the project's candid extraction tooling:

```bash
mise run candid  # Runs candid-extractor on all 9 canister WASMs
```

3. **Diff against committed versions** using git:

```bash
git diff --quiet src/**/*.did
```

4. **Report and exit**:
   - Exit 0 if all .did files match their WASM-generated versions (clean state)
   - Exit 1 with diff stats if any .did file has drifted (stale interface)

5. **Integrate into CI pipeline** as a post-build check (must run after WASM compilation but before deployment).

## When to Use

- Any ICP canister project where Candid interfaces are committed to version control
- CI pipelines that build WASM artifacts and need to verify interface consistency
- Projects with multiple canisters where manual .did maintenance is error-prone
- Pre-merge checks to catch forgotten `mise run candid` after changing canister APIs

## When NOT to Use

- Projects that auto-generate .did at deploy time (no committed .did files to drift)
- Single-canister projects where manual verification is sufficient
- Environments without `candid-extractor` or equivalent tooling

## Inputs

- Compiled WASM artifacts for all canisters (from `mise run build`)
- Committed `.did` files under `src/*/` directories
- `candid-extractor` tool (extracts Candid interface from WASM binary)

## Outputs

- Exit code 0: All .did files are consistent with compiled WASM
- Exit code 1: One or more .did files have drifted, with diff output showing exact changes
- Human-readable summary of which files drifted (when failing)

## Limitations

- Requires a successful WASM build before running (cannot check drift without artifacts)
- Only detects drift in committed files -- does not catch missing .did files for new canisters
- Depends on `candid-extractor` producing deterministic output (non-deterministic extraction would cause false positives)
- Runtime is proportional to the number of canisters (currently <60s for 9 canisters)
- Does not validate semantic compatibility (only byte-level .did equality)

## Evidence

- **EX-00005**: Created `scripts/check-candid-drift.sh` implementing this pattern. Script validated on clean codebase (exit 0 for all 9 canisters).
- **RE-00005**: PASSED -- HY-00016 validated. All 9 canister .did files confirmed in sync with WASM artifacts. 5-minute CI experiments have outsized ROI.
- Script location: `scripts/check-candid-drift.sh`
