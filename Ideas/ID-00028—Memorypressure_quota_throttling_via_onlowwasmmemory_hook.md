---
id: ID-00028
title: "Memory-pressure quota throttling via on_low_wasm_memory hook"
status: draft
created: 2026-03-25
sources: [SR-00052, AL-00005]
phase: mate
domain: "canister-reliability"
tags: [memory-pressure, quota, wasm, defensive-programming, resource-management]
scores:
  feasibility: 70
  novelty: 70
  impact: 65
  elegance: 75
---

## Description

When a canister's WASM heap approaches its memory limit, the IC runtime invokes the `on_low_wasm_memory` hook. This idea uses that hook as a trigger to dynamically tighten per-user storage quotas, providing a graceful degradation path instead of hard-failing with an out-of-memory trap. When the hook fires, the canister transitions to a "memory-pressure" mode where new write operations are subject to reduced quotas (for example, halving the per-user limit from 10K entries to 5K). Existing data is untouched, but new writes are throttled until memory pressure subsides (either through garbage collection, archival, or a memory increase via canister settings). This combines the existing quota enforcement infrastructure (AL-00005) with the IC's built-in memory warning system (SR-00052) to create an adaptive resource management layer.

## Provenance

Mating AL-00005 (per-user quota enforcement, already implemented across all 9 canisters) with SR-00052 (`on_low_wasm_memory` hook from ic-cdk). AL-00005 provides the enforcement mechanism -- every `#[update]` endpoint already checks quotas before writes. SR-00052 provides the detection signal. The cross-pollination insight is that quotas do not need to be static constants: they can be dynamic values that respond to runtime memory conditions. This transforms quota enforcement from a fixed policy into an adaptive defense system.

## Connection

All 9 canisters benefit since all enforce per-user quotas (AL-00005), but evidence_vault and procedural_intel are the most memory-hungry (large document storage). Changes required: (1) add a `thread_local!` `Cell<QuotaMode>` enum (`Normal | Pressured`) to each canister, (2) implement the `on_low_wasm_memory` hook to flip the mode to `Pressured`, (3) modify existing quota-check functions to read the mode and apply reduced limits when pressured, (4) add a recovery path that reverts to `Normal` when stable memory usage drops below a threshold.

## Next Steps

1. Implement `on_low_wasm_memory` in evidence_vault as a proof-of-concept, setting a `Cell<bool>` flag and logging the event.
2. Modify evidence_vault's quota enforcement to halve the per-user limit when the pressure flag is set, and write a unit test that simulates the mode transition.
3. Design the recovery heuristic -- should quotas revert automatically after a successful GC cycle, or require an explicit admin call?
