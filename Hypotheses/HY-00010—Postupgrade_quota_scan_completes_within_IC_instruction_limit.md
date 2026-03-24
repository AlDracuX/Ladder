---
id: HY-00010
title: "Post-upgrade quota scan completes within IC instruction limits for 100K stable storage records"
status: draft
created: 2026-03-24
idea: ID-00024
tags: [quota, post-upgrade, performance, instruction-limit, stable-storage]
prediction: "Iterating all records and counting per-user totals completes within 2 billion instructions for 100K records"
metric: "instruction count for full quota scan via instruction_counter API"
success_criteria: "scan of 100K records uses <2B instructions (IC per-message limit is 5B for updates, 20B for install)"
---

## Hypothesis

If we implement a post-upgrade timer scan that iterates all StableBTreeMap records and counts per-user totals to detect quota violations, then the scan completes within IC instruction limits (2 billion instructions) for a canister with 100K total records across all users.

## Rationale

AL-00005 enforces per-user quotas (10K records) at insert time, but edge cases (saga failures, schema migrations) can violate this assumption. SR-00033 proposes post-upgrade timer scans. The key question is whether a full scan is feasible within IC instruction limits. StableBTreeMap iteration involves stable memory reads which are more expensive than heap — each `entry.value()` deserializes from Candid. ID-00024 proposes this but the feasibility depends on instruction cost.

## Testing Plan

1. Benchmark setup: populate evidence_vault with 100K synthetic `StoredEvidence` records (10 users × 10K each)
2. Implement `quota_health_check()` that iterates EVIDENCE_STORE, counts per-owner, returns violations
3. Measure: wrap scan in `ic_cdk::api::instruction_counter()` before/after
4. Run via PocketIC integration test to get accurate instruction counts
5. Extrapolate: if 100K takes X instructions, what's the max feasible record count?

## Success Criteria

- Primary: full scan of 100K records uses <2B instructions
- Secondary: per-user count map fits in heap during scan (100K records / ~1000 users = feasible)
- Tertiary: scan completes within the 60-second timer callback window

## Risks

- Candid deserialization cost per record may be higher than expected for large types (StoredEvidence has many fields)
- If 100K exceeds limits, would need batched scanning across multiple timer callbacks
- Different canisters have different record sizes — evidence_vault is worst case
