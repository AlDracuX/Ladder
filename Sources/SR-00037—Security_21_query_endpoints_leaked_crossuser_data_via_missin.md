---
id: SR-00037
title: "Security: 21 query endpoints leaked cross-user data via missing caller filter"
type: observation
url: ""
status: draft
created: 2026-03-23
tags: [security, query, auth, cross-user, data-leak, access-control]
domain: "security"
relevance: "high"
---

## Summary

An audit discovered that 21 `#[query]` endpoints across multiple canisters (legal_analysis, settlement, and others) were returning data belonging to all users rather than filtering by `msg_caller()`. Unlike `#[update]` endpoints where caller identity verification was consistently applied, many query endpoints assumed that reading data was harmless. In a multi-tenant legal platform, this is a critical privacy breach -- User A could see User B's case analysis, settlement valuations, or evidence metadata.

## Key Points

- 21 query endpoints across multiple canisters lacked `msg_caller()` filtering on returned data
- The `_impl` pattern was followed (business logic separated from IC glue) but the caller Principal was not passed through to query implementations
- `#[update]` endpoints consistently checked `msg_caller() != Principal::anonymous()` but queries did not apply equivalent data scoping
- Fix required threading the caller Principal into each query's `_impl` function and filtering StableBTreeMap iteration by owner
- legal_analysis and settlement canisters had the most affected endpoints due to their high number of query methods

## Connection to Problems

This is the most critical security finding in the project. Employment tribunal data is inherently sensitive -- case strategies, settlement valuations, and legal analysis must never leak between users. The fix pattern (filter by `entry.value().owner == caller` in all iterators) is mechanical but must be applied consistently. This source motivates a systematic query-endpoint audit across all 9 canisters.

## Potential Ideas

- Build a clippy-like custom lint or integration test that asserts every `#[query]` endpoint's `_impl` function accepts a `Principal` parameter
- Create a `QueryAuth` struct that wraps caller identity and is required by all query `_impl` signatures, making it impossible to forget
