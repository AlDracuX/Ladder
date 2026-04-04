---
id: ID-00057
title: "Graduated canister degradation cascading on_low_wasm_memory through read-only mode rate throttle and admin alerts"
status: draft
created: 2026-03-27
sources: [SR-00052]
phase: dream
domain: "reliability"
tags: [memory-pressure, degradation, on-low-wasm-memory, circuit-breaker, canister-health]
scores:
  feasibility: 6
  novelty: 7
  impact: 8
  elegance: 7
---

## Description

When `on_low_wasm_memory` fires, instead of an abrupt trap, the canister cascades through degradation levels: (1) reject new writes, keep reads alive, (2) throttle read rate, (3) emit admin alert via inter-canister call to case_hub, (4) enter minimal-response mode returning "canister under pressure" errors. Each level triggers at a progressively lower memory threshold. This gives operators time to react (add cycles, trigger cleanup, upgrade) before the canister becomes unresponsive.

## Provenance

Generated during dream phase from SR-00052 (on_low_wasm_memory hook). Theme: reliability. Related to ID-00028 (memory-pressure quota throttling) and ID-00044 (circuit breaker combining on_low_wasm_memory with spawn_weak), but this idea focuses on graduated multi-level degradation rather than binary throttle-or-not.

## Connection

Affects all 9 canisters — each would implement a shared `DegradationLevel` enum from `awen_types`. Most critical for evidence_vault (large binary storage) and case_timeline (unbounded event history). Requires a shared `CanisterHealth` state machine in `awen_types` and per-canister `on_low_wasm_memory` hooks.

## Next Steps

- Hypothesis: "Graduated degradation maintains read availability for 5+ minutes after memory pressure threshold, vs immediate trap without it"
- Define `DegradationLevel` enum and thresholds in `awen_types`
- Risk: IC `on_low_wasm_memory` may fire too late for graduated response
