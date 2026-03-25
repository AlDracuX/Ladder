---
id: ID-00036
title: "Pre-flight cycles cost estimator for batch multi-canister operations"
status: draft
created: 2026-03-25
sources: [SR-00045]
phase: dream
domain: "canister-economics"
tags: [cycles, cost-estimation, batch, ic-cdk, operations]
scores:
  feasibility: 8
  novelty: 5
  impact: 6
  elegance: 7
---

## Description

Use the ic-cdk 0.18 `cycles_cost_estimation` API to build a pre-flight cost calculator that estimates total cycle burn before executing batch operations across multiple canisters. Before a multi-canister update (e.g., adding evidence + updating timeline + recalculating deadlines), query each target canister's estimated cost and present a total before committing. Prevents surprise cycle drain on operations that fan out to 3-5 canisters.

## Provenance

Generated during dream phase from [SR-00045, SR-00054]. Theme: canister-economics. SR-00045 documented the new cycles cost estimation API; SR-00054 covered composite queries for multi-canister reads.

## Connection

Addresses the blind spot of not knowing cycle costs until after execution. Affects mcp_gateway (orchestration layer), case_hub (multi-canister case operations), and any future batch import tools. Currently there's no pre-flight cost visibility — operations either succeed or drain cycles unexpectedly.

## Next Steps

Hypothesis: "Pre-flight estimation predicts actual cycle cost within 20% for standard case operations". Test by instrumenting 5 common multi-canister workflows and comparing estimates vs actuals.
