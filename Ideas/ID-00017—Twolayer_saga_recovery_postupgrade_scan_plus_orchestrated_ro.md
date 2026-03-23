---
id: ID-00017
title: "Two-layer saga recovery: post-upgrade scan plus orchestrated rollback"
status: draft
created: 2026-03-23
sources: [SR-00033, SR-00034]
phase: dream
domain: "canister-reliability"
tags: [saga, rollback, post-upgrade, recovery, orchestration]
scores:
  feasibility: 75
  novelty: 60
  impact: 90
  elegance: 70
---

## Description

Implement a two-layer saga recovery system across all 9 canisters. Layer 1 (automatic): the `post_upgrade` hook schedules a timer that scans stable storage for sagas with status "in_progress" and age exceeding a threshold, then automatically retries or rolls them back. Layer 2 (manual): a `case_hub` orchestrator endpoint calls `rollback_case_*` across all child canisters in a single admin action, providing controller-level intervention when automated recovery fails or produces ambiguous results.

The key insight is that neither layer alone is sufficient. Automated recovery handles the common case (upgrade killed an in-flight call) but cannot resolve ambiguous states. Manual rollback handles edge cases but requires human attention. Together they form a complete safety net.

## Provenance

DREAM phase: SR-00033 (post-upgrade timer scan for stuck sagas) describes the automated layer, while SR-00034 (controller-only rollback endpoints) describes the manual layer. The creative leap is combining them into a coordinated two-layer system with a shared saga status model, where Layer 1 handles 95% of cases automatically and Layer 2 catches the rest via an admin dashboard or CLI.

## Connection

Directly addresses inter-canister reliability, the largest systemic risk in the workspace. Related to ID-00002 (idempotency propagation) and ID-00009 (event sourcing journal), but more focused and immediately actionable. This is the "boring reliability" counterpart to the more ambitious journal canister idea.

## Next Steps

Hypothesis: After implementing two-layer recovery, 100% of sagas interrupted by canister upgrades are either automatically recovered (Layer 1) or manually resolvable (Layer 2) within 5 minutes of upgrade completion. Test by simulating upgrades during active cross-canister operations in PocketIC integration tests.
