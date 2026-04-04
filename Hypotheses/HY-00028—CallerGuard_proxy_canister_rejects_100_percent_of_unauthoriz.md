---
id: HY-00028
title: "CallerGuard proxy canister rejects 100 percent of unauthorized re-entrant calls with under 20 percent cycle overhead"
status: draft
created: 2026-03-27
idea: ID-00031
tags: [caller-guard, proxy, security, re-entrancy, mcp-gateway]
prediction: "Proxy rejects 100% unauthorized calls with < 20% cycle overhead per proxied call"
metric: "Re-entrancy rejection rate (%); cycle cost overhead per proxied vs direct call (%)"
success_criteria: "100% rejection of unauthorized/re-entrant calls AND cycle overhead < 20%"
---

## Hypothesis

If we introduce a CallerGuard proxy canister between mcp_gateway and external inter-canister calls, then 100% of unauthorized and re-entrant call attempts are rejected, with less than 20% cycle overhead per proxied call compared to direct calls.

## Rationale

ID-00031 combines AL-00003 (CallerGuard for reentrancy protection) with SR-00055 (proxy canister isolation pattern). mcp_gateway makes calls to external canisters on behalf of users — a malicious callback could re-enter mcp_gateway and bypass rate limiting. The proxy provides a blast radius boundary: if the external call traps or re-enters, it's contained to the proxy. CallerGuard ensures only mcp_gateway's principal can invoke the proxy. The 20% overhead threshold is generous — the extra hop costs ~1-2M instructions (one inter-canister call), which is small relative to the full operation.

## Testing Plan

1. **Setup**: Deploy mcp_gateway + a mock external canister + the new call_proxy canister to PocketIC
2. **Baseline**: Direct call from mcp_gateway to mock canister, measure cycle cost
3. **Proxied**: Route the same call through call_proxy, measure cycle cost
4. **Rejection test**: Call call_proxy from an unauthorized principal — expect rejection
5. **Re-entrancy test**: Configure mock canister to callback into call_proxy — expect rejection via CallerGuard
6. **Delta**: `(proxied - direct) / direct * 100` — expect < 20%

## Success Criteria

- Primary: 100% of calls from unauthorized principals are rejected (tested with 5+ different principals)
- Primary: 100% of re-entrant callback attempts are blocked
- Primary: Cycle overhead < 20% per proxied call
- Secondary: Proxy canister WASM size < 500KB (minimal logic)

## Risks

- Extra inter-canister hop adds latency that may be noticeable for time-sensitive operations
- CallerGuard state (allowed principals) must survive upgrades — needs stable storage
- The proxy becomes a single point of failure — if it traps, all external calls fail
