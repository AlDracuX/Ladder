---
id: SR-00054
title: "Composite queries for same-subnet multi-canister read optimization"
type: paper
url: "https://forum.dfinity.org/t/best-practices-for-optimizing-canister-performance/39455"
status: draft
created: 2026-03-25
tags: [icp, performance, queries, composite, multi-canister, optimization]
domain: "icp-canister-development"
relevance: "medium — case_hub and mcp_gateway do multi-canister reads"
---

## Summary

Composite queries allow a canister to make inter-canister query calls from within a `#[query(composite = true)]` method. Unlike update calls, composite queries execute entirely within the query subsystem — they're fast (no consensus needed), free (no cycles charged for query-to-query calls on the same subnet), and don't modify state. This is the recommended pattern for aggregating data from multiple canisters in read-only scenarios, replacing the common anti-pattern of using update calls just to fan out reads.

## Key Points

- Annotate with `#[query(composite = true)]` in Rust to enable query-to-query inter-canister calls
- Only works for canisters on the **same subnet** — cross-subnet composite queries are not supported
- No consensus round needed — responses are much faster than update-based fan-outs
- No cycles cost for the inter-canister query calls themselves
- Cannot modify state — purely read-only aggregation
- Replaces the anti-pattern of using `#[update]` methods just to read from multiple canisters
- Available since dfx 0.15+ with the `composite_query` feature

## Connection to Problems

- **case_hub**: `get_case_summary` aggregates data from evidence_vault, case_timeline, deadline_alerts. Currently would need update calls for cross-canister reads — composite queries would make this instant and free
- **mcp_gateway**: Status/health endpoints that check multiple backend canisters could use composite queries instead of cached snapshots
- **legal_analysis**: Pattern extraction that reads from procedural_intel and case_timeline could be a composite query

## Potential Ideas

- Convert case_hub's read-only aggregation endpoints to composite queries
- Add `#[query(composite = true)]` to any endpoint that fans out reads to other Awen canisters
- Benchmark composite query latency vs update-based fan-out for the case summary use case
- Note: requires all 9 canisters to be deployed on the same subnet
