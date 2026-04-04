---
id: ID-00056
title: "Automated upgrade rollback via pre-upgrade snapshot with post_upgrade health validation gate"
status: draft
created: 2026-03-27
sources: [SR-00043, SR-00033, SR-00034]
phase: dream
domain: "architecture"
tags: [upgrade, rollback, snapshot, health-check, resilience]
scores:
  feasibility: 5
  novelty: 7
  impact: 8
  elegance: 8
---

## Description

In pre_upgrade, take a canister snapshot via ic-cdk 0.19's snapshot APIs before serializing state. In post_upgrade, run a health validation gate — a series of checks (stable memory readable, key record counts match expected, all StableBTreeMaps deserializable, timer reconstruction succeeded). If any check fails, automatically restore the snapshot instead of leaving the canister in a corrupted state. This converts upgrades from "hope it works" to "proven safe or auto-rollback." The health gate is a configurable list of assertions per canister, defined in a shared `upgrade_health` module.

## Provenance

Generated during dream phase from [SR-00043, SR-00033, SR-00034]. Theme: architecture/reliability. SR-00043 introduced snapshot APIs making programmatic rollback possible. SR-00033 showed the post-upgrade timer scan pattern for saga recovery. SR-00034 demonstrated controller-only rollback endpoints as a manual safety net — this idea automates that safety net.

## Connection

All 9 canisters benefit from upgrade safety. evidence_vault is highest priority (immutable evidence cannot be lost). settlement and case_hub handle financial and case lifecycle data. Complements ID-00055 (schema registry) — the registry detects version mismatches, the rollback gate acts on detection failure. Different from ID-00010 (self-healing after trap) — this is proactive prevention during upgrades, not reactive recovery.

## Next Steps

Hypothesis: "A post_upgrade health gate with snapshot rollback reduces upgrade-induced data loss to zero in evidence_vault." Test by introducing a deliberately breaking schema change, upgrading in PocketIC, and verifying the rollback fires and restores the previous state.
