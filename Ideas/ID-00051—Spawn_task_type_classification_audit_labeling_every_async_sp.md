---
id: ID-00051
title: "Spawn task type classification audit labeling every async spawn as protected weak or migratory"
status: draft
created: 2026-03-27
sources: [SR-00053, SR-00051, SR-00024]
phase: dream
domain: "architecture"
tags: [ic-cdk, spawn, async, upgrade-safety, audit]
scores:
  feasibility: 6
  novelty: 7
  impact: 8
  elegance: 6
---

## Description

ic-cdk 0.19 introduced three async task types -- spawn (protected, blocks upgrades), spawn_weak (dropped on upgrade), and spawn_migratory (survives upgrades). This is a breaking change from the uniform spawn behavior in 0.18.x. Every async operation across all 9 canisters needs explicit classification: saga steps and inter-canister state mutations should use protected spawn to prevent mid-operation upgrades; optional telemetry, cache warming, and non-critical logging should use spawn_weak; and long-running background tasks that span upgrade boundaries should use spawn_migratory. This audit would produce a classification table mapping each spawn call site to its correct task type, with rationale, then implement the migration. Misclassification risks either blocking upgrades indefinitely (too many protected tasks) or silently dropping critical work (weak where protected was needed).

## Provenance

Generated during dream phase from [SR-00053, SR-00051, SR-00024]. Theme: architecture/upgrade-safety. SR-00053 introduces the three task types and the breaking change. SR-00051 provides the timer persistence context that interacts with spawn semantics. SR-00024 provides the journaling pattern that determines which operations are critical enough for protected spawn.

## Connection

Affects all 9 canisters but especially mcp_gateway (request dispatch spawns), case_hub (cross-canister aggregation), and any canister implementing saga patterns (AL-00002). The `packages/awen_types/src/saga.rs` SagaJournal type defines multi-step workflows whose async execution must be classified. Also interacts with ID-00030 (spawn_migratory for sagas) but is broader -- ID-00030 targets sagas only while this covers ALL spawn sites.

## Next Steps

Hypothesis: "A systematic grep for spawn/ic_cdk::spawn across all 9 canisters will find at least 5 spawn call sites, of which at least 2 are currently using the wrong task type for their criticality level." Experiment by running the audit and documenting each site's classification before/after.
