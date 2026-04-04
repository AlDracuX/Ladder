---
id: EX-00029
title: "Inject stuck sagas and verify post-upgrade timer scan recovers 100 percent within 60 seconds"
status: draft
created: 2026-03-27
hypothesis: HY-00012
algorithm: AL-00002
tags: [saga, post-upgrade, recovery, timer, PocketIC, case-hub, resilience]
methodology: "Deploy case_hub to PocketIC, inject stuck sagas via begin_saga_impl, simulate canister upgrade, advance IC time by 60s, verify all stuck sagas transitioned to RolledBack and recent sagas untouched"
duration: "6 hours"
success_criteria: "100% of stuck sagas (older than threshold) recovered within 60s; zero non-stuck sagas disturbed; rollback endpoints called for each stuck saga"
---

## Objective

Validate that the `recover_stuck_sagas_on_upgrade()` timer in case_hub correctly detects and recovers 100% of sagas stuck in transient states (`Pending`, `StepCompleted`, `Compensating`) after a canister upgrade. The function already exists in `src/case_hub/src/lib.rs:382` -- this experiment tests its behavior under controlled conditions with injected stuck sagas.

## Methodology

1. **Audit the existing recovery implementation**
   ```bash
   cd /mnt/media_backup/PROJECTS/awen-network-canisters
   # Read the recover_stuck_sagas_impl function
   rg -A 30 'fn recover_stuck_sagas_impl' src/case_hub/src/lib.rs
   # Check what SagaState statuses are considered "stuck"
   rg 'Compensating|Pending|StepCompleted' packages/awen_types/src/saga.rs
   # Check the threshold constant
   rg 'STUCK_SAGA_THRESHOLD\|stuck.*threshold\|timeout' src/case_hub/src/lib.rs
   ```

2. **Write PocketIC integration test: inject stuck sagas**
   ```rust
   // tests/integration/saga_recovery_test.rs
   #[test]
   #[ignore] // PocketIC integration test
   fn test_post_upgrade_recovers_stuck_sagas() {
       let pic = PocketIc::new();
       let case_hub_id = deploy_case_hub(&pic);

       // Create 5 sagas with different states:
       // 1. Pending, created 10 minutes ago (SHOULD be recovered)
       // 2. StepCompleted, created 15 minutes ago (SHOULD be recovered)
       // 3. Compensating, created 20 minutes ago (SHOULD be recovered)
       // 4. Pending, created 5 seconds ago (SHOULD NOT be recovered -- too recent)
       // 5. Completed, created 10 minutes ago (SHOULD NOT be recovered -- terminal state)

       // Inject via begin_saga_impl + complete_saga_step_impl
       // For stuck sagas: begin saga, then advance IC time without completing

       // Simulate canister upgrade
       pic.upgrade_canister(case_hub_id, case_hub_wasm(), vec![]);

       // Advance IC time by 60 seconds
       pic.advance_time(Duration::from_secs(60));
       pic.tick(); // Process timers

       // Query SAGA_STORE for all sagas
       // Assert: sagas 1-3 status == RolledBack
       // Assert: saga 4 status == Pending (untouched, too recent)
       // Assert: saga 5 status == Completed (untouched, terminal)
   }
   ```

3. **Write edge case tests**
   ```rust
   #[test]
   #[ignore]
   fn test_recovery_with_empty_saga_store() {
       // Upgrade with no sagas -- should complete without error
   }

   #[test]
   #[ignore]
   fn test_recovery_with_100_stuck_sagas() {
       // Stress test: inject 100 stuck sagas, verify all recovered
       // Measure: IC instruction count for recovery scan
   }

   #[test]
   #[ignore]
   fn test_recovery_idempotent_on_double_upgrade() {
       // Upgrade twice in quick succession
       // Verify: no double-rollback or state corruption
   }
   ```

4. **Verify rollback endpoint calls (if inter-canister)**
   ```bash
   # Check if recover_stuck_sagas_impl makes inter-canister calls
   rg -A 10 'recover_stuck_sagas_impl' src/case_hub/src/lib.rs | rg 'Call::'
   # If it does: deploy target canisters (case_timeline, deadline_alerts, settlement)
   # and verify their rollback endpoints were called
   ```

5. **Measure timing**
   ```bash
   # Build and deploy
   mise run build
   cargo nextest run -E 'test(/saga_recovery/)' -p tests
   ```

## Setup

- Working directory: `/mnt/media_backup/PROJECTS/awen-network-canisters`
- Branch: `experiment/ex-00029-saga-recovery`
- Dependencies: PocketIC (already configured), case_hub WASM
- Key files:
  - `src/case_hub/src/lib.rs` -- `recover_stuck_sagas_on_upgrade()` at line 382, `recover_stuck_sagas_impl()` at line 394
  - `packages/awen_types/src/saga.rs` -- `SagaState` type definition
  - `awen_types::awen_lifecycle!(post_upgrade)` -- the hook point
- Build: `mise run build` (required before integration tests)
- Test runner: `cargo nextest run -E 'test(/saga_recovery/)' --run-ignored`

## Algorithm

AL-00002: Saga pattern. The recovery scan is the missing piece of the saga lifecycle -- sagas can get stuck when async calls are killed during upgrade. The scan iterates SAGA_STORE, finds sagas in transient states older than threshold, and transitions them to RolledBack (or Compensating -> RolledBack).

## Success Criteria

- [ ] recover_stuck_sagas_impl behavior documented (which states trigger recovery, what threshold)
- [ ] PocketIC test: 3 stuck sagas (Pending, StepCompleted, Compensating) all transitioned to RolledBack
- [ ] PocketIC test: recent Pending saga (under threshold) NOT touched
- [ ] PocketIC test: terminal-state saga (Completed) NOT touched
- [ ] Edge case: empty SAGA_STORE upgrade completes without error
- [ ] Edge case: 100 stuck sagas all recovered (stress test)
- [ ] Edge case: double upgrade does not corrupt state
- [ ] Recovery completes within 60 seconds of IC time after upgrade
- [ ] If inter-canister rollback calls exist: target canister rollback endpoints verified

## Data Collection

| Metric | Target | Actual |
|--------|--------|--------|
| Stuck sagas injected (main test) | 3 | TBD |
| Non-stuck sagas (should be untouched) | 2 | TBD |
| Recovery rate (stuck sagas transitioned) | 100% (3/3) | TBD |
| False positives (non-stuck sagas disturbed) | 0 | TBD |
| Recovery time (IC time elapsed) | < 60 seconds | TBD |
| Stress test: 100 sagas recovered | 100/100 | TBD |
| Instruction count for 100-saga scan | TBD (baseline) | TBD |

## Risks & Mitigations

- **recover_stuck_sagas_impl may only log, not rollback**: The hypothesis notes first implementation should be detect-only. Mitigation: read the actual implementation first (step 1). If detect-only, the test verifies detection count and adjusts success criteria to "detected" instead of "RolledBack".
- **PocketIC time advancement may not trigger timers**: `pic.advance_time()` advances the IC clock but `pic.tick()` is needed to process timers. Mitigation: call `pic.tick()` after advancing time. If timers still don't fire, use multiple ticks or `pic.execute_round()`.
- **Inter-canister rollback calls may fail if target canisters not deployed**: If recovery makes cross-canister calls, all target canisters must be deployed to PocketIC. Mitigation: deploy full canister set, or mock the rollback endpoints.
- **Threshold tuning**: Too aggressive kills legitimate in-flight sagas. Mitigation: document the current threshold value and test at boundary (saga age == threshold - 1 second should NOT be recovered).

## Results

(Fill in after running)

## Analysis

(Fill in after running)

## Next Steps

If 100% recovery: create RE- result entry, consider promoting to CI integration test. If partial recovery: identify which saga states are not handled and file follow-up HY-. If detect-only implementation confirmed: create HY- for adding actual rollback execution. Measure instruction cost and create follow-up if it exceeds IC per-message limits for large saga stores.
