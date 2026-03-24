---
id: SR-00037
title: "Security: 69 of 263 query endpoints need caller filtering (expanded audit EX-00011)"
type: observation
url: ""
status: active
created: 2026-03-23
updated: 2026-03-24
tags: [security, query, auth, cross-user, data-leak, access-control]
domain: "security"
relevance: "high"
---

## Summary

The initial audit discovered 21 query endpoints leaking cross-user data. A full audit via EX-00011 expanded this to **69 of 263 query endpoints** (26%) across all 9 canisters needing caller filtering. The worst offender is `procedural_intel` at 38/75 (51%), followed by `legal_analysis`, `mcp_gateway`, `reference_shield`, and `evidence_vault`. Unlike `#[update]` endpoints where caller identity verification was consistently applied, many query endpoints assumed that reading data was harmless. In a multi-tenant legal platform, this is a critical privacy breach -- User A could see User B's case analysis, settlement valuations, or evidence metadata.

## Key Points

- Full audit (EX-00011): **69 of 263** query endpoints (26%) across all 9 canisters need caller filtering
- Worst canister: `procedural_intel` with 38/75 endpoints affected (51%)
- Other high-impact canisters: `legal_analysis`, `mcp_gateway`, `reference_shield`, `evidence_vault`
- Original finding of 21 was only a partial sample; full audit tripled the count
- The `_impl` pattern was followed (business logic separated from IC glue) but the caller Principal was not passed through to query implementations
- `#[update]` endpoints consistently checked `msg_caller() != Principal::anonymous()` but queries did not apply equivalent data scoping
- Fix required threading the caller Principal into each query's `_impl` function and filtering StableBTreeMap iteration by owner

## Connection to Problems

This is the most critical security finding in the project. Employment tribunal data is inherently sensitive -- case strategies, settlement valuations, and legal analysis must never leak between users. The fix pattern (filter by `entry.value().owner == caller` in all iterators) is mechanical but must be applied consistently. This source motivates a systematic query-endpoint audit across all 9 canisters.

## Potential Ideas

- Build a clippy-like custom lint or integration test that asserts every `#[query]` endpoint's `_impl` function accepts a `Principal` parameter
- Create a `QueryAuth` struct that wraps caller identity and is required by all query `_impl` signatures, making it impossible to forget
