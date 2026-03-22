---
id: ID-00002
title: "Mandatory Parallelization Gate in PLAN Phase"
status: active
created: 2026-03-22
sources: [SR-00002]
phase: contemplate
domain: "pai-optimization"
tags: [parallelization, plan-phase, gates]
scores:
  feasibility: 90
  novelty: 40
  impact: 75
  elegance: 70
---

## Description

Add a mandatory step in the PLAN phase that requires the algorithm to explicitly map independent work streams before BUILD begins. The output would be a "parallelization map" — a list of tasks that can run concurrently vs. those with dependencies. Any task with 3+ independent subtasks MUST use parallel execution.

## Provenance

CONTEMPLATE analysis of SR-00002. The reflection data shows the algorithm knows about parallelization (capability #18) but doesn't enforce it. The fix is structural: make it a gate, not a suggestion.

## Connection

Addresses the recurring ~6% reflection pattern of "should have parallelized." Direct reduction in execution time for multi-agent tasks.

## Next Steps

Hypothesis: Adding a parallelization gate to PLAN reduces "should have parallelized" reflections by 80% over 4 weeks.
