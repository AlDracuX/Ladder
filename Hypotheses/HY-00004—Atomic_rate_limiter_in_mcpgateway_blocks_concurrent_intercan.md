---
id: HY-00004
title: "Atomic rate limiter in mcp_gateway blocks concurrent inter-canister bypass"
status: draft
created: 2026-03-22
idea: ID-00001
tags: []
prediction: "Atomic counter rate limiter blocks 100% of concurrent inter-canister bypass attempts"
metric: "Requests passing rate limit when N concurrent calls arrive simultaneously"
success_criteria: "With limit=10/min, 20 concurrent calls result in exactly 10 accepted + 10 rejected"
---

## Hypothesis

If we replace the current per-method rate limiter in mcp_gateway with an atomic counter that tracks in-flight requests across all methods, then concurrent inter-canister calls cannot bypass the rate limit.

## Rationale

Current rate limiter is per-method. Concurrent calls from different canisters to different methods can each pass their individual limit, exceeding the intended global throughput. An atomic counter shared across methods prevents this.

## Testing Plan

1. Read current rate limiter in mcp_gateway/src/lib.rs
2. Replace with atomic in-flight counter + sliding window
3. Write concurrent test: spawn 20 simultaneous calls, verify only 10 pass
4. Run nextest on mcp_gateway

## Success Criteria

- Concurrent test: 20 calls, exactly 10 accepted, 10 rate-limited
- Sequential test: 10 calls in 1 minute all pass
- No regression in existing mcp_gateway tests

## Risks

- Atomic counter in IC canister requires thread_local Cell (no real threads)
- May need to handle the counter across async call boundaries
