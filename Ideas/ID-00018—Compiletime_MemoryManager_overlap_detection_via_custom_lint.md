---
id: ID-00018
title: "Compile-time MemoryManager overlap detection via custom lint"
status: draft
created: 2026-03-23
sources: [SR-00035, SR-00036]
phase: dream
domain: "canister-storage"
tags: [memory-manager, lint, compile-time, stable-structures, safety]
scores:
  feasibility: 50
  novelty: 75
  impact: 80
  elegance: 85
---

## Description

Create a custom clippy lint (or a simpler `cargo check`-time build script) that detects multiple `MemoryManager::init()` calls within the same crate. The `legal_analysis` canister had a bug where two MemoryManagers overlapped virtual memory regions (SR-00035), causing silent data corruption. A compile-time check would make this class of bug structurally impossible.

The elegant approach: a `#[deny(dual_memory_manager)]` attribute-like check, or more practically, a build script in each canister that parses the AST for `MemoryManager::init` invocations and fails if more than one is found. This extends the project's philosophy of "make illegal states unrepresentable" from the type system to the storage layer.

## Provenance

DREAM phase: SR-00035 (dual MemoryManager bug in legal_analysis) is the triggering observation. SR-00036 (f64 migration pattern) reinforces the theme of making data integrity guarantees structural rather than procedural. The leap: instead of documenting "don't do this," make the compiler enforce it.

## Connection

Extends the project's strict lint configuration (`unsafe_code = "forbid"`, `unwrap_used = "deny"`) to cover a storage-specific correctness invariant. Related to ID-00004 (stable storage upgrade testing) but orthogonal -- that tests data migration, this prevents memory layout corruption.

## Next Steps

Hypothesis: A build script using `syn` to count `MemoryManager::init` invocations per crate detects the dual-manager bug at compile time with zero false positives across all 9 canisters. Experiment: add the build script, verify it passes on current code, then inject the bug in a test crate to confirm detection.
