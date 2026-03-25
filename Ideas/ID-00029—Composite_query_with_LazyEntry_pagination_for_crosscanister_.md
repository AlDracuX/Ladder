---
id: ID-00029
title: "Composite query with LazyEntry pagination for cross-canister reads"
status: draft
created: 2026-03-25
sources: [SR-00054, AL-00006]
phase: mate
domain: "canister-performance"
tags: [composite-query, lazy-entry, pagination, cross-canister, aggregation]
scores:
  feasibility: 65
  novelty: 55
  impact: 70
  elegance: 80
---

## Description

case_hub and mcp_gateway currently perform multi-canister reads by issuing sequential inter-canister query calls and deserializing every returned record into memory before filtering. This is wasteful when only a subset of records is needed. This idea combines IC composite queries (SR-00054) with the `LazyEntry` iterator pattern (AL-00006) to build efficient cross-canister data aggregation. The calling canister issues a composite query that fans out to multiple target canisters, each of which returns a cursor-paginated response using `LazyEntry` iterators internally. The caller receives only the page it needs, avoids redundant deserialization on the target side (LazyEntry defers deserialization until `.value()` is called), and can request subsequent pages via cursor tokens. The result is dramatically reduced cycle cost and latency for dashboard-style views that aggregate data from evidence_vault, case_timeline, and deadline_alerts.

## Provenance

Mating AL-00006 (LazyEntry iterator pattern for `StableBTreeMap` in ic-stable-structures 0.7.x) with SR-00054 (IC composite queries). AL-00006 solves the per-canister problem of efficiently iterating stable storage without eagerly deserializing all values. SR-00054 solves the cross-canister problem of performing reads that span multiple canisters in a single query call. The cross-pollination is that composite queries become far more practical when each participating canister can efficiently paginate its response using LazyEntry rather than serializing its entire dataset.

## Connection

Primary beneficiaries are case_hub (aggregates case data from evidence_vault, case_timeline, deadline_alerts, settlement) and mcp_gateway (proxies read requests to all backend canisters). Changes required: (1) add paginated query endpoints to each data canister that accept a cursor and page size, returning results via LazyEntry `.skip()` and `.take()`, (2) implement composite query methods in case_hub that fan out to multiple canisters and merge paginated results, (3) define a `PaginatedResponse<T>` type in `awen_types` with `items: Vec<T>`, `next_cursor: Option<Vec<u8>>`, and `has_more: bool`.

## Next Steps

1. Define `PaginatedResponse<T>` and `PaginationRequest` types in `awen_types` with Candid serialization.
2. Add a paginated `list_evidence_paginated` query endpoint to evidence_vault that uses LazyEntry iteration with `.skip(cursor).take(page_size)` and returns a cursor token.
3. Build a composite query in case_hub that calls `list_evidence_paginated` and `list_events_paginated` in parallel and merges results into a unified timeline view.
