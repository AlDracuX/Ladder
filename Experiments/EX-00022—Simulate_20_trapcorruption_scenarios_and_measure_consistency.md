---
id: EX-00022
title: "Simulate 20 trap-corruption scenarios and measure consistency checkpoint detection rate in evidence_vault"
status: draft
created: 2026-03-27
hypothesis: HY-00034
algorithm: ""
tags: [self-healing, trap-recovery, rollback, stable-storage, evidence-vault, pocketic]
methodology: "Add ConsistencyCheckpoint to evidence_vault, deploy to PocketIC, inject 20 trap scenarios via ic0.trap, measure detection and auto-revert success rate"
duration: "6 hours"
success_criteria: "At least 19/20 trap scenarios result in successful self-healing; zero false negatives; checkpoint overhead under 5% per-operation latency; post-recovery state passes all invariant checks"
---

## Objective

Validate that a consistency checkpoint mechanism in evidence_vault -- using entry count hashing plus `is_recovering_from_trap()` detection -- catches and automatically reverts 95%+ of trap-induced stable storage corruption. This is critical because evidence_vault stores immutable evidence with chain-of-custody guarantees; corruption undermines legal evidentiary integrity.

## Methodology

1. **Baseline: measure evidence_vault behavior under trap conditions without protection**
   ```bash
   cd /mnt/media_backup/PROJECTS/awen-network-canisters
   mise run build
   # PocketIC test: deploy evidence_vault, store 10 evidence records,
   # then trigger a trap mid-write (via a specially crafted oversized input
   # that causes the canister to exceed instruction limits)
   # Observe: does the canister recover? What state is it in?
   cargo nextest run -p tests -E 'test(/trap_baseline/)' --no-capture 2>&1
   ```

2. **Implement ConsistencyCheckpoint** (describe, not implement)
   - File: `src/evidence_vault/src/lib.rs`
   - Add type: `ConsistencyCheckpoint { entry_count: u64, last_key_hash: [u8; 32], ic_timestamp: u64 }`
   - Add storage: `StableCell<ConsistencyCheckpoint, Memory>` using a dedicated memory ID
   - Update checkpoint after each successful `store_evidence_impl` call:
     a. Count entries in StableBTreeMap
     b. SHA-256 hash of last inserted key
     c. Store checkpoint to StableCell

3. **Implement trap detection and revert** (describe, not implement)
   - In `init()` and `post_upgrade()`:
     a. Check `ic_cdk::api::is_recovering_from_trap()`
     b. If true: load checkpoint from StableCell
     c. Compare checkpoint.entry_count against actual StableBTreeMap len
     d. If mismatch: iterate entries with keys newer than checkpoint, remove them
     e. Log recovery action to a StableVec audit trail

4. **Design 20 trap scenarios for PocketIC testing**
   ```
   Scenarios 1-5:   Mid-single-write trap (trap during store_evidence_impl)
   Scenarios 6-10:  Mid-batch-write trap (trap after N of M batch inserts)
   Scenarios 11-14: During inter-canister call (trap while awaiting Call::bounded_wait)
   Scenarios 15-17: During hash computation (trap via instruction limit mid-SHA-256)
   Scenarios 18-19: During checkpoint write itself (trap during StableCell set)
   Scenario 20:     Double trap (trap during recovery from previous trap)
   ```

5. **Execute trap scenarios in PocketIC**
   ```bash
   # tests/integration/evidence_vault_trap_recovery_test.rs
   # For each scenario:
   #   a. Deploy evidence_vault with 10 pre-existing records
   #   b. Trigger the specific trap condition
   #   c. Verify canister restarts (PocketIC handles this automatically)
   #   d. Query evidence_vault: check entry count, check all pre-existing records intact
   #   e. Record: detected? reverted? data loss?
   cargo nextest run -p tests -E 'test(/trap_recovery/)' --no-capture 2>&1
   ```

6. **Measure checkpoint overhead**
   ```bash
   # Compare instruction count of store_evidence with and without checkpoint
   # Run 100 store_evidence calls with checkpoint enabled
   # Run 100 store_evidence calls without checkpoint (on baseline canister)
   # Compare average instruction count per call
   cargo nextest run -p tests -E 'test(/checkpoint_overhead/)' --no-capture 2>&1
   ```

7. **Verify false positive rate**
   ```bash
   # Scenarios where trap occurs but does NOT cause corruption:
   # - Trap before any state modification (validation failure)
   # - Trap after successful write and checkpoint update
   # Verify: checkpoint comparison shows no mismatch, no unnecessary rollback
   ```

## Setup

- Working directory: `/mnt/media_backup/PROJECTS/awen-network-canisters`
- Branch: `experiment/ex-00022-trap-recovery` (git worktree)
- Prerequisite: `mise run build`
- Modified canister: `src/evidence_vault/src/lib.rs` (add checkpoint logic)
- New integration tests: `tests/integration/evidence_vault_trap_recovery_test.rs`
- PocketIC trap injection: use `pic.execute_ingress_with_trap()` or instruction limit reduction

## Algorithm

No specific AL- entry. The checkpoint pattern is: write-ahead checkpoint (record expected state before risky operation), detect-on-recovery (compare actual vs checkpoint using is_recovering_from_trap), revert-to-consistent (remove entries added after checkpoint). Similar to database WAL but simplified for single-writer IC canisters.

## Success Criteria

- [ ] ConsistencyCheckpoint type defined with entry_count, last_key_hash, ic_timestamp
- [ ] Checkpoint updates after every successful store_evidence_impl
- [ ] is_recovering_from_trap check in init/post_upgrade
- [ ] At least 19/20 trap scenarios result in successful auto-revert
- [ ] Zero false negatives (no undetected corruption)
- [ ] Checkpoint overhead adds less than 5% to per-operation instruction count
- [ ] Post-recovery state passes all evidence_vault invariant checks
- [ ] Recovery audit trail logged to StableVec

## Data Collection

| Metric | Target | Actual |
|--------|--------|--------|
| Trap scenarios tested | 20 | TBD |
| Successful self-healing | 19+ (95%+) | TBD |
| Undetected corruption (false negatives) | 0 | TBD |
| Unnecessary rollbacks (false positives) | 0 | TBD |
| Checkpoint overhead (% increase in instructions) | <5% | TBD |
| Pre-existing records preserved after recovery | 100% | TBD |
| Recovery audit trail entries | 1 per detected trap | TBD |

## Risks & Mitigations

- **StableBTreeMap non-atomic inserts**: A trap during insert may leave the map in a state where entry count is inconsistent with actual entries (partially inserted). Mitigation: the checkpoint comparison detects this; the revert scans for orphaned entries by iterating from the last known good key.
- **Trap during checkpoint write**: If the canister traps while writing the checkpoint itself, the old checkpoint is preserved (StableCell write is atomic). Mitigation: the old checkpoint is still valid; at worst, one extra valid entry gets rolled back (conservative but safe).
- **Hash comparison false negatives**: If corruption preserves entry count but corrupts values, the hash check misses it. Mitigation: include a Merkle root of the last N entry hashes in the checkpoint, not just count.
- **PocketIC trap simulation fidelity**: PocketIC may not perfectly model IC trap behavior (especially instruction limit traps). Mitigation: test a subset of scenarios on a local dfx replica as well.
- **is_recovering_from_trap availability**: This API may not be available in all ic-cdk versions. Mitigation: check ic-cdk 0.19+ docs; fallback to a "dirty flag" set before operations and cleared after.

## Results

(Fill in after running)

## Analysis

(Fill in after running)

## Next Steps

If 95%+ detection achieved: generalize the checkpoint pattern to all 9 canisters, create AL- entry for the trap recovery pattern. If hash-only detection has gaps: explore Merkle tree checkpoints or periodic full-state snapshots. Create RE- result entry.
