---
id: HY-00005
title: "Mandatory QueryAuth on all query endpoints eliminates cross-user data leakage"
status: complete
created: 2026-03-23
idea: ID-00019
tags: []
prediction: "Adding caller ownership filtering to all #[query] endpoints that return case-specific data will reduce cross-user data leakage to zero"
metric: "count of query endpoints that return unfiltered data"
success_criteria: "zero query endpoints return data without caller ownership check"
---

## Hypothesis

If we add AuthContext-based caller filtering to every #[query] endpoint that returns case-specific data, then no authenticated user can access another user's case data via the Candid API.

## Rationale

The security audit found 21 endpoints returning unfiltered data. 10 were fixed this session. The hypothesis is that systematic application of the pattern to ALL remaining endpoints (including future ones) eliminates the entire class of vulnerability.

## Testing Plan

1. Grep all #[query] endpoints across 9 canisters.
2. For each, verify _impl function takes caller/auth parameter.
3. Write integration test: create data as alice, query as bob, verify empty result.

## Success Criteria

Zero #[query] endpoints return case-specific data without caller ownership check. Integration test confirms cross-user isolation.

## Risks

Some queries are intentionally public (health_check, get_stats aggregates). Need to distinguish public vs private endpoints.
