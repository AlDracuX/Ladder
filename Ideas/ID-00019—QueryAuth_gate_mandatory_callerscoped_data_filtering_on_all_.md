---
id: ID-00019
title: "QueryAuth gate: mandatory caller-scoped data filtering on all query endpoints"
status: draft
created: 2026-03-23
sources: [SR-00037]
phase: dream
domain: "security"
tags: [query-auth, access-control, caller-filter, privacy, multi-tenant]
scores:
  feasibility: 85
  novelty: 45
  impact: 95
  elegance: 80
---

## Description

Introduce a `QueryAuth` struct that wraps the caller's `Principal` and is a mandatory parameter on every `_impl` function for `#[query]` endpoints. By making the auth context a required function argument rather than an optional consideration, it becomes structurally impossible to write a query that forgets caller-scoped filtering. The struct provides helper methods like `filter_owned<T: HasOwner>(&self, iter) -> impl Iterator` that handle the common pattern of filtering StableBTreeMap entries by owner.

This addresses the systematic failure where 21 query endpoints leaked cross-user data (SR-00037). The root cause was not negligence but API design: nothing forced query implementations to consider data scoping. This idea makes the secure path the default path.

## Provenance

DREAM phase: SR-00037 (21 query endpoints missing caller filter) is a critical security finding. The creative leap is moving from "fix each endpoint" (a patch) to "make forgetting impossible" (a structural guarantee). Inspired by Rust's ownership model philosophy: if the compiler can enforce it, don't rely on developer discipline.

## Connection

This is the highest-impact security improvement in the pipeline. Every canister with user-facing data (evidence_vault, case_timeline, legal_analysis, settlement, deadline_alerts, procedural_intel, case_hub) needs this. Complementary to the `#[update]` anonymous caller check already in place -- this is the query-side equivalent.

## Next Steps

Hypothesis: After introducing `QueryAuth` as a required parameter on all query `_impl` functions, zero query endpoints can return data belonging to a different caller. Test by writing integration tests that call each query endpoint as User A and verify no User B data appears in results.
