---
id: HY-00033
title: "Journal canister receiving events from 2 canisters reconstructs their state with 100 percent fidelity from event log alone"
status: draft
created: 2026-03-27
idea: ID-00009
tags: [event-sourcing, journaling, audit-trail, inter-canister]
prediction: "A proof-of-concept journal canister receiving state mutation events from case_timeline and evidence_vault can reconstruct both canisters' state from the event log with 100% field-level accuracy"
metric: "Field-level accuracy when comparing state reconstructed from journal events vs direct canister query"
success_criteria: "After 50 operations across case_timeline and evidence_vault, journal-reconstructed state matches direct query state for all fields in all records"
---

## Hypothesis

If we create a journal canister that receives structured state mutation events from case_timeline and evidence_vault (the two canisters with the most inter-canister call sites), then the journal's event log alone can reconstruct both canisters' materialized state with 100% field-level fidelity, proving that event sourcing is viable for the full 9-canister network.

## Rationale

The codebase has 23 Call::bounded_wait sites creating cross-canister state dependencies without a unified audit trail. case_timeline has 3 call sites and evidence_vault has 1, but both are high-value: timeline events reference evidence, and evidence stores reference case timelines. A journal canister capturing "TimelineEventCreated", "EvidenceStored", "EvidenceLinked" events with full payload and causality metadata (source canister, timestamp, idempotency key) would enable: (1) state reconstruction from replay, (2) consistency verification between canisters, (3) time-travel debugging. Starting with 2 canisters bounds the proof-of-concept scope while testing the hardest problem: cross-canister event ordering.

## Testing Plan

1. Define JournalEvent enum covering case_timeline and evidence_vault state mutations
2. Create minimal journal canister with StableBTreeMap<u64, JournalEvent> and append-only semantics
3. Instrument case_timeline and evidence_vault _impl functions to publish events via Call::bounded_wait
4. PocketIC test: perform 50 operations (create events, store evidence, link them), then query journal
5. Reconstruct state from journal events using a fold/reduce function
6. Compare reconstructed state against direct canister queries field-by-field

## Success Criteria

- 100% field-level accuracy on state reconstruction after 50 mixed operations
- Journal event ordering preserves causality (event A that triggered event B has lower sequence number)
- Journal append latency adds less than 2ms per inter-canister call
- Journal canister WASM size under 500KB

## Risks

- Event ordering across canisters is not guaranteed on ICP -- consensus provides per-canister ordering but not global ordering
- Publishing events via Call::bounded_wait adds a cross-canister call to every state mutation, doubling call overhead
- Journal canister becomes a single point of failure -- if it traps, all publishing canisters' calls fail
- Event schema evolution: changing canister state types requires journal event migration
