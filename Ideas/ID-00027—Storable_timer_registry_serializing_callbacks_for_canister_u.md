---
id: ID-00027
title: "Storable timer registry serializing callbacks for canister upgrade survival"
status: draft
created: 2026-03-25
sources: [SR-00051, AL-00004]
phase: mate
domain: "canister-reliability"
tags: [storable, timer, stable-storage, serialization, upgrade-safety]
scores:
  feasibility: 75
  novelty: 45
  impact: 85
  elegance: 80
---

## Description

Create a `StorableTimerEntry` type that implements `Storable` using the project's canonical serialization pattern (AL-00004), enabling timer callback metadata to be persisted in a `StableBTreeMap` and survive canister upgrades. The registry maps each timer ID to a serialized record containing the callback discriminant (an enum tag, not a function pointer), the scheduled execution time, interval configuration, and any associated context (such as a case ID or deadline ID). On `post_upgrade`, the registry iterates all entries, re-registers them with `ic_cdk_timers`, and updates the stored timer IDs to match the new handles. This is the concrete data-layer implementation that ID-00026's saga-aware persistence would build on top of.

## Provenance

Mating AL-00004 (Storable implementation pattern with `to_bytes`/`into_bytes`/`from_bytes` and `Bound`) with SR-00051 (timer persistence across upgrades). AL-00004 solves the "how do I put arbitrary types into `StableBTreeMap`" problem. SR-00051 identifies the "timers die on upgrade" gap. The cross-pollination is mechanical but high-value: timers are just data (a time + a callback tag + context), and the Storable pattern is purpose-built for putting arbitrary data into stable storage. The novelty is low because the pattern is established, but the impact is high because no canister in the workspace currently does this.

## Connection

Every canister that uses `ic_cdk_timers` benefits, but the primary targets are deadline_alerts (ACAS deadline reminders, ERA 1996 notifications), case_hub (saga orchestration retries), and settlement (offer expiry timers). Changes required: (1) define a `TimerCallbackKind` enum with variants for each timer use case, (2) implement `StorableTimerEntry` with Candid serialization per AL-00004, (3) add a `TIMER_REGISTRY: StableBTreeMap<u64, StorableTimerEntry, Memory>` to each canister's `thread_local!` storage, (4) add `pre_upgrade` serialization and `post_upgrade` reconstruction hooks.

## Next Steps

1. Define the `TimerCallbackKind` enum in `awen_types` covering all current timer use cases across the 9 canisters (audit `set_timer` calls first).
2. Implement `StorableTimerEntry` with full `Storable` trait (Candid encode/decode, `Bound::Unbounded`) and unit tests verifying round-trip serialization.
3. Build a minimal proof-of-concept in deadline_alerts: persist one timer type, upgrade the canister in PocketIC, and assert the timer fires post-upgrade.
