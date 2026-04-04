---
id: HY-00038
title: "Persisting saga timer metadata in stable storage enables compensation flow resumption after canister upgrade"
status: draft
created: 2026-03-27
idea: ID-00026
tags: [saga, timer, upgrade-safety, compensation, stable-storage]
prediction: "Serializing active saga timer metadata to StableBTreeMap in pre_upgrade and reconstructing timers in post_upgrade enables 100% of mid-saga compensation flows to resume after canister upgrade"
metric: "Percentage of in-flight saga compensation flows that complete successfully after a canister upgrade interrupts them"
success_criteria: "PocketIC test: start 5 saga compensation flows in deadline_alerts, upgrade canister mid-execution, all 5 complete successfully post-upgrade"
---

## Hypothesis

If we add a StableBTreeMap<TimerId, TimerEntry> to deadline_alerts and case_hub that serializes active saga timer metadata (callback tag, scheduled time, saga step reference, retry count) during pre_upgrade and reconstructs timers via ic_cdk_timers::set_timer during post_upgrade, then 100% of in-flight saga compensation flows survive canister upgrades and complete successfully.

## Rationale

case_hub currently has 1 set_timer call site for saga orchestration. deadline_alerts manages ACAS deadline reminders and ERA 1996 notifications. When either canister upgrades, all ic_cdk_timers are silently destroyed -- any saga compensation flow relying on a timer-driven retry step vanishes, leaving cross-canister state partially committed. The AL-00002 saga pattern defines compensation steps but assumes timers survive indefinitely. Persisting timer metadata is straightforward because saga step definitions already contain all information needed to reconstruct a timer: the compensation callback identity (an enum tag, not a function pointer), the target canister, and the retry policy.

## Testing Plan

1. Audit deadline_alerts and case_hub for all set_timer/set_timer_interval calls, classify saga-related vs fire-and-forget
2. Define TimerEntry struct: { saga_step_id: u64, callback_tag: TimerCallbackKind, scheduled_at: u64, retry_count: u32, max_retries: u32 }
3. Implement Storable for TimerEntry using Candid serialization (AL-00004 pattern)
4. Add TIMER_REGISTRY StableBTreeMap to deadline_alerts, with pre_upgrade serialization and post_upgrade reconstruction
5. PocketIC test: deploy deadline_alerts, start 5 saga flows with timer-driven compensation, upgrade canister mid-execution
6. Assert all 5 compensation flows complete post-upgrade within 2x the original scheduled time

## Success Criteria

- 5/5 in-flight saga compensation flows complete after upgrade (100% survival rate)
- Timer reconstruction in post_upgrade completes within IC instruction limits (4B instructions)
- No duplicate compensation executions (idempotency keys prevent replay)
- TimerEntry round-trip serialization passes property tests (100 random inputs)

## Risks

- TimerCallbackKind enum must be exhaustive -- adding new timer types requires schema migration
- post_upgrade instruction budget may be tight if many timers need reconstruction simultaneously
- Timer IDs change on reconstruction (new ic_cdk_timers handle) -- saga state referencing old IDs must be updated
- Race condition: upgrade happens between timer fire and compensation completion -- timer should not re-register
