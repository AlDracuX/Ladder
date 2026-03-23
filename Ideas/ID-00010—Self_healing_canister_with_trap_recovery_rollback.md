---
id: ID-00010
title: "Self-healing canister with trap recovery rollback"
status: draft
created: 2026-03-23
sources: [SR-00026, SR-00004]
phase: dream
domain: "canister-resilience"
tags: [self-healing, trap-recovery, rollback, stable-storage]
scores:
  feasibility: 45
  novelty: 85
  impact: 70
  elegance: 80
---

## Description

Canisters use `is_recovering_from_trap` (SR-00026) to detect post-trap corruption, then automatically rollback to the last consistent stable storage snapshot. Each canister maintains a "consistency checkpoint" in stable memory — a validated snapshot taken after successful operations. On trap recovery, the canister compares current state against the checkpoint and auto-reverts corrupted segments.

This goes beyond upgrade testing (ID-00004) — it's runtime self-healing during normal operation.

## Provenance

DREAM phase: free-association from SR-00026 (trap recovery API) crossing with SR-00004 (upgrade path untested). The leap: what if canisters didn't just survive traps but actively healed themselves? Like biological systems that detect and repair damage autonomously.

## Connection

Addresses canister resilience beyond planned upgrades. Traps can corrupt in-flight state; currently there's no recovery mechanism. Self-healing turns a crash from a potential data loss event into a transparent recovery.

## Next Steps

Hypothesis: A canister using consistency checkpoints and trap detection can recover from 95%+ of trap-induced state corruptions without manual intervention.
