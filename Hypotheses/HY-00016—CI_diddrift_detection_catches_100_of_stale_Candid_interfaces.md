---
id: HY-00016
title: "CI did-drift detection catches 100% of stale Candid interfaces before merge"
status: complete
updated: 2026-03-24
created: 2026-03-24
idea: ID-00020
tags: [ci, candid, did, build-pipeline, drift-detection]
prediction: "mise run candid-check detects any .did file that doesn't match regenerated output from WASM"
metric: "diff line count between committed .did and regenerated .did"
success_criteria: "non-zero diff fails CI, zero diff passes CI, for all 9 canisters"
---

## Hypothesis

If we add a `mise run candid-check` task that regenerates all .did files from WASM and diffs against committed versions, then 100% of stale Candid interfaces are caught before merge — any endpoint signature change without .did regeneration fails CI.

## Rationale

SR-00038 documents `mise run candid` which regenerates .did from WASM. ID-00020 proposes drift detection. Currently .did files can drift silently — a developer adds a new `#[update]` method but forgets to regenerate the .did file. Frontend consumers then use outdated interfaces. A CI check that compares regenerated vs committed .did catches this automatically.

## Testing Plan

1. Add `candid-check` task to `mise.toml`: runs `mise run candid`, then `git diff --exit-code src/**/*.did`
2. Verify pass: with current committed .did files, `mise run candid-check` exits 0
3. Verify fail: manually edit a .did file (add a fake method), run `mise run candid-check` — should exit non-zero
4. Verify fail: add a new `#[update]` to a canister, build, but don't regenerate .did — should detect

## Success Criteria

- Primary: drift in any of 9 .did files produces non-zero exit code
- Secondary: clean state produces exit 0
- Tertiary: task runs in <60 seconds (build must already be done)

## Risks

- Requires WASM build before check (adds CI time if not cached)
- `candid-extractor` output format may have non-deterministic ordering, causing false diffs
