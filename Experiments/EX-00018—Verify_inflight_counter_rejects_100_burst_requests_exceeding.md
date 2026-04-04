---
id: EX-00018
title: "Verify in-flight counter rejects 100% burst requests exceeding concurrency limit in mcp_gateway"
status: draft
created: 2026-03-27
hypothesis: HY-00030
algorithm: ""
tags: [rate-limiting, concurrency, mcp-gateway, burst-protection, pocketic]
methodology: "Add Cell<u64> in-flight counter to mcp_gateway, deploy to PocketIC, fire 20 concurrent calls with MAX_CONCURRENT=10, verify exactly 10 accepted and 10 rejected"
duration: "4 hours"
success_criteria: "20 concurrent calls: exactly 10 accepted + 10 rejected; 10 sequential calls: all pass; existing test suite: zero regressions; counter decrements on Err paths"
---

## Objective

Validate that adding a `Cell<u64>` in-flight request counter to mcp_gateway's `check_rate_limit` function (alongside the existing window-based counter) rejects 100% of burst requests exceeding the concurrency limit, even when the window-based counter has remaining capacity. This targets the gap where 100 requests arriving simultaneously in a fresh 60-second window all pass because the window counter increments sequentially within the same message execution.

## Methodology

1. **Baseline: verify current burst behavior**
   ```bash
   cd /mnt/media_backup/PROJECTS/awen-network-canisters
   mise run build
   # Write PocketIC integration test in tests/integration/mcp_gateway_burst_test.rs:
   #   a. Deploy mcp_gateway canister
   #   b. Create 20 distinct test principals
   #   c. Fire 20 update calls (list_tools) in rapid succession within same execution round
   #   d. Record how many succeed vs receive McpGatewayError::RateLimited
   cargo nextest run -p tests -E 'test(/burst_baseline/)' --no-capture 2>&1
   ```

2. **Record baseline counts** -- expected: all 20 pass (window has capacity for 100/min)

3. **Implement in-flight counter** (describe changes only)
   - File: `src/mcp_gateway/src/lib.rs`
   - Add `thread_local! { static IN_FLIGHT: Cell<u64> = Cell::new(0); }`
   - Add `const MAX_CONCURRENT: u64 = 10;`
   - Modify `check_rate_limit` to: increment IN_FLIGHT, check >= MAX_CONCURRENT, reject with RateLimited if exceeded
   - Add `InFlightGuard` struct with Drop impl that decrements IN_FLIGHT
   - Return guard from check_rate_limit so it lives for the duration of the handler

4. **After: re-run the burst test**
   ```bash
   mise run build
   cargo nextest run -p tests -E 'test(/burst_inflight/)' --no-capture 2>&1
   # Expected: exactly 10 accepted, 10 rejected with McpGatewayError::RateLimited
   ```

5. **Sequential control test** -- verify no false rejections
   ```bash
   # Fire 10 calls sequentially from 1 principal, each completing before the next starts
   cargo nextest run -p tests -E 'test(/burst_sequential/)' --no-capture 2>&1
   # Expected: all 10 pass
   ```

6. **Error path test** -- verify counter decrements on Err
   ```bash
   # Send a request that triggers a handler error (e.g., invalid tool name)
   # Verify IN_FLIGHT returns to 0 after the error response
   cargo nextest run -p tests -E 'test(/burst_error_decrement/)' --no-capture 2>&1
   ```

7. **Regression check**
   ```bash
   cargo nextest run -p mcp_gateway
   # Expected: all existing tests pass
   ```

## Setup

- Working directory: `/mnt/media_backup/PROJECTS/awen-network-canisters`
- Branch: `experiment/ex-00018-inflight-counter` (git worktree)
- Prerequisite: `mise run build` to produce mcp_gateway WASM
- PocketIC integration test in `tests/integration/`
- Key source files:
  - `src/mcp_gateway/src/lib.rs` -- rate limiter at `check_rate_limit` function, constants at lines 53-58
  - `src/mcp_gateway/src/types.rs` -- add `InFlightGuard` type
- Current rate limit config: `RATE_LIMIT_MAX_REQUESTS=100` per 60s window, global limit at `GLOBAL_RATE_LIMIT_MEM_ID`

## Algorithm

No specific AL- entry. Uses the standard concurrent PocketIC testing pattern: multiple principals sending update calls in rapid succession. Note IC canisters process messages sequentially per canister, so "concurrent" means multiple messages queued in the ingress -- PocketIC processes them one at a time but the in-flight counter should NOT decrement between queued messages because the guard's Drop only fires when the outer handler returns.

## Success Criteria

- [ ] Baseline recorded: 20 concurrent calls in fresh window, count how many pass (expect all 20)
- [ ] After change: 20 concurrent calls with MAX_CONCURRENT=10 results in exactly 10 accepted + 10 rejected
- [ ] Sequential test: 10 sequential calls from 1 principal all pass (no false rejections)
- [ ] Error path: IN_FLIGHT counter decrements to 0 after handler returns Err
- [ ] Regression: all existing mcp_gateway unit tests pass (`cargo nextest run -p mcp_gateway`)
- [ ] Regression: all existing mcp_gateway integration tests pass

## Data Collection

| Metric | Baseline (current) | After (in-flight counter) |
|--------|-------------------|--------------------------|
| Accepted calls (20 concurrent, MAX_CONCURRENT=10) | TBD (expect 20) | 10 |
| Rejected calls (20 concurrent, MAX_CONCURRENT=10) | TBD (expect 0) | 10 |
| Sequential 10 calls pass rate | TBD | 100% |
| Existing unit test pass count | TBD | Same |
| IN_FLIGHT max observed during burst | N/A | TBD |
| Counter value after error path | N/A | 0 |

## Risks & Mitigations

- **IC sequential execution model**: IC canisters process messages one at a time. The in-flight counter only works if the guard persists across async suspension points (Call::bounded_wait). If the handler awaits an inter-canister call, the counter stays incremented, blocking other messages. Mitigation: verify this is the desired behavior (it prevents concurrent cross-canister call amplification) and document the async semantics.
- **Cell<u64> across async boundaries**: Cell is !Send, but IC canisters are single-threaded. The value persists across await points within the same message execution. Mitigation: confirm with a test that fires a request involving an inter-canister call and verifies the counter stays incremented during the await.
- **Drop guard ordering**: If check_rate_limit returns Err before creating the guard, no decrement is needed. If it returns Ok(guard), the guard must live until the end of the handler scope. Mitigation: return the guard as part of the Ok variant and bind it in the caller.
- **PocketIC timing**: PocketIC processes messages in controlled ticks, not real time. Mitigation: use `pic.advance_time()` to control window boundaries explicitly.

## Results

(Fill in after running)

## Analysis

(Fill in after running)

## Next Steps

If burst protection works: create RE- result entry, consider making MAX_CONCURRENT configurable via admin endpoint. If IC sequential processing already prevents burst bypass: document the finding as RE- entry and close HY-00030 as "already solved by IC execution model." Either outcome is valuable.
