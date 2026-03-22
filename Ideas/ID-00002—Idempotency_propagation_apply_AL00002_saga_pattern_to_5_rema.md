---
id: ID-00002
title: "Idempotency propagation: apply AL-00002 saga pattern to 5 remaining canisters"
status: draft
created: 2026-03-22
sources: [SR-00010]
phase: mate
domain: "canister-reliability"
tags: [idempotency, saga, cross-canister]
scores:
  feasibility: 9
  novelty: 3
  impact: 9
  elegance: 8
---

## Description

Apply the proven saga + idempotency pattern (AL-00002) to evidence_vault, mcp_gateway, legal_analysis, procedural_intel, and case_hub. The pattern is already implemented in case_timeline and deadline_alerts — this is propagation, not invention.

## Provenance

SR-00010 through SR-00014 (pollinator gap analysis). AL-00002 (proven saga pattern).

## Connection

HY-00003 already formulated. Directly addresses the largest pattern adoption gap in the codebase.

## Next Steps

Design experiment via "design experiment for HY-00003", then execute.
