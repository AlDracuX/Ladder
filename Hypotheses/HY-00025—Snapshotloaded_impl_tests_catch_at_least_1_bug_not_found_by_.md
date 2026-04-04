---
id: HY-00025
title: "Snapshot-loaded _impl tests catch at least 1 bug not found by synthetic-data unit tests"
status: draft
created: 2026-03-27
idea: ID-00032
tags: [snapshot, impl-pattern, integration-test, stable-memory, evidence-vault]
prediction: "Snapshot-based _impl tests discover at least 1 issue not caught by synthetic unit tests"
metric: "Count of unique bugs/edge-cases found by snapshot tests that pass all existing unit tests"
success_criteria: "At least 1 bug or edge case discovered in _impl functions when run against real stable memory snapshot"
---

## Hypothesis

If we capture evidence_vault's stable memory snapshot from a populated PocketIC deployment and run `_impl` functions against the deserialized real data in native tests, then we discover at least 1 bug or edge case (serialization mismatch, quota violation, unexpected key ordering) that is not caught by existing synthetic-data unit tests.

## Rationale

ID-00032 combines the _impl pattern (AL-00001) with ic-cdk 0.19 snapshot APIs (SR-00043). Synthetic test data uses predictable inputs (sequential IDs, short strings, valid dates). Real data has organic patterns: variable-length content, edge-case timestamps, records created by different code versions. The hypothesis is that these organic patterns expose at least one latent issue. This is consistent with production debugging experience where "works in tests, fails with real data" is common.

## Testing Plan

1. **Setup**: Deploy evidence_vault to PocketIC, populate with ~500 evidence records using varied inputs (long descriptions, unicode titles, edge-case dates, max-size attachments)
2. **Capture**: Use PocketIC snapshot API to capture stable memory state as binary
3. **Load**: Write a test module that deserializes the snapshot into `BTreeMap` equivalents
4. **Run**: Execute _impl functions (store, retrieve, search, chain-of-custody) against the real data
5. **Measure**: Count any panics, errors, or unexpected behaviors that don't occur with synthetic data

## Success Criteria

- Primary: At least 1 unique bug or edge case found (serialization error, validation bypass, ordering issue)
- Secondary: Snapshot capture + load + test cycle completes in < 30 seconds
- Secondary: Snapshot test harness is reusable for other canisters

## Risks

- PocketIC snapshot API may not be available in current version — need to check ic-cdk 0.19 PocketIC support
- Real data may be too clean if only populated synthetically in PocketIC (not truly "organic")
- Deserialization of snapshot into native BTreeMap may differ from StableBTreeMap behavior
