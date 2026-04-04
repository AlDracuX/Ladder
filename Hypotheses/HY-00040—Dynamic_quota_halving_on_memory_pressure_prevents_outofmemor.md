---
id: HY-00040
title: "Dynamic quota halving on memory pressure prevents out-of-memory traps while maintaining read availability"
status: draft
created: 2026-03-27
idea: ID-00028
tags: [memory-pressure, quota, on-low-wasm-memory, evidence-vault, resilience]
prediction: "Dynamic quota halving keeps canister responsive to reads after memory pressure fires"
metric: "Query success rate (%) after on_low_wasm_memory triggers; time-to-trap (seconds)"
success_criteria: "Read queries succeed at >95% rate for 60+ seconds after memory pressure, vs 0% without protection"
---

## Hypothesis

If we halve per-user storage quotas when `on_low_wasm_memory` fires and reject new writes while allowing reads, then the canister maintains >95% read availability for at least 60 seconds after memory pressure begins, compared to immediate trap without protection.

## Rationale

ID-00028 proposes memory-pressure quota throttling via the `on_low_wasm_memory` hook (SR-00052). Currently, canisters have no response to memory pressure — they trap when WASM memory is exhausted, losing all in-flight requests. By halving quotas and rejecting writes, we stop memory growth while keeping the canister responsive for reads. The 60-second window gives operators time to react.

## Testing Plan

1. **Setup**: Deploy evidence_vault to PocketIC with 80% memory utilization (fill with large evidence records)
2. **Baseline (no protection)**: Continue adding records until trap. Measure: last successful query timestamp, time-to-trap.
3. **Change**: Add `on_low_wasm_memory` hook that sets a `MEMORY_PRESSURE` flag, halves quotas, rejects writes
4. **After**: Same workload. Measure: query success rate after pressure flag, time until trap (if any)
5. **Delta**: Compare read availability window

## Success Criteria

- Primary: >95% read success rate for 60+ seconds after memory pressure triggers
- Secondary: Write rejection returns a clean error (not a trap)
- Secondary: No existing tests break

## Risks

- `on_low_wasm_memory` may fire too late (insufficient memory remaining for the hook logic itself)
- PocketIC may not accurately simulate WASM memory pressure
- Quota halving may not be sufficient if a single user already exceeds the halved quota
