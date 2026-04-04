---
id: EX-00015
title: "Benchmark atomic global rate limiter vs per-method limiter under concurrent load"
status: draft
created: 2026-03-27
hypothesis: HY-00004
algorithm: ""
tags: [rate-limiting, concurrency, mcp-gateway, security, atomic-counter]
methodology: "Deploy mcp_gateway to PocketIC, fire 20 concurrent calls with limit=10/min, verify exactly 10 accepted and 10 rejected"
duration: "4 hours"
success_criteria: "With limit=10/min, 20 concurrent calls result in exactly 10 accepted + 10 rejected; sequential 10 calls all pass"
---

## Objective

Test whether replacing the per-method rate limiter in mcp_gateway with an atomic global counter prevents concurrent inter-canister calls from bypassing the rate limit. The current implementation uses per-caller sliding window (`RATE_LIMITS` StableBTreeMap) plus a global rate limit (`GLOBAL_RATE_LIMIT` StableCell). The hypothesis predicts that concurrent calls from different callers to different methods can exceed the intended global throughput under the current design.

## Methodology

1. **Baseline: measure current bypass potential**
   ```bash
   cd /mnt/media_backup/PROJECTS/awen-network-canisters
   mise run build
   # Deploy mcp_gateway to PocketIC
   # In tests/integration/, create a test that:
   #   a. Sets global rate limit to 10/min via GLOBAL_RATE_LIMIT config
   #   b. Creates 20 distinct test principals
   #   c. Fires 20 concurrent update calls (list_tools) from all 20 principals simultaneously
   #   d. Records how many succeed vs get RateLimited error
   ```

2. **Record baseline counts**
   ```bash
   cargo nextest run -p tests -E 'test(/rate_limit_concurrent_bypass/)' --no-capture 2>&1
   # Expected: some calls may bypass if per-caller checks pass before global counter increments
   ```

3. **Implement atomic global counter** (describe changes, do not execute)
   - File: `src/mcp_gateway/src/lib.rs`, function `check_rate_limit`
   - Replace the two-phase check (per-caller then global) with a single atomic global counter
   - Use `thread_local! { static IN_FLIGHT: Cell<u64> }` for in-flight tracking
   - Modify `check_global_rate_limit_impl` to increment counter before any processing and decrement in a drop guard
   - File: `src/mcp_gateway/src/types.rs` -- add `InFlightGuard` struct with `Drop` impl

4. **After: re-run the concurrent test**
   ```bash
   cargo nextest run -p tests -E 'test(/rate_limit_concurrent_bypass/)' --no-capture 2>&1
   # Expected: exactly 10 accepted, 10 rejected
   ```

5. **Sequential control test**
   ```bash
   # Fire 10 calls sequentially from 1 principal within 1 minute window
   # Expected: all 10 pass (within limit)
   cargo nextest run -p tests -E 'test(/rate_limit_sequential_within_limit/)' --no-capture 2>&1
   ```

6. **Regression check**
   ```bash
   cargo nextest run -p mcp_gateway
   # Expected: all existing tests pass
   ```

## Setup

- Working directory: `/mnt/media_backup/PROJECTS/awen-network-canisters`
- Branch: `experiment/ex-00015-atomic-rate-limiter` (git worktree)
- Prerequisite: `mise run build` to produce mcp_gateway WASM
- PocketIC integration test in `src/tests/integration/`
- Key source files:
  - `src/mcp_gateway/src/lib.rs` lines 1120-1230 (rate limiter logic)
  - `src/mcp_gateway/src/types.rs` lines 12-140 (RateLimitKey, RateLimitEntry, GlobalRateLimitEntry)

## Algorithm

No specific AL- entry. Uses standard concurrent testing pattern: multiple principals firing simultaneously via PocketIC's message execution model. Note that IC canisters process messages sequentially (no real threads), so "concurrent" means multiple messages in the ingress queue -- PocketIC processes them one at a time but the sliding window state persists between them.

## Success Criteria

- [ ] Concurrent test: 20 calls with limit=10/min results in exactly 10 accepted + 10 rejected
- [ ] Sequential test: 10 calls from 1 principal within 1 minute all pass
- [ ] No regression: all existing mcp_gateway unit tests pass (`cargo nextest run -p mcp_gateway`)
- [ ] No regression: all existing mcp_gateway integration tests pass
- [ ] Global counter properly resets after the sliding window expires

## Data Collection

| Metric | Baseline (current) | After (atomic) |
|--------|-------------------|----------------|
| Accepted calls (20 concurrent, limit=10) | TBD | 10 |
| Rejected calls (20 concurrent, limit=10) | TBD | 10 |
| Sequential 10-in-1-min pass rate | TBD | 100% |
| Existing test pass count | TBD | Same |
| Global counter max observed value | N/A | TBD |

## Risks & Mitigations

- **IC sequential execution**: IC canisters have no real concurrency -- messages are processed sequentially. This means the "bypass" may be purely theoretical on IC. Mitigation: verify by checking if the current global rate limit already blocks correctly, then document whether this experiment reveals an actual vs theoretical vulnerability.
- **thread_local Cell in async context**: If `check_rate_limit` is called within an async update function, the Cell value persists across await points within the same message but resets between messages. Mitigation: use the drop guard pattern to ensure decrement happens even on early return.
- **PocketIC timing**: PocketIC may not accurately model IC time progression for sliding windows. Mitigation: manually advance IC time between test phases using `pic.advance_time()`.

## Results

(Fill in after running)

## Analysis

(Fill in after running)

## Next Steps

If current limiter already blocks correctly (IC sequential processing prevents bypass): close HY-00004 as "already solved" and create a result documenting the finding. If bypass is real: merge the atomic counter fix and create RE- entry.
