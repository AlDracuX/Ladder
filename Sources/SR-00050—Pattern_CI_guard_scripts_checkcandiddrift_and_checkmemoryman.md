---
id: SR-00050
title: "Pattern: CI guard scripts check-candid-drift and check-memory-managers prevent regression"
type: pattern
url: ""
status: active
created: 2026-03-24
tags: [ci, guard-scripts, regression-prevention, candid, memory-manager]
domain: "build-infrastructure"
relevance: "medium"
---

## Summary

Two CI guard scripts created in `scripts/`: `check-candid-drift.sh` regenerates `.did` files via `mise run candid` then diffs against committed versions, failing if any drift is detected. `check-memory-managers.sh` counts `awen_storage!` macro invocations per crate and fails if any crate has more than one (preventing the dual MemoryManager bug). Both scripts pass on the current codebase, run in under 5 seconds each, and are ready for integration into the `mise run ci` pipeline.

## Key Points

- `check-candid-drift.sh`: regenerates `.did` files, runs `git diff` against committed versions, fails on any difference
- `check-memory-managers.sh`: greps for `awen_storage!` per crate, fails if count > 1 in any single crate
- Both scripts are executable, located in `scripts/`, and complete in under 5 seconds
- Both pass cleanly on the current codebase (no false positives)
- Designed for `mise run ci` integration and GitHub Actions compatibility
- Catches two classes of regression that are silent at compile time but cause runtime failures

## Connection to Problems

Directly addresses SR-00038 (`.did` file regeneration drift, where Candid interfaces can silently diverge from Rust code) and SR-00035 (dual MemoryManager bug, where two `MemoryManager` instances in one canister cause silent data corruption). Both issues are invisible to `cargo check` and `cargo test` but cause production failures. These scripts provide automated regression prevention for problems that were previously caught only by manual review.

## Potential Ideas

- Add both scripts to `mise run ci` pipeline as mandatory gates before merge
- Add to GitHub Actions workflow as separate CI steps with clear failure messages
- Create a `check-all-guards.sh` umbrella script that runs all guard scripts in sequence
- Add a third guard script for checking that all `#[update]` endpoints validate `msg_caller() != anonymous()`
