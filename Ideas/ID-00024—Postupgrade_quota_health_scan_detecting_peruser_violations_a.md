---
id: ID-00024
title: "Post-upgrade quota health scan detecting per-user violations after recovery"
status: active
updated: 2026-03-23
created: 2026-03-23
sources: [SR-00033]
phase: mate
domain: "canister-reliability"
tags: [quota, post-upgrade, health-check, per-user, data-integrity, timer]
scores:
  feasibility: 8
  novelty: 5
  impact: 6
  elegance: 6
---

## Description

Add a post-upgrade timer scan (using the SR-00033 pattern) that iterates all records in each canister's stable storage and counts per-user totals, flagging any user who exceeds the `MAX_RECORDS_PER_USER` (10K) quota. During normal operation, quota checks run on every insert (AL-00005), but edge cases can bypass them: saga rollback failures that leave orphaned records, schema migrations that reassign ownership, or bugs in batch import. The health scan runs once after each upgrade, logs violations to the canister log, and optionally emits a metric via the `http_request` endpoint for monitoring dashboards.

## Provenance

Generated during MATE phase from AL-00005 (Per-user quota) × SR-00033 (post-upgrade timer scan). The insight is that quota enforcement at insert time assumes a consistent starting state, but upgrades and saga failures can violate that assumption. A post-upgrade scan is the natural checkpoint to verify quota invariants still hold.

## Connection

Affects all 9 canisters (each has per-user quotas). Implementation would add a `quota_health_check()` function called from the `awen_lifecycle!(post_upgrade)` hook. Results could be exposed via the existing `http_request` metrics endpoint (documented in AL-00005). Low risk since it's read-only — it detects but does not auto-remediate.

## Next Steps

- Hypothesis: "Post-upgrade quota scan completes within IC instruction limits for 100K records across all users"
- Test: benchmark iteration speed on the largest canister (evidence_vault) with synthetic data
- Decide: should violations auto-archive excess records, or just log and alert?
