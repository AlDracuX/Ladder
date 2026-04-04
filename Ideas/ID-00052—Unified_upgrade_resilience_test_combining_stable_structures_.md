---
id: ID-00052
title: "Unified upgrade resilience test combining stable structures timer persistence and spawn semantics in PocketIC"
status: draft
created: 2026-03-27
sources: [SR-00004, SR-00051, SR-00053, SR-00024]
phase: dream
domain: "testing"
tags: [upgrade, pocketic, stable-structures, timers, spawn, integration-test]
scores:
  feasibility: 5
  novelty: 7
  impact: 9
  elegance: 6
---

## Description

Canister upgrades involve three independent but interacting dimensions of state preservation: stable structures (data survives via StableBTreeMap), timer persistence (ic-cdk-timers are destroyed and must be rescheduled), and spawn task semantics (protected tasks block upgrades, weak tasks are dropped, migratory tasks survive). Currently these are tested in isolation (ID-00004 covers stable storage, ID-00027 covers timer registry). This idea proposes a unified PocketIC integration test that exercises all three dimensions simultaneously: populate stable storage with data, schedule timers, spawn async tasks of each type, then trigger a canister upgrade and verify that (a) all stable data survives, (b) timers are correctly rescheduled from the registry, (c) protected tasks blocked the upgrade or completed first, (d) weak tasks were dropped without side effects, and (e) any in-flight saga journals recovered correctly. This would be the definitive upgrade safety test for the Awen network.

## Provenance

Generated during dream phase from [SR-00004, SR-00051, SR-00053, SR-00024]. Theme: architecture/testing. SR-00004 identifies the untested stable structure upgrade path. SR-00051 documents timer destruction on upgrade. SR-00053 introduces the three spawn task types with different upgrade behaviors. SR-00024 provides the journaling pattern that must survive upgrades.

## Connection

This test would live in `tests/integration/` and exercise at least `deadline_alerts` (timers + stable storage) and `case_hub` (cross-canister aggregation with spawned tasks). It interacts with ID-00004 (stable storage upgrade test), ID-00027 (timer registry), ID-00030 (spawn_migratory for sagas), and ID-00051 (spawn classification). Rather than duplicating those, it synthesizes them into a single comprehensive scenario.

## Next Steps

Hypothesis: "A PocketIC test that upgrades deadline_alerts mid-operation will reveal at least 1 failure mode where timer state is lost and at least 1 where in-flight async work is silently dropped." Experiment by writing the test against the current codebase without any of the proposed improvements, documenting what breaks.
