---
id: SR-00035
title: "Bug: dual MemoryManager in same canister causes overlapping virtual memory"
type: observation
url: ""
status: active
updated: 2026-03-23
created: 2026-03-23
tags: [stable-storage, memory-manager, bug, data-corruption, ic-stable-structures]
domain: "canister-storage"
relevance: "high"
---

## Summary

The `legal_analysis` canister previously had two separate `MemoryManager::init(DefaultMemoryImpl::default())` calls -- one in `lib.rs` and another in `domain/storage.rs`. Both managers assigned MemoryIds starting from 0, causing overlapping virtual memory regions. This was a silent data corruption risk where writes from one manager could overwrite data managed by the other. The fix consolidated all stable storage into the single `lib.rs` MemoryManager, and `domain/storage.rs` was reduced to an explanatory comment.

## Key Points

- `ic-stable-structures` MemoryManager maps MemoryIds to virtual memory segments within a single stable memory
- Two MemoryManagers on the same `DefaultMemoryImpl` both claim MemoryId 0, 1, etc., leading to overlapping writes
- The bug was in `legal_analysis` specifically, but the pattern could recur in any canister with modular storage code
- Fix: consolidate all `StableBTreeMap` declarations under one `MemoryManager` per canister, typically in `lib.rs`
- The `awen_storage!` macro approach helps prevent this by centralizing all memory allocation

## Connection to Problems

This is a critical correctness bug. For a legal technology platform handling evidence and case data, silent data corruption is the worst-case scenario. The fix was already applied to `legal_analysis`, but this source documents the pattern so it can be checked across all 9 canisters. Any future refactoring that splits storage into submodules must be aware of this constraint.

## Potential Ideas

- Add a compile-time or CI lint that detects multiple `MemoryManager::init` calls within the same crate
- Create a Kani proof harness that verifies no two StableBTreeMaps share overlapping memory regions
