---
id: HY-00034
title: "Consistency checkpoint in evidence_vault detects and reverts 95 percent of trap-induced stable storage corruption"
status: draft
created: 2026-03-27
idea: ID-00010
tags: [self-healing, trap-recovery, rollback, stable-storage]
prediction: "A consistency checkpoint mechanism using is_recovering_from_trap plus SHA-256 hash comparison detects and reverts 95%+ of trap-induced corruption in evidence_vault's stable storage"
metric: "Percentage of injected trap-corruption scenarios where the canister self-heals to last-known-good state"
success_criteria: "Out of 20 simulated trap-corruption scenarios in PocketIC, at least 19 result in automatic revert to consistent state with zero data loss"
---

## Hypothesis

If we add a consistency checkpoint to evidence_vault that (1) hashes the StableBTreeMap entry count + last-inserted key after each successful operation and (2) compares this hash on startup when is_recovering_from_trap returns true, then 95%+ of trap-induced stable storage corruptions are detected and automatically reverted to the last consistent checkpoint, without manual intervention.

## Rationale

IC canisters can trap during update calls, leaving stable storage in a partially-written state. The ic-cdk API provides `is_recovering_from_trap()` for detection, but no canisters in the workspace currently use it. evidence_vault is the highest-risk target because it stores immutable evidence with chain-of-custody guarantees -- corruption here undermines legal evidentiary integrity. A lightweight checkpoint (entry count hash, not full state copy) provides detection with minimal overhead. The revert strategy is: on trap recovery, compare current entry count/last-key hash against checkpoint; if mismatch, rollback the last operation by removing entries added after the checkpoint.

## Testing Plan

1. Add `ConsistencyCheckpoint { entry_count: u64, last_key_hash: [u8; 32], timestamp: u64 }` to evidence_vault stable storage
2. Update checkpoint after each successful store_evidence_impl call
3. In init/post_upgrade, check is_recovering_from_trap; if true, compare state against checkpoint
4. If mismatch detected, remove entries with keys newer than checkpoint's last_key_hash
5. PocketIC tests: inject 20 different trap scenarios (mid-write, mid-batch, during inter-canister call) and verify recovery
6. Measure false positive rate (traps that don't cause corruption but trigger unnecessary rollback)

## Success Criteria

- At least 19 of 20 simulated trap scenarios result in successful self-healing
- Zero false negatives (corruptions that go undetected)
- Checkpoint overhead adds less than 5% to per-operation latency
- Post-recovery state passes all evidence_vault invariant checks

## Risks

- StableBTreeMap operations may not be atomic -- a trap during insert could leave the map in a state where entry count is inconsistent with actual entries
- Rollback strategy (remove newest entries) may incorrectly remove entries that were committed before the trap
- is_recovering_from_trap may not be available in all IC runtime versions
- Hash comparison has false negative risk if corruption preserves entry count but corrupts values
