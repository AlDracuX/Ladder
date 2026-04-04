---
id: EX-00040
title: "Simulate memory pressure in evidence_vault and measure read availability after dynamic quota halving"
status: draft
created: 2026-03-27
hypothesis: HY-00040
algorithm: ""
tags: [memory-pressure, quota, on-low-wasm-memory, evidence-vault, resilience, graceful-degradation]
methodology: "Deploy evidence_vault to PocketIC, fill to ~80% memory, measure baseline trap behavior, add on_low_wasm_memory hook with quota halving and write rejection, re-run workload, compare read availability windows"
duration: "4 hours"
success_criteria: "Read queries succeed at >95% rate for 60+ seconds after memory pressure; write rejection returns clean error (not trap); zero existing test regressions"
---

## Objective

Validate that halving per-user storage quotas when `on_low_wasm_memory` fires and rejecting new writes while allowing reads keeps the evidence_vault canister responsive for reads (>95% success rate) for at least 60 seconds after memory pressure begins. Without protection, the canister traps immediately on OOM, losing all in-flight requests and becoming completely unavailable.

## Methodology

1. **Verify on_low_wasm_memory hook availability**
   ```bash
   cd /mnt/media_backup/PROJECTS/awen-network-canisters
   # Check ic-cdk version supports on_low_wasm_memory
   grep 'ic-cdk' Cargo.toml | head -5
   # Check if the hook is already used anywhere
   grep -rn 'on_low_wasm_memory\|low_wasm_memory' src/ --include='*.rs'
   # Check ic-cdk docs for the attribute syntax
   ```

2. **Record baseline: evidence_vault behavior under memory exhaustion (no protection)**
   ```bash
   # PocketIC integration test:
   # 1. Deploy evidence_vault with default settings
   # 2. Fill with large evidence records until ~80% memory utilization
   #    (each record: ~1KB data + metadata = ~1.5KB per entry)
   #    For 4GB WASM heap: ~80% = 3.2GB = ~2.1M records
   #    PocketIC may have smaller limits -- adjust accordingly
   # 3. Continue adding records, recording:
   #    - Timestamp of each successful write
   #    - Timestamp of each successful read (query)
   #    - Timestamp of first trap/error
   # 4. After trap: attempt 100 read queries
   # 5. Record: reads succeed? time-to-trap? recovery possible?
   cargo nextest run --run-ignored -E 'test(/baseline_memory_exhaustion/)'
   ```

3. **Implement on_low_wasm_memory hook with quota halving**
   ```bash
   git worktree add /tmp/ex-00040 -b experiment/ex-00040-memory-pressure-quota
   cd /tmp/ex-00040
   # In src/evidence_vault/src/lib.rs:
   #
   # thread_local! {
   #     static MEMORY_PRESSURE: Cell<bool> = Cell::new(false);
   #     static EFFECTIVE_QUOTA: Cell<usize> = Cell::new(MAX_RECORDS_PER_USER);
   # }
   #
   # #[on_low_wasm_memory]
   # fn handle_memory_pressure() {
   #     MEMORY_PRESSURE.with(|mp| mp.set(true));
   #     EFFECTIVE_QUOTA.with(|q| q.set(q.get() / 2));
   #     ic_cdk::print("MEMORY PRESSURE: quotas halved, writes rejected");
   # }
   ```

4. **Modify write endpoints to check MEMORY_PRESSURE flag**
   ```bash
   # In store_evidence_impl and any other write functions:
   #   if MEMORY_PRESSURE.with(|mp| mp.get()) {
   #       return Err(EvidenceError::MemoryPressure(
   #           "Canister under memory pressure -- writes temporarily disabled".into()
   #       ));
   #   }
   # This returns a clean error (not a trap) to the caller
   ```

5. **Ensure read endpoints are unaffected**
   ```bash
   # Query functions (get_evidence, list_evidence, etc.) should NOT check
   # MEMORY_PRESSURE -- reads are always allowed. Verify by checking that
   # no read path references the flag.
   ```

6. **Run protected workload test**
   ```bash
   # PocketIC integration test:
   # 1. Deploy modified evidence_vault
   # 2. Fill to ~80% memory (same as baseline)
   # 3. Continue adding records:
   #    - Writes should start returning Err(MemoryPressure) after hook fires
   #    - Reads should continue succeeding
   # 4. After memory pressure triggers:
   #    a. Attempt 100 write operations -- expect all rejected with clean error
   #    b. Attempt 100 read operations -- expect >95 succeed
   #    c. Record timestamps for 60 seconds of read operations
   #    d. Calculate read success rate over 60-second window
   # 5. Record: time between hook firing and first failed read (if any)
   cargo nextest run --run-ignored -E 'test(/protected_memory_pressure/)'
   ```

7. **Compare baseline vs protected**
   ```bash
   # Metrics comparison:
   # Baseline: time-to-trap, reads after trap (expect 0%)
   # Protected: time from pressure to first failed read (expect >60s),
   #            read success rate in 60s window (expect >95%)
   ```

8. **Test that write rejection error is clean and parseable**
   ```bash
   # Unit test: call store_evidence_impl with MEMORY_PRESSURE = true
   # Assert: returns Err(EvidenceError::MemoryPressure(_))
   # Assert: error message is descriptive
   # Assert: no trap, no panic
   cargo nextest run -p evidence_vault -E 'test(/memory_pressure_write_rejection/)'
   ```

9. **Test quota recovery (optional -- future enhancement)**
   ```bash
   # If memory pressure is relieved (e.g., old records expired):
   # Can we reset MEMORY_PRESSURE to false?
   # Current design: no automatic recovery (requires operator intervention)
   # Document this limitation
   ```

10. **Run full test suite**
    ```bash
    mise run nextest
    ```

## Setup

- Working directory: `/mnt/media_backup/PROJECTS/awen-network-canisters`
- Branch: `experiment/ex-00040-memory-pressure-quota` (git worktree at `/tmp/ex-00040`)
- Primary canister: `src/evidence_vault/src/lib.rs`
- Current quota: `MAX_RECORDS_PER_USER` (likely 10,000 -- same pattern as settlement)
- ic-cdk version: 0.19+ (required for `#[on_low_wasm_memory]` attribute)
- PocketIC: need to verify it simulates WASM memory pressure (may need to use a canister with artificially low memory limit)
- No existing `on_low_wasm_memory` usage in the codebase (first implementation)

## Algorithm

No specific AL- entry. Novel pattern: memory-pressure-responsive quota throttling. Combines the IC's `on_low_wasm_memory` system hook with the existing per-user quota pattern (`check_quota!` macro in awen_types). The hook fires when WASM memory reaches a platform-defined threshold, giving the canister a chance to respond before OOM trap.

## Success Criteria

- [ ] on_low_wasm_memory hook compiles for wasm32-unknown-unknown in evidence_vault
- [ ] Baseline test: evidence_vault traps on memory exhaustion (documenting current behavior)
- [ ] MEMORY_PRESSURE flag set by on_low_wasm_memory hook
- [ ] EFFECTIVE_QUOTA halved when hook fires
- [ ] Write endpoints return Err(MemoryPressure) when flag is set (not trap)
- [ ] Read endpoints are unaffected by MEMORY_PRESSURE flag
- [ ] Read success rate > 95% for 60+ seconds after memory pressure triggers
- [ ] Write rejection error message is descriptive and parseable
- [ ] All existing evidence_vault tests pass without modification
- [ ] Protected canister stays responsive longer than baseline (comparison documented)

## Data Collection

| Metric | Target | Baseline (no protection) | Protected |
|--------|--------|--------------------------|-----------|
| Time to first trap/error (s) | n/a | TBD | TBD |
| Read success rate, 0-60s after pressure | >95% | TBD (expect 0%) | TBD |
| Write rejection type | clean error | trap | TBD |
| Total reads attempted in 60s window | 100 | TBD | TBD |
| Total reads succeeded in 60s window | >95 | TBD | TBD |
| Canister recovery without restart | n/a | No | TBD |
| Memory at hook trigger (%) | <90% | n/a | TBD |
| Quota after halving | 5,000 | n/a | TBD |
| Existing test regressions | 0 | n/a | TBD |

## Risks & Mitigations

- **on_low_wasm_memory fires too late**: The hook may trigger when there is so little memory left that even the hook's own logic causes OOM. Mitigation: the hook's logic is minimal (set a Cell<bool>, halve a Cell<usize>, print) -- a few bytes of stack. If still too late, consider proactive monitoring via `ic_cdk::api::stable::stable_size()` checks in a periodic timer.
- **PocketIC does not simulate WASM memory pressure**: PocketIC may not trigger `on_low_wasm_memory`. Mitigation: test the logic path separately (unit test: set flag manually, verify write rejection and read success). For the full integration test, use a canister with artificially small WASM heap or dfx local replica.
- **Quota halving insufficient for single large user**: If one user already has 10,000 records, halving the quota to 5,000 does not reduce their existing storage. Mitigation: quota halving prevents NEW writes from any user. Existing data is read-only. The point is to stop growth, not reduce existing usage.
- **No automatic recovery**: Once MEMORY_PRESSURE is set, it never resets (no code path sets it back to false). Mitigation: document that operator intervention (canister upgrade or explicit reset endpoint) is required. Future enhancement: timer-based re-check that clears the flag if memory drops below threshold.
- **EvidenceError enum must include MemoryPressure variant**: Adding a variant changes the Candid interface. Mitigation: Candid enums are forward-compatible -- old clients ignore unknown variants. Update the .did file.

## Results

(Fill in after running)

## Analysis

(Fill in after running)

## Next Steps

If >95% read availability achieved: create AL- entry for memory-pressure-responsive quota pattern, apply to all 9 canisters, document operator runbook for memory pressure events. If PocketIC cannot test this: design a unit-test-only approach and defer integration testing to dfx replica. If the hook fires too late: investigate proactive monitoring via periodic `stable_size()` checks (different hypothesis). Consider adding a `/admin/reset_memory_pressure` endpoint for operator recovery.
