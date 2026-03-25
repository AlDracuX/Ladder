---
id: ID-00032
title: "Snapshot-based _impl integration testing against real stable memory state"
status: draft
created: 2026-03-25
sources: [SR-00043, AL-00001]
phase: mate
domain: "testing"
tags: [snapshot, impl-pattern, integration-test, stable-memory, ic-cdk-019]
scores:
  feasibility: 55
  novelty: 70
  impact: 75
  elegance: 80
---

## Description

The `_impl` pattern (AL-00001) separates business logic from IC glue, making functions unit-testable. However, unit tests use synthetic data that may not reflect the actual shape, volume, or edge cases of real stable memory contents. ic-cdk 0.19's snapshot APIs (SR-00043) allow capturing the complete stable memory state of a running canister as a binary blob. This idea combines the two: capture a snapshot of a canister's real stable memory from a local replica (or PocketIC), deserialize it into the same `StableBTreeMap` types used by the canister, and then run `_impl` functions against that real data in a native test binary. The result is integration tests with the convenience of unit tests -- no IC runtime needed -- but with production-realistic data. This catches bugs that only manifest with real data distributions, such as serialization edge cases, quota violations in existing data, or unexpected key orderings.

## Provenance

Mating AL-00001 (`_impl` pattern for testable business logic separation) with SR-00043 (canister snapshot APIs in ic-cdk 0.19). AL-00001 makes functions testable outside the IC runtime but leaves a gap: the test data is synthetic. SR-00043 provides access to real canister state as a binary snapshot. The cross-pollination insight is that snapshots provide the realistic test data that `_impl` functions need, without requiring the test to run inside PocketIC. The snapshot becomes a test fixture -- a frozen-in-time representation of real state that can be loaded into native Rust tests.

## Connection

Benefits all 9 canisters since all use the `_impl` pattern and `StableBTreeMap` storage. Most impactful for evidence_vault (complex document structures, chain-of-custody invariants), case_timeline (chronological ordering invariants), and legal_analysis (pattern extraction from real legal documents). Changes required: (1) build a snapshot capture utility that uses PocketIC or the management canister to extract stable memory, (2) write deserialization helpers that load `StableBTreeMap` contents from a snapshot into in-memory `BTreeMap` for test use, (3) create a test harness macro that loads a snapshot fixture and exposes it to `_impl` functions.

## Next Steps

1. Investigate the ic-cdk 0.19 snapshot API surface: determine if `canister_snapshot` is available in PocketIC or only on mainnet, and what format the snapshot binary uses.
2. Build a minimal proof-of-concept: capture evidence_vault's stable memory from a PocketIC deployment, load it in a `#[cfg(test)]` module, and run `store_evidence_impl` against the real data.
3. Design a snapshot fixture management strategy -- how to version, store, and update snapshot files without bloating the repository (git LFS, or generated on-demand in CI).
