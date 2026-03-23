---
id: SR-00033
title: "Pattern: post_upgrade timer scan for stuck sagas"
type: pattern
url: ""
status: draft
created: 2026-03-23
tags: [saga, post-upgrade, timer, resilience, canister-lifecycle]
domain: "canister-reliability"
relevance: "high"
---

## Summary

The `awen_lifecycle!` macro supports a `post_upgrade` hook where canisters can schedule a one-shot timer to scan for sagas that were in-flight when the canister was upgraded. Since ICP canister upgrades kill all pending async calls, any saga that was mid-execution becomes permanently stuck unless explicitly recovered. This pattern detects and resumes or rolls back those orphaned sagas on restart.

## Key Points

- ICP canister upgrades terminate all in-flight inter-canister calls with no automatic retry
- The `awen_lifecycle!(post_upgrade => { ... })` macro in `awen_types` provides the hook point for recovery logic
- A timer-based scan (via `ic-cdk-timers`) runs shortly after upgrade to inspect saga state in stable storage
- Sagas older than a configurable threshold with status "in_progress" are candidates for rollback or retry
- This is complementary to the rollback endpoints (SR-00034) which handle manual/controller-initiated recovery

## Connection to Problems

Addresses the gap where cross-canister sagas (e.g., case creation touching case_hub, case_timeline, deadline_alerts, and settlement) can silently fail during upgrades. Without post-upgrade recovery, users see partially-created cases with no error feedback. This is especially critical for the Awen Network where legal case data integrity is paramount.

## Potential Ideas

- Combine with the journaling pattern (SR-00024) to create a "saga recovery dashboard" that shows all recovered/rolled-back sagas after each upgrade
- Implement a graduated recovery strategy: retry once, then rollback, then alert controller
