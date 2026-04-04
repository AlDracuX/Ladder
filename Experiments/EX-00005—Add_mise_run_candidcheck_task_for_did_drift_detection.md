---
id: EX-00005
title: "Add mise run candid-check task for .did drift detection"
status: complete
updated: 2026-03-26
created: 2026-03-24
hypothesis: HY-00016
algorithm:
tags: [ci, candid, did, drift-detection, build-pipeline]
methodology: "Create scripts/check-candid-drift.sh that runs mise run candid then git diff --quiet on .did files"
duration: "< 60s (post-build)"
success_criteria: "exit 0 when .did files match WASM, exit 1 when stale"
---

## Objective

Validate that a CI script can detect .did drift by regenerating Candid interfaces from WASM and comparing against committed versions. Any discrepancy should produce a non-zero exit code.

## Methodology

1. Create `scripts/check-candid-drift.sh` that:
   - Runs `mise run candid` to regenerate all 9 .did files from WASM
   - Uses `git diff --quiet` on `src/**/*.did` to detect changes
   - Exits 0 if clean, exits 1 with diff stats if stale
2. Verify the script is executable
3. Verify current state is clean (all .did files match WASM artifacts)

## Setup

- Prerequisites: WASM build must exist (`mise run build` already run)
- Tools: `candid-extractor`, `mise`, `git`
- Working directory: `/mnt/media_backup/PROJECTS/awen-network-canisters`

## Algorithm

```bash
mise run candid                  # Regenerate .did from WASM
git diff --quiet src/**/*.did    # Check for drift
```

## Success Criteria

- Primary: non-zero diff in any .did file produces exit 1
- Secondary: clean state (current codebase) produces exit 0
- Tertiary: script runs in < 60s (build must already be complete)

## Data Collection

- Exit code of script run on clean codebase
- List of .did files checked (should be 9)

## Results

(populated after execution)

## Analysis

(populated after execution)

## Next Steps

- Add to `mise.toml` as a dependency of `mise run ci`
- Add to GitHub Actions CI pipeline
