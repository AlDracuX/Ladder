---
id: SR-00071
title: "Dual-mode upgrade testing: run test suite in both normal and self-upgrade modes"
type: paper
url: "https://mmapped.blog/posts/01-effective-rust-canisters"
status: draft
created: 2026-03-27
tags: [testing, upgrades, PocketIC, integration]
domain: "all-canisters"
relevance: "high"
---

## Summary

Run the entire integration test suite in two modes: (1) normal mode — install canister, run tests; (2) upgrade mode — install canister, perform `upgrade_canister` before each test assertion, then verify state survived. This catches upgrade-related data loss that normal tests miss. Recommended in "Effective Rust Canisters" and used by Internet Identity and ckBTC canisters.

## Key Points

- Normal mode tests verify business logic correctness
- Upgrade mode tests verify state persistence across canister upgrades
- Implementation: parametrize PocketIC test harness with a `should_upgrade: bool` flag
- Before each assertion in upgrade mode, call `upgrade_canister(wasm)` then verify state
- Catches: missing Storable implementations, fields not in stable memory, pre_upgrade traps
- Also catches regressions where a code change accidentally moves data from stable to heap storage
- Complementary to SR-00043 (snapshot-based upgrade testing) but simpler to implement

## Connection to Problems

SR-00004 identified that "stable structure upgrade path not tested across canister versions." The current PocketIC integration tests in `tests/integration/` only test normal operation — no test verifies that data survives a canister upgrade. This is a critical gap for a legal platform where evidence immutability and case timeline integrity must survive deployments.

## Potential Ideas

- Add `UpgradeMode` enum to PocketIC test harness with Normal and Upgrade variants
- Create a `with_upgrade_check!` macro that wraps assertions with a self-upgrade step
- Extend `mise run test-integration` to run both modes sequentially
- Prioritize evidence_vault and case_timeline for upgrade mode testing (highest data integrity requirements)
