---
id: ID-00031
title: "CallerGuard proxy isolation for untrusted inter-canister calls in mcp_gateway"
status: draft
created: 2026-03-25
sources: [SR-00055, AL-00003]
phase: mate
domain: "canister-security"
tags: [caller-guard, proxy, isolation, inter-canister, mcp-gateway]
scores:
  feasibility: 50
  novelty: 65
  impact: 60
  elegance: 70
---

## Description

mcp_gateway makes inter-canister calls to external services and backend canisters on behalf of users. If a malicious or buggy external canister exploits a callback to re-enter mcp_gateway, it could bypass rate limiting or corrupt state. This idea introduces a dedicated proxy canister that sits between mcp_gateway and all external inter-canister calls. The proxy canister uses CallerGuard (AL-00003) to enforce that only mcp_gateway's principal can invoke its methods, and it forwards calls to external targets in isolation. If the external call traps or attempts re-entrancy, the blast radius is contained to the proxy rather than affecting mcp_gateway's state. The proxy becomes a security boundary -- a sacrificial layer that absorbs the risk of interacting with untrusted canisters.

## Provenance

Mating AL-00003 (CallerGuard pattern for reentrancy protection) with SR-00055 (proxy canister pattern for call isolation). AL-00003 provides the mechanism for verifying caller identity and preventing re-entrant calls. SR-00055 describes an architectural pattern where a separate canister acts as an intermediary for external calls. The cross-pollination insight is that CallerGuard on the proxy creates a two-layer defense: the proxy isolates failure (SR-00055), and CallerGuard ensures only the authorized canister can use the proxy (AL-00003). Together they provide both containment and authentication.

## Connection

Primary beneficiary is mcp_gateway, which is the only canister that makes calls to external (potentially untrusted) canisters. Secondary benefits for any future canister that needs to interact with third-party services. Changes required: (1) create a new `call_proxy` canister with a minimal interface (`forward_call(target: Principal, method: String, args: Vec<u8>) -> Result<Vec<u8>, ProxyError>`), (2) implement CallerGuard in `call_proxy` that only accepts calls from mcp_gateway's principal, (3) modify mcp_gateway to route all external inter-canister calls through the proxy, (4) add the proxy to the deployment pipeline and dfx.json.

## Next Steps

1. Design the proxy canister interface: define the `forward_call` method signature, error types, and CallerGuard configuration (allowlisted principals stored in stable memory).
2. Assess the cycle cost overhead of the extra hop through the proxy. Benchmark a direct call versus a proxied call in PocketIC to quantify the latency and cycle impact.
3. Implement a minimal proxy canister with CallerGuard, deploy it alongside mcp_gateway in PocketIC, and test that unauthorized callers are rejected while mcp_gateway calls succeed.
