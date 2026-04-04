---
id: SR-00068
title: "No-panic-after-await: explicit error handling instead of panics after async call points"
type: paper
url: "https://mmapped.blog/posts/01-effective-rust-canisters"
status: draft
created: 2026-03-27
tags: [async-safety, inter-canister, error-handling]
domain: "cross-canister"
relevance: "high"
---

## Summary

If a canister panics (traps) in a callback after an inter-canister `await`, the trap rolls back only the callback's state changes — but the state changes made *before* the await persist. This leaves the canister in an inconsistent state (e.g., tokens deducted but transfer not completed). The pattern mandates explicit `Result`-based error handling after every await point, never `unwrap()` or `expect()`.

## Key Points

- A trap after `await` does NOT roll back pre-await state changes — this is IC-specific semantics
- Resources allocated before the call (locks, counters, balances) may leak permanently
- The workspace lint `unwrap_used = "deny"` already prevents most cases, but `unwrap_or_default()` can silently produce incorrect values after failed calls
- Must validate return values from inter-canister calls and compensate on failure (saga pattern)
- Combine with AL-00002 (saga + idempotency) for complete async safety

## Connection to Problems

Awen canisters making inter-canister calls: `mcp_gateway` (dispatches to all), `case_hub` (aggregates from multiple canisters), `legal_analysis` (calls evidence_vault). Any of these could enter inconsistent state if a callback produces an unexpected value and the handler uses `unwrap_or_default()` instead of proper error propagation. SR-00024 (journaling pattern) is the complementary defense.

## Potential Ideas

- Audit all `.await` call sites across canisters for post-await error handling completeness
- Add clippy lint or custom check for `unwrap_or_default()` after inter-canister call results
- Create a `call_or_compensate!` macro that wraps the saga compensation pattern
