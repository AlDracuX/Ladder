---
id: ID-00054
title: "Post-trap diagnostic state forensics logging canister state snapshot via is_recovering_from_trap before cleanup"
status: draft
created: 2026-03-27
sources: [SR-00026, SR-00003, SR-00024]
phase: dream
domain: "reliability"
tags: [trap-recovery, diagnostics, forensics, ic-cdk, canister-logging]
scores:
  feasibility: 7
  novelty: 6
  impact: 6
  elegance: 7
---

## Description

ic-cdk's `is_recovering_from_trap` function (SR-00026) tells post_upgrade hooks whether the previous execution trapped. ID-00010 proposes using this for self-healing rollback, but there is a complementary opportunity: diagnostic forensics. Before any cleanup or rollback, the post_upgrade hook should capture a state snapshot -- which saga journals are in-flight (from `awen_types::saga::SagaJournal`), which stable storage entries were last modified, what the last known timer state was, and what the HealthStatus was before the trap. This snapshot would be written to a dedicated diagnostic log in stable memory (a small StableBTreeMap with a ring-buffer eviction policy, capped at 100 entries). When `is_recovering_from_trap()` returns true, the forensic snapshot is captured BEFORE any recovery logic runs, preserving the pre-recovery state for debugging. This gives operators a "black box" flight recorder for canister traps, especially valuable for production incidents where the trap cause is not immediately obvious.

## Provenance

Generated during dream phase from [SR-00026, SR-00003, SR-00024]. Theme: reliability. SR-00026 provides the is_recovering_from_trap API. SR-00003 identifies the missing InvalidState variant in procedural_intel, the kind of state machine bug that would cause traps. SR-00024 provides the journaling pattern whose in-flight state would be valuable in forensic snapshots.

## Connection

Applies to all 9 canisters via a shared `TrapDiagnostic` type in `packages/awen_types/`. The `monitoring.rs` module already has `HealthStatus` which could be extended or referenced by the diagnostic snapshot. Complements ID-00010 (self-healing with trap recovery) by providing the observability layer that ID-00010's recovery logic needs to make informed decisions. Also relevant to ID-00052 (unified upgrade resilience test) which could verify that forensic snapshots are correctly captured.

## Next Steps

Hypothesis: "Adding a TrapDiagnostic ring buffer to deadline_alerts and deliberately triggering a trap via PocketIC will produce a forensic snapshot that identifies the exact pre-trap saga state in at least 1 test scenario." Experiment by implementing the diagnostic type and the post_upgrade hook in a single canister first.
