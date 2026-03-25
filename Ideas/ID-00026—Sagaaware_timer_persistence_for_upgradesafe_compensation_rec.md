---
id: ID-00026
title: "Saga-aware timer persistence for upgrade-safe compensation recovery"
status: draft
created: 2026-03-25
sources: [SR-00051, AL-00002]
phase: mate
domain: "canister-reliability"
tags: [saga, timer, upgrade-safety, compensation, stable-storage]
scores:
  feasibility: 60
  novelty: 50
  impact: 80
  elegance: 70
---

## Description

When deadline_alerts or case_hub undergoes a canister upgrade, all in-flight `ic_cdk_timers` are silently destroyed. Any saga compensation flow that relies on a timer-driven retry or rollback step simply vanishes, leaving the system in a partially-committed state with no recovery path. This idea introduces a saga-aware timer persistence layer: before `pre_upgrade`, every active timer's metadata (callback identifier, scheduled time, saga step reference, retry count) is serialized into stable storage. On `post_upgrade`, the layer re-registers timers from persisted state and resumes compensation flows exactly where they left off. The result is that canister upgrades become invisible to long-running saga orchestrations rather than a silent data-integrity hazard.

## Provenance

Mating AL-00002 (saga compensation pattern) with SR-00051 (timer persistence across upgrades). The saga pattern already defines compensation steps but assumes timers survive indefinitely. SR-00051 documents the IC platform behavior where timers are dropped on upgrade. The cross-pollination insight is that saga step metadata already contains everything needed to reconstruct a timer -- the compensation callback, the target canister, and the retry policy -- so persisting the timer is really just persisting the saga step's execution schedule.

## Connection

Directly benefits deadline_alerts (which schedules ACAS deadline reminders and ERA 1996 statutory notifications) and case_hub (which orchestrates multi-canister case lifecycle sagas). Both canisters currently lose timer state on upgrade, meaning a saga that was mid-compensation will silently fail. The change requires: (1) a `StableBTreeMap<TimerId, TimerEntry>` in each canister's stable storage, (2) serialization logic in `pre_upgrade` that captures active timer metadata, (3) reconstruction logic in `post_upgrade` that re-registers timers from persisted entries, and (4) saga step definitions that reference timer IDs so compensation flows can verify timer liveness.

## Next Steps

1. Audit deadline_alerts and case_hub to catalogue every `ic_cdk_timers::set_timer` and `set_timer_interval` call, documenting which ones are saga-related versus fire-and-forget.
2. Design a `TimerEntry` struct (saga_step_id, callback_tag enum, scheduled_at, retry_count, max_retries) and implement `Storable` for it using the AL-00004 pattern.
3. Write a PocketIC integration test that deploys a canister, starts a saga with a timer-driven compensation step, upgrades the canister mid-saga, and asserts the compensation completes after upgrade.
