---
id: HY-00039
title: "StorableTimerEntry with Candid serialization achieves 100 percent round-trip fidelity across all timer callback variants"
status: draft
created: 2026-03-27
idea: ID-00027
tags: [storable, timer, stable-storage, serialization, upgrade-safety]
prediction: "A StorableTimerEntry type implementing Storable with to_bytes/into_bytes/from_bytes via Candid encoding passes round-trip property tests for all TimerCallbackKind variants with zero data loss"
metric: "Number of TimerCallbackKind variants that survive Storable round-trip without field corruption"
success_criteria: "100% of variants (covering all set_timer call sites across 9 canisters) serialize and deserialize with byte-level equality"
---

## Hypothesis

If we define a StorableTimerEntry struct (saga_step_id, callback_tag: TimerCallbackKind enum, scheduled_at, interval_ns, context_bytes) implementing the Storable trait via Candid encode/decode per AL-00004, then all timer callback variants across the 9 canisters survive StableBTreeMap round-trip with 100% field-level fidelity, providing the data layer that HY-00038's saga timer persistence requires.

## Rationale

The project uses AL-00004's Storable pattern (Candid encode for to_bytes/into_bytes, Candid decode for from_bytes, Bound::Unbounded) for all stable storage types. Timer metadata is currently ephemeral -- ic_cdk_timers handles are in-memory only. To persist timers, we need a Storable type that captures: (1) what the timer does (TimerCallbackKind enum -- one variant per use case across all canisters), (2) when it fires (scheduled_at timestamp, optional interval_ns for repeating), (3) context (serialized payload like case_id or deadline_id). The case_hub set_timer call site and any timer use in deadline_alerts must be catalogued to define the complete TimerCallbackKind enum.

## Testing Plan

1. Audit all set_timer/set_timer_interval calls across 9 canisters (currently 1 in case_hub)
2. Define TimerCallbackKind enum with one variant per timer use case
3. Implement StorableTimerEntry with Storable trait (Candid serialization, Bound::Unbounded)
4. Property test: generate 1000 random StorableTimerEntry values, round-trip through to_bytes -> from_bytes, assert byte-level equality
5. Edge case tests: empty context, maximum u64 timestamp, all TimerCallbackKind variants
6. Verify StableBTreeMap<u64, StorableTimerEntry> insert/get works in unit tests

## Success Criteria

- 100% of TimerCallbackKind variants pass round-trip serialization
- 1000 property test iterations with zero failures
- StorableTimerEntry byte size is predictable and documented per variant
- Type compiles for wasm32-unknown-unknown target

## Risks

- TimerCallbackKind enum grows as new timer use cases are added -- Candid encoding must handle unknown variants gracefully for forward compatibility
- Context field (serialized payload) may contain types that don't implement CandidType
- Bound::Unbounded means no MAX_SIZE guarantee -- could cause issues with very large context payloads
- Single shared type across 9 canisters creates coupling -- canister-specific timer types may be more maintainable
