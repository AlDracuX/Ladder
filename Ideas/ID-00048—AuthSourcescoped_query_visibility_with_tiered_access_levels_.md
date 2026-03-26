---
id: ID-00048
title: "AuthSource-scoped query visibility with tiered access levels per caller context"
status: draft
created: 2026-03-26
sources: [SR-00037]
phase: mate
domain: "security"
tags: [auth, query, visibility, tiered-access, authsource, rbac]
scores:
  feasibility: 75
  novelty: 60
  impact: 80
  elegance: 75
---

## Description

Extend the binary QueryAuth gate (ID-00019: filter by caller) with AuthSource-aware visibility tiers (AL-00009). Instead of just "your data only", implement: Controller sees all data across all users (admin view), Timer sees aggregated/anonymized data (background processing), User sees only their own records, Anonymous sees nothing. The 69 query endpoints flagged in SR-00037 would each declare their visibility tier, and a shared `query_filter!(tier)` macro applies the correct filtering.

## Provenance

MATE phase: AL-00009 (AuthSource enum with 4 context variants) × SR-00037 (69 query endpoints needing caller filtering). The AuthSource already distinguishes caller context — extending this to query visibility is a natural crossing.

## Connection

- **ID-00019**: QueryAuth gate (binary filter — this enriches it with tiers)
- **ID-00025**: Semantic query auditor (detection tool — this is the enforcement mechanism)
- **All 9 canisters**: 69 of 263 query endpoints affected per SR-00037 audit

## Next Steps

1. Define `QueryVisibility` enum: `OwnerOnly | ControllerFull | TimerAggregate | Public`
2. Add `query_visibility` attribute to each query endpoint
3. Implement `query_filter!` macro that reads AuthContext and applies tier
4. Measure: count of endpoints with explicit visibility annotation before/after
