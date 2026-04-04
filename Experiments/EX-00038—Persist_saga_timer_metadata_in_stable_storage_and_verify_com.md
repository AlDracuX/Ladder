---
id: EX-00038
title: "Persist saga timer metadata in stable storage and verify compensation resumption after PocketIC upgrade"
status: draft
created: 2026-03-27
hypothesis: HY-00038
algorithm: AL-00002
tags: [saga, timer, upgrade-safety, compensation, stable-storage, pocketic, deadline-alerts, case-hub]
methodology: "Audit set_timer call sites, define TimerEntry struct with Storable, add TIMER_REGISTRY StableBTreeMap, implement pre_upgrade persist and post_upgrade reconstruct, run PocketIC test with 5 in-flight sagas interrupted by upgrade"
duration: "6 hours"
success_criteria: "5/5 in-flight saga compensation flows complete after upgrade; timer reconstruction within 4B instruction budget; zero duplicate compensations; TimerEntry round-trip passes 100 property test inputs"
---

## Objective

Validate that persisting saga timer metadata to a StableBTreeMap during pre_upgrade and reconstructing timers via `ic_cdk_timers::set_timer` during post_upgrade enables 100% of in-flight saga compensation flows to survive canister upgrades. Currently, case_hub has 1 `set_timer` call for saga recovery that is silently destroyed on upgrade, potentially leaving cross-canister state partially committed.

## Methodology

1. **Audit all set_timer/set_timer_interval call sites**
   ```bash
   cd /mnt/media_backup/PROJECTS/awen-network-canisters
   grep -rn 'set_timer\|set_timer_interval' src/ --include='*.rs'
   # Known: case_hub/src/lib.rs:383 -- set_timer(Duration::ZERO, recover_stuck_sagas_impl)
   # Classify each: saga-related (must persist) vs fire-and-forget (safe to lose)
   ```

2. **Define TimerEntry struct and TimerCallbackKind enum**
   ```bash
   git worktree add /tmp/ex-00038 -b experiment/ex-00038-saga-timer-persist
   cd /tmp/ex-00038
   # In packages/awen_types/src/ or src/case_hub/src/types.rs:
   # TimerCallbackKind enum -- one variant per timer use case:
   #   RecoverStuckSagas       -- case_hub's existing timer
   #   SagaCompensationRetry   -- future: retry failed compensation step
   #   DeadlineReminder        -- future: deadline_alerts timer
   #
   # TimerEntry struct:
   #   saga_step_id: u64
   #   callback_tag: TimerCallbackKind
   #   scheduled_at: u64  (IC timestamp when timer should fire)
   #   interval_ns: Option<u64>  (None for one-shot, Some for repeating)
   #   retry_count: u32
   #   max_retries: u32
   #   context: Vec<u8>  (serialized payload: case_id, deadline_id, etc.)
   ```

3. **Implement Storable for TimerEntry using Candid serialization**
   ```bash
   # Follow AL-00004 pattern (same as ProcessedRequest in idempotency.rs):
   # impl Storable for TimerEntry {
   #     fn to_bytes(&self) -> Cow<'_, [u8]> { Cow::Owned(candid::encode_one(self).unwrap_or_default()) }
   #     fn into_bytes(self) -> Vec<u8> { candid::encode_one(&self).unwrap_or_default() }
   #     fn from_bytes(bytes: Cow<[u8]>) -> Self { candid::decode_one(&bytes).unwrap_or_default() }
   #     const BOUND: Bound = Bound::Unbounded;
   # }
   ```

4. **Add TIMER_REGISTRY StableBTreeMap to case_hub**
   ```bash
   # thread_local! {
   #     static TIMER_REGISTRY: RefCell<StableBTreeMap<u64, TimerEntry, Memory>> = ...;
   # }
   # Allocate next available MemoryManager segment
   # Wrap set_timer calls: before calling ic_cdk_timers::set_timer, insert entry into TIMER_REGISTRY
   # After timer fires and completes, remove entry from TIMER_REGISTRY
   ```

5. **Implement pre_upgrade timer persistence**
   ```bash
   # In awen_lifecycle! macro or explicit pre_upgrade:
   # TIMER_REGISTRY is already in stable storage (StableBTreeMap) so it
   # survives automatically -- no explicit serialization needed.
   # But we need to CANCEL all active ic_cdk_timers handles (they'll be reconstructed)
   # Store the timer IDs somewhere accessible for cleanup
   ```

6. **Implement post_upgrade timer reconstruction**
   ```bash
   # In post_upgrade:
   # 1. Iterate TIMER_REGISTRY
   # 2. For each TimerEntry:
   #    a. Calculate remaining duration: max(0, scheduled_at - now)
   #    b. Match on callback_tag to determine the callback function
   #    c. Call ic_cdk_timers::set_timer(remaining_duration, callback)
   #    d. Update TIMER_REGISTRY with new timer handle if needed
   # 3. Log reconstruction count
   ```

7. **Write PocketIC integration test: 5 sagas survive upgrade**
   ```bash
   # tests/integration/saga_timer_upgrade_test.rs:
   # 1. Deploy case_hub and 2 target canisters to PocketIC
   # 2. Initiate 5 saga workflows that create timer-driven compensation steps:
   #    - Each saga has a pending compensation timer (e.g., 30-second delay)
   # 3. Verify TIMER_REGISTRY has 5 entries
   # 4. Upgrade case_hub canister (PocketIC upgrade API)
   # 5. Verify TIMER_REGISTRY still has 5 entries (stable storage survived)
   # 6. Advance PocketIC time past all scheduled times
   # 7. Verify all 5 compensation callbacks executed:
   #    - Check saga status transitioned to Completed or Failed-with-compensation
   #    - Check target canisters received compensation calls
   # 8. Verify TIMER_REGISTRY is now empty (timers cleaned up after firing)
   cargo nextest run --run-ignored -E 'test(/saga_timer_upgrade/)'
   ```

8. **Verify no duplicate compensations**
   ```bash
   # In the PocketIC test:
   # Track call count on target canisters
   # Assert each compensation method was called exactly once per saga
   # (Idempotency keys prevent replay, but verify the timer doesn't double-fire)
   ```

9. **Measure post_upgrade instruction cost**
   ```bash
   # PocketIC provides instruction count for upgrade calls
   # With 5 timers to reconstruct: should be well under 4B instruction budget
   # With 100 timers (stress test): still under budget
   ```

10. **Run full test suite**
    ```bash
    mise run nextest
    ```

## Setup

- Working directory: `/mnt/media_backup/PROJECTS/awen-network-canisters`
- Branch: `experiment/ex-00038-saga-timer-persist` (git worktree at `/tmp/ex-00038`)
- Primary canister: `src/case_hub/src/lib.rs` -- has 1 existing set_timer call (line 383)
- Secondary canister: `src/deadline_alerts/` -- potential timer use for ACAS reminders
- Existing saga types: `packages/awen_types/src/saga.rs` (SagaJournal, SagaStep, SagaStatus)
- Existing Storable pattern: `packages/awen_types/src/idempotency.rs` (ProcessedRequest)
- Current behavior: `recover_stuck_sagas_on_upgrade()` sets a `Duration::ZERO` timer in post_upgrade -- this specific timer is already reconstructed but is fire-and-forget style
- PocketIC required for upgrade simulation
- `mise run build` required before integration tests

## Algorithm

AL-00002 (saga pattern) -- extending with timer persistence. The existing saga pattern assumes timers survive indefinitely. This experiment adds the persistence layer: timer metadata in stable storage enables reconstruction after the upgrade boundary that currently destroys all `ic_cdk_timers` handles.

## Success Criteria

- [ ] All set_timer/set_timer_interval sites audited and classified (saga vs fire-and-forget)
- [ ] TimerEntry struct defined with all required fields
- [ ] TimerCallbackKind enum covers all timer use cases across target canisters
- [ ] Storable impl for TimerEntry passes round-trip test (100 random inputs)
- [ ] TIMER_REGISTRY StableBTreeMap added to case_hub
- [ ] pre_upgrade: active timers in TIMER_REGISTRY (stable storage survives automatically)
- [ ] post_upgrade: timers reconstructed from TIMER_REGISTRY via ic_cdk_timers::set_timer
- [ ] PocketIC test: 5/5 saga compensation flows complete after upgrade
- [ ] Zero duplicate compensation executions (idempotency prevents replay)
- [ ] post_upgrade instruction count < 4B for 5 timer reconstructions
- [ ] post_upgrade instruction count < 4B for 100 timer reconstructions (stress test)
- [ ] All existing tests pass without modification

## Data Collection

| Metric | Target | Actual |
|--------|--------|--------|
| set_timer call sites (total) | audit | TBD |
| set_timer sites requiring persistence | audit | TBD |
| TimerCallbackKind variants defined | covers all sites | TBD |
| TimerEntry round-trip property tests | 100/100 pass | TBD |
| Sagas surviving upgrade (out of 5) | 5/5 | TBD |
| Duplicate compensations | 0 | TBD |
| post_upgrade instructions (5 timers) | < 4B | TBD |
| post_upgrade instructions (100 timers) | < 4B | TBD |
| TIMER_REGISTRY entries after all fire | 0 | TBD |
| Existing test regressions | 0 | TBD |

## Risks & Mitigations

- **TimerCallbackKind enum exhaustiveness**: Adding new timer types requires updating the enum, which means schema migration. Mitigation: use `#[serde(other)]` or a catch-all variant for forward compatibility. Log a warning for unknown variants instead of panicking.
- **post_upgrade instruction budget**: Reconstructing many timers (100+) may approach the 4B instruction limit. Mitigation: batch reconstruction -- reconstruct in groups of 10, with each batch scheduled via Duration::ZERO timer to spread across execution rounds.
- **Timer ID changes on reconstruction**: `ic_cdk_timers::set_timer` returns a new TimerId, different from the original. Any state referencing the old ID must be updated. Mitigation: TIMER_REGISTRY uses a stable u64 key (saga_step_id), not the ic_cdk TimerId. The mapping is TIMER_REGISTRY key -> new TimerId (transient).
- **Race condition during upgrade**: A timer may fire between pre_upgrade start and completion, or a timer's callback may be mid-execution when upgrade interrupts. Mitigation: the CallerGuard pattern (if a compensation is in-flight, the saga step is already marked as Compensating -- post_upgrade detects this and does not double-fire).
- **PocketIC upgrade simulation fidelity**: PocketIC may not perfectly simulate the timer destruction that happens during real IC upgrades. Mitigation: verify by checking that timers set pre-upgrade do NOT fire post-upgrade without reconstruction.

## Results

(Fill in after running)

## Analysis

(Fill in after running)

## Next Steps

If 5/5 sagas survive: create AL- entry for timer persistence pattern, apply to deadline_alerts, document in DEVELOPMENT.md. If some sagas fail: analyze failure mode (wrong callback dispatch, missing context, timing), fix and re-run. If instruction budget is tight: implement batched reconstruction and re-measure. This experiment is a prerequisite for HY-00039 (StorableTimerEntry fidelity).
