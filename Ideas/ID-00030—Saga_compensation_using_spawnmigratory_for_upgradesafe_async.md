---
id: ID-00030
title: "Saga compensation using spawn_migratory for upgrade-safe async flows"
status: draft
created: 2026-03-25
sources: [SR-00053, AL-00002]
phase: mate
domain: "canister-reliability"
tags: [saga, spawn-migratory, upgrade-safety, async, ic-cdk-019]
scores:
  feasibility: 55
  novelty: 60
  impact: 85
  elegance: 85
---

## Description

ic-cdk 0.19 introduces `spawn_migratory`, a variant of `ic_cdk::spawn` that preserves async task state across canister upgrades. Currently, when a saga compensation flow (AL-00002) is mid-execution during an upgrade, the spawned async task is killed and the compensation step never completes, leaving cross-canister state in a partially-rolled-back condition. By replacing `ic_cdk::spawn` with `spawn_migratory` in saga orchestration code, the async compensation task survives the upgrade boundary and resumes on the other side. This is the most elegant solution to the timer/saga persistence problem because it operates at the right abstraction level -- the async runtime itself -- rather than requiring manual serialization and reconstruction of timer state.

## Provenance

Mating AL-00002 (saga compensation pattern with idempotency keys) with SR-00053 (`spawn_migratory` from ic-cdk 0.19). AL-00002 defines the saga orchestration logic but relies on the assumption that spawned async tasks run to completion. SR-00053 documents a new IC platform primitive that makes that assumption valid even across upgrades. The cross-pollination is direct: `spawn_migratory` is the platform-level answer to the exact problem that saga compensation flows face. The feasibility concern is that ic-cdk 0.19 is relatively new and `spawn_migratory` may have edge cases with complex async state.

## Connection

Primary beneficiaries are case_hub (multi-canister case lifecycle sagas), settlement (offer/counter-offer/accept flows that span multiple canisters), and deadline_alerts (ACAS extension calculations that trigger cross-canister updates). Changes required: (1) upgrade ic-cdk dependency to 0.19+ across the workspace, (2) replace `ic_cdk::spawn` with `spawn_migratory` in all saga compensation code paths, (3) ensure all captured state in async closures implements the required serialization traits for migration, (4) add PocketIC integration tests that upgrade canisters mid-saga and verify completion.

## Next Steps

1. Evaluate ic-cdk 0.19 stability: check release notes, open issues, and community adoption of `spawn_migratory` specifically. Document any known limitations.
2. Identify all `ic_cdk::spawn` call sites in saga-related code across case_hub, settlement, and deadline_alerts. Classify which ones would benefit from migration safety.
3. Convert one saga flow in case_hub to use `spawn_migratory`, write a PocketIC test that upgrades the canister mid-compensation, and verify the async task resumes correctly.
