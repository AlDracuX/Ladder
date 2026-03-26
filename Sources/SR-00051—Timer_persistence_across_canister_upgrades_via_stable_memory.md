---
id: SR-00051
title: "Timer persistence across canister upgrades via stable memory serialization"
type: paper
url: "https://forum.dfinity.org/t/best-practice-for-canister-upgrade-with-task-created-by-ic-cdk-timers/52871"
status: draft
created: 2026-03-25
tags: [icp, timers, upgrades, stable-memory, ic-cdk-timers]
domain: "icp-canister-development"
relevance: "high — deadline_alerts and saga recovery timers lost on upgrade"
---

## Summary

During canister upgrades, all `ic-cdk-timers` are deactivated and cleared because a fresh WebAssembly state is created. DFINITY's recommended pattern (used in NNS canisters) is to maintain timer scheduling state separately in stable memory, then reschedule all timers in `post_upgrade`. The `ic-cdk-timers` library does not expose its internal thread-local storage, so developers must track timing details (interval, next-fire, callback identity) externally.

## Key Points

- `ic-cdk-timers` timers are **destroyed on every canister upgrade** — fresh WASM state clears all scheduled tasks
- The library's internal timer list is **not accessible** to developers for serialization
- DFINITY's own NNS canisters solve this by maintaining a parallel timer registry in stable memory
- In `pre_upgrade`: persist timer metadata (interval, next-fire timestamp, task identifier)
- In `post_upgrade`: read persisted metadata and call `set_timer`/`set_timer_interval` to reconstruct all timers
- This pattern is critical for any canister that relies on periodic tasks (cleanup, deadline checks, saga recovery)

## Connection to Problems

- **deadline_alerts**: Uses timers for deadline proximity notifications and ACAS extension checks. Upgrades silently kill these timers, potentially missing critical tribunal deadlines.
- **All canisters with saga recovery** (AL-00002): Post-upgrade timer scan for stuck sagas (SR-00033) depends on timers surviving upgrades — without persistence, recovery timers are lost.
- **mcp_gateway**: Rate limit window cleanup timers would be lost on upgrade, causing stale rate limit entries.

## Potential Ideas

- Create a `TimerRegistry` in `awen_types` that wraps `ic-cdk-timers` with a `StableBTreeMap`-backed persistence layer
- Auto-reschedule pattern: `post_upgrade` reads registry and reconstructs all timers without canister-specific code
- Combine with SR-00033 (stuck saga timer scan) so saga recovery timers also persist
