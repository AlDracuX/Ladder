---
id: EX-00036
title: "Deploy CallerGuard proxy canister and measure re-entrancy rejection rate plus cycle overhead"
status: draft
created: 2026-03-27
hypothesis: HY-00028
algorithm: AL-00003
tags: [caller-guard, proxy, security, re-entrancy, mcp-gateway, cycles, pocketic]
methodology: "Deploy mcp_gateway + call_proxy + mock_external canister trio to PocketIC; measure direct vs proxied cycle cost; test unauthorized principal rejection across 5 principals; simulate re-entrant callback from mock_external into call_proxy"
duration: "5 hours"
success_criteria: "100% unauthorized rejection; 100% re-entrant callback rejection; cycle overhead < 20% per proxied call; proxy WASM < 500KB"
---

## Objective

Validate that a CallerGuard proxy canister between mcp_gateway and external inter-canister calls rejects 100% of unauthorized and re-entrant call attempts with less than 20% cycle overhead per proxied call. This provides a blast radius boundary for external calls -- if a malicious callback re-enters, it is contained to the proxy.

## Methodology

1. **Create the call_proxy canister scaffold** (design only -- no modification to src/)
   ```bash
   cd /mnt/media_backup/PROJECTS/awen-network-canisters
   git worktree add /tmp/ex-00036 -b experiment/ex-00036-caller-guard-proxy
   cd /tmp/ex-00036
   # Create new canister: src/call_proxy/
   # Minimal canister with:
   #   - StableBTreeMap<Principal, bool> for allowed callers
   #   - CallerGuard pattern: thread_local RefCell<Option<Principal>> tracking in-flight caller
   #   - proxy_call(target: Principal, method: String, args: Vec<u8>) -> Result<Vec<u8>, ProxyError>
   #   - set_allowed_caller(principal: Principal) -- admin-only init method
   ```

2. **Create mock_external canister for testing**
   ```bash
   # src/mock_external/ -- test-only canister with:
   #   - echo(data: Vec<u8>) -> Vec<u8>  -- simple echo for baseline
   #   - callback_attack(proxy_id: Principal) -- calls back into call_proxy to test re-entrancy
   ```

3. **Record baseline: direct call cycle cost**
   ```bash
   # PocketIC integration test:
   # 1. Deploy mcp_gateway + mock_external
   # 2. Direct call from mcp_gateway to mock_external.echo(100 bytes)
   # 3. Record cycle balance before and after
   # 4. Repeat 50 times, compute median cycle cost
   cargo nextest run -p tests -E 'test(/baseline_direct_call_cost/)'
   ```

4. **Record proxied call cycle cost**
   ```bash
   # PocketIC integration test:
   # 1. Deploy mcp_gateway + call_proxy + mock_external
   # 2. Set mcp_gateway as allowed caller in call_proxy
   # 3. mcp_gateway calls call_proxy.proxy_call(mock_external, "echo", 100 bytes)
   # 4. Record cycle balance before and after
   # 5. Repeat 50 times, compute median cycle cost
   # 6. Calculate overhead: (proxied_median - direct_median) / direct_median * 100
   cargo nextest run -p tests -E 'test(/proxied_call_cost/)'
   ```

5. **Test unauthorized principal rejection (5 principals)**
   ```bash
   # PocketIC integration test:
   # 1. Generate 5 random principals (not mcp_gateway)
   # 2. Each calls call_proxy.proxy_call(mock_external, "echo", data)
   # 3. Assert all 5 return Err(ProxyError::Unauthorized)
   # 4. Assert mock_external.echo was never invoked (call count = 0)
   cargo nextest run -p tests -E 'test(/unauthorized_rejection/)'
   ```

6. **Test re-entrant callback rejection**
   ```bash
   # PocketIC integration test:
   # 1. mcp_gateway calls call_proxy.proxy_call(mock_external, "callback_attack", proxy_id)
   # 2. mock_external.callback_attack calls back into call_proxy.proxy_call(...)
   # 3. Assert the re-entrant call returns Err(ProxyError::ReentrantCall)
   # 4. Assert the original call completes successfully (the re-entrant one is rejected, not the outer)
   cargo nextest run -p tests -E 'test(/reentrant_rejection/)'
   ```

7. **Measure proxy WASM size**
   ```bash
   mise run build
   stat --format=%s /mnt/media_backup/cargo-target/wasm32-unknown-unknown/release/call_proxy.wasm
   # Target: < 500KB
   ```

8. **Run full test suite for regressions**
   ```bash
   cargo nextest run
   ```

## Setup

- Working directory: `/mnt/media_backup/PROJECTS/awen-network-canisters`
- Branch: `experiment/ex-00036-caller-guard-proxy` (git worktree at `/tmp/ex-00036`)
- New canisters (experiment-only):
  - `src/call_proxy/` -- CallerGuard proxy canister
  - `src/mock_external/` -- test helper canister for echo and callback attack
- Existing canister: `src/mcp_gateway/` -- the caller that routes through the proxy
- PocketIC required for inter-canister call testing
- AL-00003 CallerGuard pattern: thread_local RefCell tracking in-flight caller principal
- No modification to existing src/ canisters -- proxy is additive

## Algorithm

AL-00003 (CallerGuard for reentrancy protection). The proxy canister implements the CallerGuard pattern: before forwarding a call, it sets `GUARD = Some(msg_caller())`. If another call arrives while the guard is set, it is rejected as re-entrant. The guard is cleared after the forwarded call returns. Combined with an allowed-callers whitelist, this provides two-layer protection: authorization (who can call) and re-entrancy (only one in-flight call at a time).

## Success Criteria

- [ ] call_proxy canister compiles for wasm32-unknown-unknown
- [ ] call_proxy WASM size < 500KB
- [ ] Proxied call successfully routes mcp_gateway -> call_proxy -> mock_external and returns result
- [ ] 5/5 unauthorized principals rejected with ProxyError::Unauthorized
- [ ] Re-entrant callback from mock_external rejected with ProxyError::ReentrantCall
- [ ] Outer call completes successfully despite inner re-entrant rejection
- [ ] Cycle overhead < 20% (median of 50 proxied calls vs 50 direct calls)
- [ ] All existing tests pass without modification

## Data Collection

| Metric | Target | Actual |
|--------|--------|--------|
| Direct call cycle cost (median, 50 calls) | baseline | TBD |
| Proxied call cycle cost (median, 50 calls) | baseline + <20% | TBD |
| Cycle overhead (%) | < 20% | TBD |
| Unauthorized rejections (out of 5) | 5/5 | TBD |
| Re-entrant callback rejections | 100% | TBD |
| Outer call success after re-entrant rejection | Yes | TBD |
| call_proxy WASM size (bytes) | < 500KB | TBD |
| Existing test regressions | 0 | TBD |

## Risks & Mitigations

- **PocketIC cycle metering inaccuracy**: PocketIC may not precisely meter cycle costs for inter-canister calls. Mitigation: use relative comparison (proxied vs direct on same PocketIC instance) rather than absolute cycle counts. The ratio is what matters.
- **CallerGuard single-threaded assumption**: IC canisters process messages sequentially per canister, so the CallerGuard RefCell pattern works. But if future IC changes allow concurrent message processing, the pattern breaks. Mitigation: document this assumption; the IC roadmap does not indicate concurrent processing.
- **Proxy as single point of failure**: If call_proxy traps, all external calls fail. Mitigation: the proxy should be extremely minimal (no complex logic, no large state) to minimize trap risk. Consider deploying redundant proxies.
- **Extra latency**: The additional inter-canister hop adds ~2-5 seconds of wall-clock latency in production. Mitigation: acceptable for mcp_gateway (external calls are already slow). Document latency impact.
- **Mock canister callback_attack may not accurately simulate real re-entrancy**: The IC serializes message processing, so the "re-entrant" call arrives as a separate message. Mitigation: this is exactly how real re-entrancy works on IC -- the CallerGuard must detect the in-flight state across message boundaries.

## Results

(Fill in after running)

## Analysis

(Fill in after running)

## Next Steps

If all criteria pass: integrate call_proxy into the build system, create AL- entry for the proxy pattern, route mcp_gateway's 2 external Call::bounded_wait sites through the proxy. If overhead exceeds 20%: profile the proxy to identify unnecessary work; consider inlining the CallerGuard into mcp_gateway directly (losing blast radius isolation). If re-entrancy detection fails: investigate IC message ordering guarantees and adjust the guard pattern.
