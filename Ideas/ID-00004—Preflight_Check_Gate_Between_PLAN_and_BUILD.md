---
id: ID-00004
title: "Preflight Check Gate Between PLAN and BUILD Phases"
status: active
created: 2026-03-22
sources: [SR-00004]
phase: contemplate
domain: "pai-optimization"
tags: [verification, prerequisites, gates, build-phase]
scores:
  feasibility: 95
  novelty: 35
  impact: 70
  elegance: 80
---

## Description

Insert a mandatory preflight check between PLAN and BUILD that verifies all prerequisites before any artifacts are created. The check list would be auto-generated from the PLAN's execution strategy: for each planned artifact, verify its dependencies exist, compile environments are clean, and assumed state is actual state. Evidence required — no "I assume X is true."

## Provenance

CONTEMPLATE analysis of SR-00004. The algorithm already has "PREREQUISITE VALIDATION" in PLAN but it's advisory text, not a gate. Making it a gate with evidence requirements prevents the compile-fix-compile cycle seen in reflections.

## Connection

Addresses the 5+ reflection entries about discovering preconditions too late. Eliminates rework cycles that waste execution budget.

## Next Steps

Hypothesis: A mandatory preflight gate reduces "should have verified before" reflections by 90% and saves ~15% execution time on Extended+ tasks.
