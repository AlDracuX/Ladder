---
id: SR-00034
title: "Pattern: controller-only rollback_case_* endpoints in all data canisters"
type: pattern
url: ""
status: draft
created: 2026-03-23
tags: [rollback, saga, controller, admin, data-integrity]
domain: "canister-reliability"
relevance: "high"
---

## Summary

All data-holding canisters (case_timeline, deadline_alerts, settlement, and others) expose `rollback_case_*` endpoints that are restricted to the canister controller. These endpoints accept a saga_id and case_id, then remove all records associated with a partially-completed saga. This provides a manual safety net for saga failures that automated recovery cannot handle, as confirmed by implementations in `deadline_alerts/src/lib.rs` and `case_timeline/src/lib.rs`.

## Key Points

- Rollback endpoints exist in at least case_timeline (`rollback_case_events`), deadline_alerts (`rollback_case_deadlines`), and settlement (`rollback_case_settlements`)
- Each endpoint is controller-only (not callable by regular users) to prevent unauthorized data deletion
- They accept saga_id + case_id to target specific partial operations, returning the count of removed records
- Unit tests verify both successful rollback and edge cases (empty case, cases with hearings/agreed facts)
- The `_impl` pattern is followed: `rollback_case_events_impl` contains testable logic separated from IC glue

## Connection to Problems

This pattern completes the saga reliability story alongside SR-00033 (post-upgrade scan). While SR-00033 handles automated recovery, these endpoints handle cases where manual intervention is needed -- for example, when a saga left data in an inconsistent state that automated heuristics cannot safely resolve. Together they form a two-layer recovery strategy.

## Potential Ideas

- Extend rollback endpoints to all 9 canisters (evidence_vault, legal_analysis, procedural_intel, case_hub, mcp_gateway currently may lack them)
- Add a `case_hub` orchestrator endpoint that calls rollback across all child canisters in a single admin action
