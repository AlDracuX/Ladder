---
id: SR-00039
title: "Workflow: PostToolUse hook runs cargo check after .rs edits preventing compilation drift"
type: pattern
url: ""
status: active
updated: 2026-03-23
created: 2026-03-23
tags: [cargo-check, hook, workflow, compilation, developer-experience]
domain: "build-infrastructure"
relevance: "medium"
---

## Summary

A Claude Code `PostToolUse` hook (configured in `.claude/settings.json`) automatically runs `cargo check` after any Edit or Write operation on `.rs` files. This catches compilation errors immediately after each code change rather than allowing them to accumulate across a multi-file editing session. The hook provides rapid feedback, preventing the common "edited 15 files, now nothing compiles" scenario that wastes debugging time.

## Key Points

- The hook triggers on Edit/Write tool calls that target `.rs` files, running `cargo check --workspace` in the background
- Compilation errors surface within seconds of the edit, allowing immediate correction
- This is particularly valuable for the Awen workspace where strict lints (`unwrap_used = "deny"`, `panic = "deny"`) make compilation failures common during refactoring
- The hook runs the check against the full workspace so cross-crate breakage is detected (e.g., changing a type in `awen_types` breaks downstream canisters)
- Combined with the GitNexus `detect_changes` hook on commits, this creates a two-layer safety net: compile-time and graph-time

## Connection to Problems

Addresses developer velocity concerns in a 9-canister workspace where a single type change can cascade across the dependency graph. Without immediate feedback, engineers (human or AI) accumulate errors that become exponentially harder to untangle. This is the "shift-left" principle applied to AI-assisted development.

## Potential Ideas

- Extend the hook to also run `cargo clippy` (not just `check`) for lint violations, since the workspace denies many common patterns
- Add a "compilation health" counter that tracks how many consecutive edits compile cleanly as a quality metric
