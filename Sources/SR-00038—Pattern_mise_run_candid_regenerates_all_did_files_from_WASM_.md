---
id: SR-00038
title: "Pattern: mise run candid regenerates all .did files from WASM artifacts"
type: pattern
url: ""
status: draft
created: 2026-03-23
tags: [candid, did, build-tooling, mise, code-generation]
domain: "build-infrastructure"
relevance: "medium"
---

## Summary

The `mise run candid` task iterates over all 9 canister WASM artifacts and runs `candid-extractor` to regenerate `.did` (Candid interface definition) files from the compiled WASM. This ensures the `.did` files always match the actual canister implementation rather than being hand-maintained. The task is defined in `mise.toml` and extracts from `${CARGO_TARGET_DIR}/wasm32-unknown-unknown/release/<canister>.wasm` into `src/<canister>/<canister>.did`.

## Key Points

- `candid-extractor` is installed as a cargo tool (`"cargo:candid-extractor" = "latest"` in mise.toml)
- The task loops over all canisters, extracting Candid interfaces from compiled WASM files
- `.did` files are committed to the repo so they serve as the API contract for frontend consumers and inter-canister calls
- Running this after any `#[update]` or `#[query]` signature change ensures the interface definition stays synchronized
- Errors are suppressed with `|| true` to allow partial regeneration if some canisters fail to compile

## Connection to Problems

Stale `.did` files cause subtle bugs: frontend code or inter-canister callers may use outdated method signatures, leading to deserialization failures at runtime. By regenerating from WASM artifacts, the source of truth is always the compiled code. This is especially important after adding rollback endpoints (SR-00034) or query auth changes (SR-00037).

## Potential Ideas

- Add a CI check that compares regenerated `.did` files against committed ones and fails if they differ (drift detection)
- Include `.did` regeneration as part of the `mise run build` pipeline so it happens automatically
