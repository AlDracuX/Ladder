---
id: ID-00009
title: "Cross-canister event sourcing via shared journal canister"
status: draft
created: 2026-03-23
sources: [SR-00024, SR-00010, SR-00011, SR-00012, SR-00013, SR-00014]
phase: dream
domain: "inter-canister-reliability"
tags: [event-sourcing, journaling, audit-trail, inter-canister]
scores:
  feasibility: 55
  novelty: 80
  impact: 85
  elegance: 75
---

## Description

Introduce a 10th "journal" canister that all 9 existing canisters publish state mutations to. Every cross-canister state change is recorded as an immutable event with causality metadata. This enables full event replay, time-travel debugging, and automatic consistency verification across the network.

Unlike simple idempotency keys (ID-00002), this is a full event sourcing architecture where the journal becomes the source of truth and individual canister state is a materialized view.

## Provenance

DREAM phase: free-association from SR-00024 (ICP journaling pattern recommendation) crossing with the cluster of 5 idempotency gap observations (SR-00010 through SR-00014). The leap: don't just patch each canister individually — create a shared substrate that solves reliability, auditability, and debugging simultaneously.

## Connection

Addresses the systemic pattern of inter-canister reliability gaps across the workspace. The journaling pattern from ICP best practices (SR-00024) is the seed, but event sourcing extends it from "retry safety" to "complete system observability."

## Next Steps

Hypothesis: A journal canister receiving events from all 9 canisters can reconstruct any canister's state from the event log alone, proving consistency.
