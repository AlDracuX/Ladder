---
id: SR-00053
title: "ic-cdk 0.19 spawn_weak and spawn_migratory async task types"
type: paper
url: "https://github.com/dfinity/cdk-rs/blob/main/ic-cdk/CHANGELOG.md"
status: draft
created: 2026-03-25
tags: [icp, async, ic-cdk, executor, spawn, tasks]
domain: "icp-canister-development"
relevance: "high — affects all async patterns including saga and inter-canister calls"
---

## Summary

ic-cdk 0.19.0 introduced async executor v2.0 with three task types replacing the single `spawn`. `spawn` now creates **protected tasks** that prevent canister upgrades while running (a trap cancels them). `spawn_weak` creates tasks that are silently dropped during upgrades — suitable for non-critical background work. `spawn_migratory` creates tasks that can survive canister upgrades by serializing their continuation. This is a breaking change from 0.18.x where all spawned tasks behaved uniformly.

## Key Points

- **`spawn` (protected)**: Task blocks canister upgrades; a trap during upgrade cancels these tasks. Use for critical async flows (saga steps, inter-canister calls that must complete)
- **`spawn_weak`**: Task is silently dropped on upgrade. Use for non-critical background work (cache warming, optional telemetry)
- **`spawn_migratory`**: Task survives upgrades by serializing its continuation. Use for long-running tasks that span upgrade boundaries
- Breaking change: async machinery moved to `ic_cdk::futures::internals`
- `spawn_017_compat` (added in 0.18.4) provides backward-compatible behavior for code migrating from 0.17.x
- This directly affects how saga patterns (AL-00002) behave across upgrades

## Connection to Problems

- **Saga pattern (AL-00002)**: Multi-step inter-canister calls currently use `spawn` — need to decide if these should be protected (block upgrades) or migratory (survive them)
- **Timer callbacks**: Timer-triggered work may spawn async tasks — these interact with SR-00051 (timer persistence)
- **mcp_gateway**: Request dispatch spawns async inter-canister calls; choosing weak vs protected affects upgrade safety
- **All canisters**: Any `#[update]` that does async work internally needs task type classification

## Potential Ideas

- Audit all `spawn` calls across 9 canisters and classify each as protected/weak/migratory
- Saga steps should use `spawn` (protected) to prevent upgrades mid-saga
- Optional telemetry and cache refresh should use `spawn_weak`
- Create a migration guide from ic-cdk 0.18.x to 0.19.x spawn semantics
