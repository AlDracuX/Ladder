---
id: SR-00048
title: "Pattern: can_transition_to on 6 status enums prevents invalid state transitions in 7 canisters"
type: pattern
url: ""
status: active
created: 2026-03-24
tags: [state-machine, transition-validation, status-enum, safety]
domain: "architecture"
relevance: "high"
---

## Summary

Added `can_transition_to()` validation methods to 6 status enums across 7 canisters: `evidence_vault`, `settlement`, `mcp_gateway`, `reference_shield`, `deadline_alerts`, and `procedural_intel`. Total 213 lines of code. Each enum now explicitly declares which transitions are legal, and transition attempts are validated before state mutation. This prevents invalid state transitions (e.g., moving evidence from `Archived` back to `Draft`) at the type level rather than relying on ad-hoc checks scattered through business logic.

## Key Points

- 6 status enums covered with `can_transition_to()` methods across 7 canisters
- 213 lines of code added (transition tables + validation logic)
- Compile-time safe: transition rules are exhaustive match arms, so adding a new variant forces updating the rules
- Each method returns `bool`, called before `set_status` to gate mutations
- Canisters covered: evidence_vault, settlement, mcp_gateway, reference_shield, deadline_alerts, procedural_intel
- All canisters compile clean with the new validation in place

## Connection to Problems

Directly addresses SR-00003 (missing `InvalidState` error variant) and ID-00005 (state machine completeness). Invalid state transitions were previously possible because status fields were plain enums with no enforcement of legal transitions. In a legal platform, an evidence item moving backward from `Sealed` to `Draft` would undermine chain-of-custody guarantees. The pattern also helps with audit trails by ensuring only documented transitions occur.

## Potential Ideas

- Add `can_transition_to` to remaining status enums in `case_hub` and `case_timeline` canisters
- Generate transition diagrams from the match arms for documentation
- Create a `Transition<From, To>` proof type that can only be constructed via `can_transition_to`, making illegal transitions unrepresentable
- Add property tests that fuzz random transition sequences and verify no illegal state is reachable
