---
id: HY-00030
title: "Adding in-flight request counter to mcp_gateway rejects 100 percent of burst requests exceeding concurrency limit"
status: draft
created: 2026-03-27
idea: ID-00006
tags: [rate-limiting, concurrency, mcp-gateway, burst-protection]
prediction: "A Cell<u64> in-flight counter in mcp_gateway rejects all requests beyond MAX_CONCURRENT, closing the burst bypass in the current window-only limiter"
metric: "Number of requests accepted when N simultaneous calls arrive in the same IC execution round"
success_criteria: "With MAX_CONCURRENT=10, sending 20 concurrent requests results in exactly 10 accepted and 10 rejected with McpGatewayError::RateLimited"
---

## Hypothesis

If we add a Cell<u64> in-flight request counter to mcp_gateway's check_rate_limit function (alongside the existing window-based counter at line 1120), then 100% of burst requests exceeding the concurrency limit are rejected, even when the window-based counter has capacity remaining. Currently, 100 requests arriving simultaneously within a fresh 60-second window all pass because the window counter increments sequentially within the same message execution.

## Rationale

The current rate limiter in mcp_gateway/src/lib.rs uses two window-based counters: per-principal (100/min at line 57) and global (1000/min at line 61). Neither tracks concurrent in-flight requests. On the IC, update calls within the same execution round are serialized per-canister, but the window check allows all requests within a fresh window to pass. An attacker who batches 100 calls at the start of each window gets full throughput. An in-flight counter (increment on entry, decrement on exit) with a lower ceiling (e.g., 10 concurrent) would cap simultaneous active requests regardless of window capacity.

## Testing Plan

1. Baseline: verify current limiter allows 100 sequential calls in a fresh window (all pass)
2. Add `thread_local! { static IN_FLIGHT: Cell<u64> = Cell::new(0); }` to mcp_gateway
3. Modify check_rate_limit to increment IN_FLIGHT on entry, decrement in a Drop guard
4. Add MAX_CONCURRENT const (propose 10) and reject when IN_FLIGHT >= MAX_CONCURRENT
5. Write PocketIC test: deploy mcp_gateway, send 20 concurrent update calls, assert exactly 10 accepted
6. Write regression test: 10 sequential calls all pass (no false rejections)
7. Run `mise run nextest -p mcp_gateway` to verify no regressions

## Success Criteria

- 20 concurrent calls with MAX_CONCURRENT=10: exactly 10 accepted, 10 rejected
- 10 sequential calls: all 10 accepted (no false positives)
- Existing mcp_gateway test suite passes with zero regressions
- In-flight counter correctly decrements even when handler returns Err

## Risks

- IC canister execution is single-threaded; "concurrent" means multiple messages queued, not truly parallel -- the counter may not decrement between sequential message executions
- The Drop guard for decrementing must handle all early-return paths including traps
- Need to verify Cell<u64> behavior across async call boundaries (Call::bounded_wait suspends execution)
