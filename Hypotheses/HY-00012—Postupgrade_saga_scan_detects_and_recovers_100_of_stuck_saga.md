---
id: HY-00012
title: "Post-upgrade saga scan detects and recovers 100% of stuck sagas within 60 seconds of canister upgrade"
status: draft
created: 2026-03-24
idea: ID-00017
tags: [saga, post-upgrade, recovery, timer, resilience, case-hub]
prediction: "All sagas with status Pending or StepCompleted older than threshold are detected and rolled back within 60 seconds"
metric: "count of stuck sagas remaining after post-upgrade scan"
success_criteria: "zero stuck sagas after scan, all detected sagas transitioned to RolledBack or retried"
---

## Hypothesis

If we implement a post-upgrade timer scan in case_hub that queries SAGA_STORE for sagas with status `Pending` or `StepCompleted` older than a configurable threshold, then 100% of stuck sagas are detected and transitioned to `Compensating` → `RolledBack` within 60 seconds of canister upgrade.

## Rationale

SR-00033 documents that ICP canister upgrades kill all in-flight async calls. SR-00034 confirms rollback endpoints exist in case_timeline, deadline_alerts, and settlement. ID-00017 proposes combining post-upgrade scan with orchestrated rollback. The saga pattern (AL-00002) already tracks state in SAGA_STORE, but has no automated recovery — a stuck saga remains stuck forever. The `awen_lifecycle!(post_upgrade)` macro provides the hook point.

## Testing Plan

1. PocketIC integration test: create a case via saga, inject a stuck saga (status: StepCompleted, created 10 minutes ago)
2. Simulate canister upgrade via PocketIC's `upgrade_canister` API
3. Wait 60 seconds (or advance IC time)
4. Query SAGA_STORE: verify stuck saga transitioned to `RolledBack`
5. Query case_timeline/deadline_alerts: verify rollback endpoints were called
6. Verify: non-stuck sagas (recent, in-progress) are NOT touched

## Success Criteria

- Primary: 100% of sagas older than threshold with non-terminal status are detected
- Secondary: rollback completes within 60 seconds of upgrade
- Tertiary: no data loss — rollback removes partial data cleanly (verified by re-querying)

## Risks

- Calling rollback endpoints from a timer callback requires inter-canister calls, which may fail if target canisters are also upgrading simultaneously
- Threshold tuning: too aggressive = kills legitimate in-flight sagas; too conservative = leaves stuck sagas longer
- First implementation should be detect-only (log), not auto-rollback, until confidence is established
