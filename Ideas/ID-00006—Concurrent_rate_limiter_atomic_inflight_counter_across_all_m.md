---
id: ID-00006
title: "Concurrent rate limiter: atomic in-flight counter across all mcp_gateway methods"
status: draft
created: 2026-03-22
sources: [SR-00005]
phase: steal
domain: "security"
tags: [rate-limiting, concurrency, mcp-gateway, burst-protection]
scores:
  feasibility: 7
  novelty: 6
  impact: 7
  elegance: 6
---

## Description

Replace the window-based rate limiter in mcp_gateway with an atomic in-flight counter that tracks concurrent active requests. Current design counts requests per time window but doesn't limit concurrency -- 100 requests arriving simultaneously all pass the window check. An in-flight counter would reject requests when max concurrent calls are active.

## Provenance

CONTEMPLATE phase from SR-00005 (rate limit bypass via concurrency). Theme: security.

## Connection

mcp_gateway is the only canister with rate limiting. The 100req/60s per-principal limit can be bypassed by bursting. The global 1000req/60s limit has the same vulnerability.

## Next Steps

Hypothesis: in-flight counter reduces successful burst attacks by 90% vs window-only rate limiting.
