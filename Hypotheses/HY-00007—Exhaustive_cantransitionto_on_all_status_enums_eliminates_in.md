---
id: HY-00007
title: "Exhaustive can_transition_to on all status enums eliminates invalid state transitions"
status: complete
created: 2026-03-23
idea: ID-00005
tags: []
prediction: "Adding validated can_transition_to() to all status enums prevents all invalid state transitions"
metric: "count of status enums with enforced transition validation"
success_criteria: "100% of status enums have can_transition_to() called before every mutation"
---

## Hypothesis

If every status enum in the codebase has a can_transition_to() method and every mutation site calls it before updating, then no API call can produce an invalid state transition.

## Rationale

ComplaintStatus had zero validation (P0). DeadlineStatus had ad-hoc checks. OfferStatus has can_transition_to but it's the exception. Systematic application of the pattern catches the class of bug.

## Testing Plan

1. Grep all `status:` fields in stored types.
2. For each status enum, verify can_transition_to() exists.
3. For each _impl function that mutates status, verify it calls can_transition_to().
4. Property test: random transition sequences rejected if invalid.

## Success Criteria

All status enums have transition validation. All mutation sites enforce it. Property tests cover random sequences.

## Risks

Some status transitions are implicitly valid through saga compensation. Need to ensure rollback paths aren't blocked.
