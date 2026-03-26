---
id: ID-00043
title: "Unified canister health dashboard via composite queries aggregating all 9 status endpoints"
status: draft
created: 2026-03-26
sources: [SR-00054, SR-00050]
phase: dream
domain: "operations"
tags: [composite-queries, health-dashboard, monitoring, operations, cross-canister]
scores:
  feasibility: 7
  novelty: 6
  impact: 8
  elegance: 9
---

## Description

Build a unified health dashboard that uses ICP composite queries to fan out read requests to all 9 canisters in a single query call, aggregating quota usage, saga state, memory pressure, and rate limiter stats. This replaces the current approach of separate health checks per canister with a single zero-cost read operation. Composite queries (available since ICP replica version 0.9.0) allow a query to call other queries without going through consensus, making the fan-out effectively free. The aggregated response provides a single-glance operational view of the entire Awen Network deployment.

## Provenance

Derived from two sources: SR-00054 (ICP composite queries as an architectural primitive) and SR-00050 (CI guard scripts for canister health validation). The current operational model requires polling each canister individually, which is both slow and wasteful of cycles. Composite queries solve this elegantly by allowing a single entry-point canister to gather health data from all peers in one round-trip. The CI guard scripts identified in SR-00050 provide the existing health check logic that would be consolidated into the composite query handler.

## Connection

Touches all 9 canisters, which must each expose a `health_status` query endpoint returning a standardised `CanisterHealth` struct. The natural home for the composite query aggregator is `case_hub` (already the cross-canister coordination point) or a dedicated lightweight dashboard canister. Connects to the `admin-dashboard` frontend which would consume the aggregated health data. The high elegance score (9) reflects that composite queries are the perfect ICP primitive for this problem -- zero consensus overhead, single call, full coverage.

## Next Steps

1. Define a `CanisterHealth` struct in `awen_types` covering quota usage, memory stats, saga state counts, and rate limiter status
2. Add `#[query(composite = true)]` health endpoint to each canister returning `CanisterHealth`
3. Implement the aggregator composite query in `case_hub` that fans out to all 9 canisters
4. Build the dashboard view in `admin-dashboard` consuming the aggregated response
5. Add CI integration replacing per-canister health checks with the single composite call
