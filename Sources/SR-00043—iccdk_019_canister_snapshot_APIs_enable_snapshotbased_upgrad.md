---
id: SR-00043
title: "ic-cdk 0.19 canister snapshot APIs enable snapshot-based upgrade testing"
type: paper
url: "https://github.com/dfinity/cdk-rs/blob/main/ic-cdk/CHANGELOG.md"
status: active
updated: 2026-03-23
created: 2026-03-24
tags: [ic-cdk, snapshot, upgrade, testing, stable-memory]
domain: "canister-lifecycle"
relevance: "high"
---

## Summary

ic-cdk 0.19.0 (Nov 2025) added management canister bindings for canister snapshot operations: `read_canister_snapshot_metadata`, `read_canister_snapshot_data`, `upload_canister_snapshot_metadata`, and `upload_canister_snapshot_data`. These enable programmatic snapshot/restore of canister state, which can be used to build upgrade test harnesses that snapshot pre-upgrade state, perform the upgrade, verify post-upgrade state, and rollback if needed.

## Key Points

- Four new snapshot APIs: read metadata, read data, upload metadata, upload data
- Snapshots capture the full stable memory state of a canister
- Can be used to build automated upgrade rollback: snapshot before upgrade, restore on failure
- Complements PocketIC integration testing with real-state snapshot testing
- Available in ic-cdk 0.19.0+ (we currently use 0.19+)

## Connection to Problems

Directly connects to SR-00004 (stable structure upgrade path not tested) and ID-00004 (stable storage upgrade test harness). These snapshot APIs provide the missing infrastructure for building the upgrade test harness that ID-00004 proposes — instead of simulating serialization round-trips, we can snapshot real canister state and verify it survives actual upgrades.

## Potential Ideas

- Build a `mise run upgrade-test` task that snapshots each canister, deploys a new WASM, and verifies all data survived
- Use snapshots in CI to test schema migration before deploying to production
- Combine with SR-00033 (post-upgrade saga scan) to verify saga recovery after snapshot-restore cycles
