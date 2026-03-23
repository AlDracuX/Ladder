---
id: HY-00006
title: "Upgrade test harness catches 100% of Storable round-trip failures before deployment"
status: active
created: 2026-03-23
idea: ID-00004
tags: []
prediction: "A test harness that simulates canister upgrade with schema change catches all CandidStorable deserialization failures"
metric: "percentage of Storable types with round-trip upgrade tests"
success_criteria: "100% of stored types tested, zero round-trip failures in production"
---

## Hypothesis

If we build a test harness that serializes data with schema v1, simulates upgrade, then deserializes with schema v2, then all CandidStorable round-trip failures are caught before deployment.

## Rationale

The dual MemoryManager bug (P0) showed that storage issues are catastrophic. CandidStorable's fallback to Default on decode failure means data loss is silent.

## Testing Plan

1. For each canister, list all StableBTreeMap stored types.
2. Write proptest: serialize random instance, deserialize, assert equality.
3. Write upgrade test: add a field, verify old data still loads.

## Success Criteria

Every stored type has a round-trip proptest. Upgrade simulation for each canister. Zero silent Default fallbacks.

## Risks

Candid schema evolution rules are complex. Adding optional fields is safe, removing fields or changing types is not.
