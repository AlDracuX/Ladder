---
id: EX-00021
title: "Test journal canister state reconstruction fidelity from events of 2 source canisters"
status: draft
created: 2026-03-27
hypothesis: HY-00033
algorithm: ""
tags: [event-sourcing, journaling, audit-trail, inter-canister, pocketic, case-timeline, evidence-vault]
methodology: "Create proof-of-concept journal canister, instrument case_timeline and evidence_vault to publish events, run 50 mixed operations in PocketIC, compare journal-reconstructed state against direct queries"
duration: "1 day"
success_criteria: "100% field-level accuracy on state reconstruction after 50 operations; causal ordering preserved; append latency under 2ms; WASM under 500KB"
---

## Objective

Validate that a journal canister receiving structured state mutation events from case_timeline and evidence_vault (the two canisters with the most cross-canister interaction) can reconstruct both canisters' materialized state from the event log alone with 100% field-level fidelity. This proves event sourcing viability for the full 9-canister network.

## Methodology

1. **Baseline: document current inter-canister call topology**
   ```bash
   cd /mnt/media_backup/PROJECTS/awen-network-canisters
   # Map all Call::bounded_wait sites between case_timeline and evidence_vault
   grep -n 'Call::bounded_wait' src/case_timeline/src/lib.rs
   grep -n 'Call::bounded_wait' src/evidence_vault/src/lib.rs
   # Document which state mutations cross canister boundaries
   ```

2. **Define JournalEvent enum** (describe, not implement)
   - File: new `src/journal/src/types.rs`
   - Events covering case_timeline mutations:
     - `TimelineEventCreated { case_id, event_id, event_type, timestamp, description }`
     - `TimelineEventUpdated { case_id, event_id, fields_changed }`
   - Events covering evidence_vault mutations:
     - `EvidenceStored { evidence_id, owner, sha256_hash, content_type, timestamp }`
     - `EvidenceLinked { evidence_id, case_id, link_type }`
   - Metadata on all events: `{ source_canister: Principal, sequence_number: u64, idempotency_key: String, ic_time: u64 }`

3. **Create minimal journal canister** (describe, not implement)
   - File: new `src/journal/src/lib.rs`
   - Storage: `StableBTreeMap<u64, JournalEvent, Memory>` with auto-incrementing sequence number
   - Append-only: `#[update] fn append_event(event: JournalEvent) -> Result<u64, JournalError>`
   - Query: `#[query] fn get_events(from_seq: u64, limit: u64) -> Vec<JournalEvent>`
   - Reconstruction: `#[query] fn reconstruct_state(canister_filter: Option<Principal>) -> ReconstructedState`

4. **Instrument source canisters** (describe, not implement)
   - In `case_timeline/src/lib.rs` `add_event_impl`: after successful state write, publish `TimelineEventCreated` to journal via `Call::bounded_wait`
   - In `evidence_vault/src/lib.rs` `store_evidence_impl`: after successful store, publish `EvidenceStored` to journal
   - Use fire-and-forget pattern (ignore journal call failures to avoid coupling)

5. **PocketIC integration test: 50 mixed operations**
   ```bash
   # tests/integration/journal_fidelity_test.rs
   # 1. Deploy journal, case_timeline, evidence_vault to PocketIC
   # 2. Execute 50 operations in this mix:
   #    - 20 store_evidence calls (various principals, data sizes)
   #    - 15 add_timeline_event calls (various case IDs, event types)
   #    - 10 link_evidence calls (connecting evidence to timeline events)
   #    - 5 update_timeline_event calls
   # 3. Query journal for all events
   # 4. Reconstruct state from journal events using fold
   # 5. Query case_timeline and evidence_vault directly
   # 6. Compare field-by-field
   cargo nextest run -p tests -E 'test(/journal_fidelity/)' --no-capture 2>&1
   ```

6. **Verify causal ordering**
   ```bash
   # In the same test:
   # - Store evidence E1
   # - Link E1 to timeline event T1
   # - Verify journal event for E1 has lower sequence number than event for link
   # - Verify journal event for T1 creation has lower sequence number than link
   ```

7. **Measure append latency overhead**
   ```bash
   # Compare latency of store_evidence with and without journal publishing
   # Use PocketIC instruction counting: pic.get_canister_status(evidence_vault).instruction_count
   # Run 10 operations with journal, 10 without, compare average cycle count
   ```

## Setup

- Working directory: `/mnt/media_backup/PROJECTS/awen-network-canisters`
- Branch: `experiment/ex-00021-journal-canister` (git worktree)
- Prerequisite: `mise run build` (build all canister WASMs including new journal canister)
- New canister: `src/journal/` (Cargo.toml, src/lib.rs, src/types.rs, journal.did)
- Modified canisters: case_timeline (add event publishing), evidence_vault (add event publishing)
- PocketIC test: `tests/integration/journal_fidelity_test.rs`

## Algorithm

No specific AL- entry. Uses event sourcing pattern: each state mutation is captured as an immutable event with metadata. State reconstruction is a left fold over the event sequence. Causal ordering uses per-canister sequence numbers combined with cross-canister happened-before relationships (event A triggered event B implies A.seq < B.seq in the journal).

## Success Criteria

- [ ] JournalEvent enum covers all case_timeline and evidence_vault state mutations
- [ ] Journal canister compiles for wasm32-unknown-unknown
- [ ] 50 mixed operations produce correct event count in journal
- [ ] Reconstructed state matches direct query for all fields in all records (100% fidelity)
- [ ] Causal ordering preserved (triggered events have higher sequence numbers)
- [ ] Journal append latency adds less than 2ms per inter-canister call
- [ ] Journal canister WASM size under 500KB

## Data Collection

| Metric | Target | Actual |
|--------|--------|--------|
| Total operations executed | 50 | TBD |
| Journal events captured | 50+ (some ops produce multiple events) | TBD |
| Fields compared | All fields in all records | TBD |
| Field-level accuracy | 100% | TBD |
| Causal ordering violations | 0 | TBD |
| Append latency overhead (cycles) | <2ms equivalent | TBD |
| Journal WASM size | <500KB | TBD |
| Reconstruction time (50 events) | <100ms | TBD |

## Risks & Mitigations

- **Cross-canister event ordering**: IC provides per-canister ordering but not global ordering. Two events from different canisters in the same consensus round have no guaranteed order. Mitigation: use Lamport timestamps -- each canister increments a logical clock on every event, and the journal uses max(local_clock, received_clock) + 1.
- **Fire-and-forget coupling**: If journal call fails, the source operation still succeeds but the event is lost. Mitigation: add a "gap detection" query that compares source canister state counts against journal event counts; schedule periodic reconciliation.
- **Journal as single point of failure**: If the journal canister traps during append, source canisters' fire-and-forget calls fail silently. Mitigation: source canisters buffer unsent events in a local StableVec and retry on next operation.
- **Event schema evolution**: Changing canister types requires journal event migration. Mitigation: use Candid encoding for events (Candid handles field additions gracefully with opt types).

## Results

(Fill in after running)

## Analysis

(Fill in after running)

## Next Steps

If 100% fidelity achieved: expand to 4+ canisters, design the full event schema, create AL- entry for the event sourcing pattern. If ordering issues found: investigate IC consensus ordering guarantees and consider vector clocks. Create RE- result entry.
