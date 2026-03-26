---
id: SR-00052
title: "on_low_wasm_memory hook for canister memory pressure handling"
type: paper
url: "https://github.com/dfinity/cdk-rs/blob/main/ic-cdk/CHANGELOG.md"
status: draft
created: 2026-03-25
tags: [icp, memory, ic-cdk, defensive, wasm]
domain: "icp-canister-development"
relevance: "medium — defensive pattern for all 9 canisters"
---

## Summary

ic-cdk 0.17.0 introduced the `#[on_low_wasm_memory]` attribute macro, which registers a hook that fires when the canister's WASM heap memory drops below a threshold. This enables defensive actions before the canister traps due to out-of-memory conditions — such as pruning caches, compacting data structures, logging warnings, or refusing new writes. Added to `LogVisibility` as `AllowedViewers` variant in the same release.

## Key Points

- Available since ic-cdk 0.17.0 (November 2024) via `#[on_low_wasm_memory]` attribute
- Fires automatically when heap memory usage crosses the low-memory threshold
- The hook runs in the canister's execution context with access to all state
- Enables graceful degradation instead of hard traps
- Can be used to: prune old entries, switch to read-only mode, alert controllers, trigger emergency stable memory offload
- Complements per-user quota enforcement (AL-00005) as a second line of defense

## Connection to Problems

- **All 9 canisters**: Currently have no memory pressure handling — if heap fills up, the canister traps silently
- **evidence_vault**: Large evidence items could exhaust heap; hook could trigger emergency compaction
- **mcp_gateway**: High-throughput request logging could fill heap; hook could prune oldest log entries
- **case_hub**: Multi-case aggregation pulls data from many canisters; hook could limit concurrent aggregations

## Potential Ideas

- Add `#[on_low_wasm_memory]` to all 9 canisters with a standard handler that logs a warning and switches to read-only mode
- Combine with storage quota (AL-00005) for layered defense: quota prevents individual abuse, hook prevents systemic exhaustion
- Emit a canister log entry when triggered so monitoring can detect memory pressure trends
