---
id: SR-00045
title: "ic-cdk 0.18 cycles cost estimation APIs for pre-flight cost checking"
type: paper
url: "https://github.com/dfinity/cdk-rs/blob/main/ic-cdk/CHANGELOG.md"
status: active
updated: 2026-03-23
created: 2026-03-24
tags: [ic-cdk, cycles, cost-estimation, rate-limiting, mcp-gateway]
domain: "canister-economics"
relevance: "medium"
---

## Summary

ic-cdk 0.18.0 (Apr 2025) introduced cycles cost estimation APIs: `cost_http_request`, `cost_sign_with_ecdsa`, `cost_sign_with_schnorr`, and `cost_vetkd_derive_key`. These allow canisters to calculate the exact cycle cost of an operation before executing it, enabling pre-flight budget checks, cost-aware routing, and cycle drain prevention.

## Key Points

- `cost_http_request`: estimate cycles for HTTPS outcalls before making them
- `cost_sign_with_ecdsa/schnorr`: estimate signing costs for threshold signatures
- `cost_vetkd_derive_key`: estimate VetKD key derivation costs (used by evidence_vault)
- Enables "check balance, estimate cost, reject if insufficient" pattern
- Prevents cycle drain attacks where callers trigger expensive operations that exhaust canister cycles

## Connection to Problems

Connects to SR-00005 (rate limit bypass in mcp_gateway) and ID-00006 (concurrent rate limiter). The cost estimation APIs add a second defense layer: even if a request passes rate limiting, the canister can reject it if the estimated cycle cost would drop the balance below a safety threshold. Also relevant to evidence_vault's VetKD operations which are cycle-intensive.

## Potential Ideas

- Add cycle budget guard to mcp_gateway: reject requests when estimated cost > available balance * safety_margin
- Log cycle costs per operation for monitoring dashboard (connects to the http_request metrics endpoint)
- Use cost estimation in saga coordinator: verify all saga steps are affordable before beginning the saga
