---
id: EX-00039
title: "Property test StorableTimerEntry Candid round-trip for all TimerCallbackKind variants"
status: draft
created: 2026-03-27
hypothesis: HY-00039
algorithm: AL-00004
tags: [storable, timer, stable-storage, serialization, candid, property-testing, round-trip]
methodology: "Define StorableTimerEntry struct and TimerCallbackKind enum, implement Storable via Candid, run 1000 property tests per variant with proptest, verify byte-level equality on round-trip, test edge cases (empty context, max u64, all variants), measure serialized byte size per variant"
duration: "3 hours"
success_criteria: "100% of TimerCallbackKind variants pass round-trip; 1000 property tests with zero failures; type compiles for wasm32-unknown-unknown; byte size documented per variant"
---

## Objective

Validate that a StorableTimerEntry struct implementing the Storable trait via Candid encode/decode (AL-00004 pattern) achieves 100% field-level fidelity across all TimerCallbackKind variants when round-tripped through StableBTreeMap. This provides the verified data layer that HY-00038's saga timer persistence requires.

## Methodology

1. **Audit all timer use cases to define TimerCallbackKind enum**
   ```bash
   cd /mnt/media_backup/PROJECTS/awen-network-canisters
   # Find all set_timer/set_timer_interval call sites
   grep -rn 'set_timer\|set_timer_interval' src/ --include='*.rs'
   # Current: case_hub:383 (recover_stuck_sagas)
   # Planned: saga compensation retries, deadline reminders
   # Define enum variants:
   #   RecoverStuckSagas    -- case_hub post_upgrade recovery
   #   SagaCompensationRetry -- retry failed saga compensation step
   #   DeadlineReminder      -- deadline_alerts periodic check
   #   AcasExtensionCheck    -- ACAS deadline extension monitoring
   ```

2. **Define StorableTimerEntry struct**
   ```bash
   git worktree add /tmp/ex-00039 -b experiment/ex-00039-storable-timer-entry
   cd /tmp/ex-00039
   # In packages/awen_types/src/timer.rs (new file):
   #
   # #[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
   # pub enum TimerCallbackKind {
   #     RecoverStuckSagas,
   #     SagaCompensationRetry { saga_id: String, step_index: u32 },
   #     DeadlineReminder { deadline_id: u64 },
   #     AcasExtensionCheck { case_id: String },
   # }
   #
   # #[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, CandidStorable)]
   # pub struct StorableTimerEntry {
   #     pub saga_step_id: u64,
   #     pub callback_tag: TimerCallbackKind,
   #     pub scheduled_at: u64,
   #     pub interval_ns: Option<u64>,
   #     pub retry_count: u32,
   #     pub max_retries: u32,
   #     pub context: Vec<u8>,
   # }
   ```

3. **Implement Storable trait (or verify CandidStorable derive works)**
   ```bash
   # If using CandidStorable derive macro (from awen_macros):
   #   Verify it generates to_bytes, into_bytes, from_bytes, BOUND = Unbounded
   # If manual implementation needed:
   #   impl Storable for StorableTimerEntry {
   #       fn to_bytes(&self) -> Cow<'_, [u8]> { Cow::Owned(candid::encode_one(self).unwrap_or_default()) }
   #       fn into_bytes(self) -> Vec<u8> { candid::encode_one(&self).unwrap_or_default() }
   #       fn from_bytes(bytes: Cow<[u8]>) -> Self { candid::decode_one(&bytes).unwrap_or_default() }
   #       const BOUND: Bound = Bound::Unbounded;
   #   }
   # Verify compilation for wasm32-unknown-unknown:
   cargo check --target wasm32-unknown-unknown -p awen_types
   ```

4. **Write property tests with proptest (1000 iterations per variant)**
   ```bash
   # In packages/awen_types/src/timer.rs #[cfg(test)] module:
   # Use proptest to generate random StorableTimerEntry values
   #
   # proptest! {
   #     #[test]
   #     fn roundtrip_recover_stuck_sagas(
   #         saga_step_id in any::<u64>(),
   #         scheduled_at in any::<u64>(),
   #         interval_ns in proptest::option::of(any::<u64>()),
   #         retry_count in any::<u32>(),
   #         max_retries in any::<u32>(),
   #         context in proptest::collection::vec(any::<u8>(), 0..256),
   #     ) {
   #         let entry = StorableTimerEntry {
   #             saga_step_id, callback_tag: TimerCallbackKind::RecoverStuckSagas,
   #             scheduled_at, interval_ns, retry_count, max_retries, context,
   #         };
   #         let bytes = entry.to_bytes();
   #         let decoded = StorableTimerEntry::from_bytes(bytes);
   #         prop_assert_eq!(entry, decoded);
   #     }
   # }
   # Repeat for each TimerCallbackKind variant
   cargo nextest run -p awen_types -E 'test(/roundtrip_/)'
   ```

5. **Write explicit edge case tests**
   ```bash
   # Edge cases that property tests may not cover well:
   # a) Empty context (Vec::new())
   # b) Maximum u64 values (u64::MAX for all u64 fields)
   # c) Zero values (all fields = 0)
   # d) Large context (10KB payload)
   # e) All TimerCallbackKind variants with nested data
   # f) Option<u64> = None for interval_ns
   # g) Option<u64> = Some(0) for interval_ns
   # h) Unicode strings in saga_id/case_id fields of variants
   cargo nextest run -p awen_types -E 'test(/timer_edge_/)'
   ```

6. **Verify StableBTreeMap insert/get works**
   ```bash
   # Unit test: create StableBTreeMap<u64, StorableTimerEntry, VectorMemory>
   # Insert 100 entries with different keys
   # Get each entry back
   # Assert equality for all 100
   cargo nextest run -p awen_types -E 'test(/timer_stable_btree/)'
   ```

7. **Measure serialized byte size per variant**
   ```bash
   # For each TimerCallbackKind variant, create a typical StorableTimerEntry
   # Record to_bytes().len()
   # Document expected sizes for capacity planning
   cargo nextest run -p awen_types -E 'test(/timer_byte_size/)'
   ```

8. **Verify wasm32 compilation**
   ```bash
   cargo check --target wasm32-unknown-unknown -p awen_types
   mise run build  # full WASM build
   ```

## Setup

- Working directory: `/mnt/media_backup/PROJECTS/awen-network-canisters`
- Branch: `experiment/ex-00039-storable-timer-entry` (git worktree at `/tmp/ex-00039`)
- New file: `packages/awen_types/src/timer.rs`
- Existing patterns to follow:
  - `packages/awen_types/src/idempotency.rs` (ProcessedRequest Storable impl)
  - `packages/awen_types/src/saga.rs` (SagaJournal with CandidStorable derive)
  - `awen_macros::CandidStorable` derive macro (generates Storable impl)
- Dependencies: proptest (for property testing), candid (for serialization)
- Workspace lints: `unwrap_used = "deny"` -- use `unwrap_or_default()` in from_bytes
- Upstream: HY-00038 depends on this type for timer persistence

## Algorithm

AL-00004 (Candid Storable pattern). All stable storage types in the workspace use Candid encode/decode for Storable trait implementation with `Bound::Unbounded`. The `CandidStorable` derive macro automates this pattern, generating `to_bytes`, `into_bytes`, and `from_bytes` implementations.

## Success Criteria

- [ ] TimerCallbackKind enum defined with variants covering all set_timer call sites
- [ ] StorableTimerEntry struct defined with all required fields
- [ ] Storable trait implemented via CandidStorable derive or manual Candid impl
- [ ] Property test: RecoverStuckSagas variant -- 1000 iterations, zero failures
- [ ] Property test: SagaCompensationRetry variant -- 1000 iterations, zero failures
- [ ] Property test: DeadlineReminder variant -- 1000 iterations, zero failures
- [ ] Property test: AcasExtensionCheck variant -- 1000 iterations, zero failures
- [ ] Edge case: empty context round-trips correctly
- [ ] Edge case: u64::MAX fields round-trip correctly
- [ ] Edge case: large context (10KB) round-trips correctly
- [ ] StableBTreeMap insert/get works for 100 entries
- [ ] Serialized byte size documented per variant
- [ ] Type compiles for wasm32-unknown-unknown
- [ ] All existing awen_types tests pass without modification

## Data Collection

| Metric | Target | Actual |
|--------|--------|--------|
| TimerCallbackKind variants | covers all sites | TBD |
| Property test iterations (total) | 4000 (4 x 1000) | TBD |
| Property test failures | 0 | TBD |
| Edge case tests | 8+ | TBD |
| Edge case failures | 0 | TBD |
| StableBTreeMap entries tested | 100 | TBD |
| StableBTreeMap failures | 0 | TBD |
| Byte size: RecoverStuckSagas (typical) | documented | TBD |
| Byte size: SagaCompensationRetry (typical) | documented | TBD |
| Byte size: DeadlineReminder (typical) | documented | TBD |
| Byte size: AcasExtensionCheck (typical) | documented | TBD |
| wasm32 compilation | passes | TBD |
| Existing test regressions | 0 | TBD |

## Risks & Mitigations

- **TimerCallbackKind forward compatibility**: Adding new variants to the enum changes the Candid schema. Old serialized entries with unknown variants will fail deserialization. Mitigation: implement `Default` for `TimerCallbackKind` with an `Unknown` variant so `from_bytes` falls back gracefully. Add a migration path for schema evolution.
- **CandidStorable derive may not handle nested enums**: The derive macro may not correctly handle `TimerCallbackKind` variants with struct fields (e.g., `SagaCompensationRetry { saga_id, step_index }`). Mitigation: test this explicitly. If the derive fails, implement Storable manually.
- **proptest not available for wasm32 target**: proptest may not compile for wasm32. Mitigation: property tests run as native unit tests (`#[cfg(test)]`), not in WASM. The Storable logic itself is target-independent (Candid serialization works the same on native and WASM).
- **Bound::Unbounded risks**: No MAX_SIZE guarantee means very large context payloads could cause issues. Mitigation: add a `MAX_CONTEXT_BYTES` constant (e.g., 64KB) and validate in the constructor. Document the size limit.
- **context field type ambiguity**: `Vec<u8>` is opaque -- the caller must know how to interpret the bytes. Mitigation: document that context is Candid-encoded payload specific to each TimerCallbackKind variant. Consider using a typed enum for context in a future iteration.

## Results

(Fill in after running)

## Analysis

(Fill in after running)

## Next Steps

If all variants pass round-trip: merge StorableTimerEntry into awen_types, create AL- entry for the timer serialization pattern, proceed with HY-00038 (saga timer persistence) which depends on this type. If any variant fails: investigate Candid encoding edge case (likely enum variant encoding), fix and re-test. If byte sizes are unexpectedly large: evaluate CBOR or bincode as alternative serialization (but maintaining workspace consistency with Candid is preferred).
