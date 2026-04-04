---
id: HY-00024
title: "Composite query pagination reduces cross-canister read cycle cost by over 50 percent versus full-scan"
status: draft
created: 2026-03-27
idea: ID-00029
tags: [composite-query, pagination, lazy-entry, performance, case-hub]
prediction: "Paginated composite queries use over 50% fewer cycles than full-scan for 20-item page from 1000+ records"
metric: "Cycle cost per cross-canister read (PocketIC instruction counter)"
success_criteria: "Paginated query uses < 50% of full-scan cycle cost when fetching 20 items from 1000+ record store"
---

## Hypothesis

If we add cursor-paginated query endpoints using `LazyEntry` iterators to evidence_vault and case_timeline, and use composite queries from case_hub to fetch 20-item pages, then the cycle cost per cross-canister read will decrease by over 50% compared to the current full-scan-and-filter approach when the store contains 1000+ records.

## Rationale

ID-00029 combines IC composite queries (SR-00054) with LazyEntry pagination (AL-00006). Currently case_hub deserializes every record from target canisters to filter client-side. LazyEntry defers deserialization until `.value()` is called, so skipping records via cursor is nearly free. Composite queries eliminate sequential inter-canister call overhead. The 50% threshold is conservative — with 1000 records and a 20-item page, we're avoiding ~98% of deserialization work.

## Testing Plan

1. **Setup**: Deploy evidence_vault + case_hub to PocketIC, populate with 1000 synthetic evidence records
2. **Baseline**: Call current `list_evidence` (full scan), measure instruction count via performance counter
3. **Change**: Add `list_evidence_paginated(cursor, page_size=20)` using LazyEntry skip/take. Add composite query to case_hub.
4. **After**: Call paginated endpoint for page 1 (20 items), measure instruction count
5. **Delta**: `(baseline - paginated) / baseline * 100` — expect > 50%

## Success Criteria

- Primary: Paginated query cycle cost < 50% of full-scan cost (1000+ records, 20-item page)
- Secondary: Pagination cursor correctly retrieves subsequent pages (all 1000 records reachable)
- Secondary: No existing tests break

## Risks

- Composite queries may not be available in PocketIC (check ic-cdk version support)
- LazyEntry `.skip()` may still iterate internally — need to verify it's actually O(log n) not O(n)
- Cursor token serialization adds overhead that could reduce the savings for small stores
