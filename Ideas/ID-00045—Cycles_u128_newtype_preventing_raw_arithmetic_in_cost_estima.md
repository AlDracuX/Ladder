---
id: ID-00045
title: "Cycles u128 newtype preventing raw arithmetic in cost estimation and rate limiting"
status: draft
created: 2026-03-26
sources: [SR-00045]
phase: mate
domain: "canister-economics"
tags: [cycles, newtype, type-safety, cost-estimation, mcp-gateway]
scores:
  feasibility: 90
  novelty: 55
  impact: 60
  elegance: 85
---

## Description

Apply the same Money newtype pattern (AL-00008) to cycles: a `Cycles(u128)` newtype that prevents accidentally mixing cycle values with other u128 quantities (timestamps, record counts, byte sizes). The ic-cdk 0.18 cycles cost estimation APIs (SR-00045) return raw u128 — wrapping these in a typed wrapper catches arithmetic errors at compile time.

## Provenance

MATE phase: AL-00008 (Money newtype for type-safe pence arithmetic) × SR-00045 (ic-cdk 0.18 cycles cost estimation APIs). The same principle that eliminates £/pence confusion eliminates cycles/u128 confusion.

## Connection

- **mcp_gateway**: Rate limiter tracks cycles consumed per request — currently raw u128
- **case_hub**: Multi-canister orchestration estimates cycles before inter-canister calls
- **All 9 canisters**: `ic_cdk::api::canister_balance128()` returns raw u128

## Next Steps

1. Define `Cycles(u128)` in `awen_types` with `Add`, `Sub`, `Display`, `Storable`
2. Wrap all `canister_balance128()` calls
3. Wrap cost estimation API returns
4. Measure: count of raw u128 arithmetic on cycle values before/after
