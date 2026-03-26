---
id: ID-00044
title: "Canister memory pressure circuit breaker combining on_low_wasm_memory with spawn_weak cleanup"
status: draft
created: 2026-03-26
sources: [SR-00052, SR-00053]
phase: dream
domain: "canister-resilience"
tags: [memory-pressure, circuit-breaker, spawn-weak, cleanup, on-low-wasm-memory]
scores:
  feasibility: 6
  novelty: 7
  impact: 7
  elegance: 8
---

## Description

Combine the `on_low_wasm_memory` hook with `spawn_weak` tasks to create a circuit breaker pattern for canister memory management. When memory pressure is detected via the hook, it triggers `spawn_weak` cleanup tasks that compact stable storage, evict expired cache entries, and archive old saga records. The `spawn_weak` tasks are automatically dropped during canister upgrades, preventing cleanup work from blocking the upgrade path. This creates a self-healing memory management layer that responds to pressure without manual intervention and degrades gracefully during upgrades.

## Provenance

Derived from two ICP platform capabilities identified in sources: SR-00052 (`on_low_wasm_memory` hook for detecting memory pressure) and SR-00053 (`spawn_weak` and `spawn_migratory` for upgrade-safe background tasks). The insight is that these two primitives compose naturally into a circuit breaker pattern -- the hook provides the trigger, and `spawn_weak` provides the cleanup mechanism with built-in upgrade safety. Neither primitive alone solves the problem; together they create a robust memory management pattern. Feasibility is moderate (6) because `on_low_wasm_memory` behavior under sustained pressure needs careful testing to avoid re-entrant cleanup loops.

## Connection

Applies to all 9 canisters but is most critical for `evidence_vault` (large binary data), `mcp_gateway` (rate limiter state accumulation), and `case_timeline` (unbounded event growth). The cleanup tasks connect to the existing per-user storage quota system -- when memory pressure is detected, the circuit breaker can tighten quotas temporarily. Relates to ID-00043 (health dashboard) since memory pressure state should be surfaced in the aggregated health view. The `spawn_weak` primitive also connects to the saga pattern used in cross-canister operations, where stale saga records are prime candidates for archival during cleanup.

## Next Steps

1. Implement `on_low_wasm_memory` hook in a shared utility module that all canisters can use
2. Define cleanup task interface: `trait MemoryCleanup { fn compact(&self); fn evict_expired(&self); fn archive_stale(&self); }`
3. Wire cleanup tasks via `spawn_weak` so they are dropped on upgrade
4. Add re-entrancy guard preventing cleanup-triggers-cleanup loops
5. Test under simulated memory pressure using PocketIC with constrained WASM memory limits
