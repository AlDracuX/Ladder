---
id: SR-00004
title: "PAI Repeatedly Discovers Preconditions Too Late in Execution"
type: telemetry
url: ""
status: active
created: 2026-03-22
tags: [pai, verification, ordering, reflections]
domain: "pai-optimization"
relevance: "5+ reflections show the algorithm building artifacts before verifying prerequisites — rework follows"
---

## Summary

The algorithm consistently builds before verifying preconditions, then discovers issues that require rework. This manifests as compile errors after writing code, missing data after starting analysis, and incorrect assumptions discovered mid-execution.

## Key Points

- "Should have checked Principal Default constraint before writing the type to avoid the compile-fix cycle" (2026-03-22)
- "Should have verified committee names first before any other checks" (2026-03-18)
- "Should have checked beads DB health before trying to create issues" (2026-03-20)
- "Should have identified N/A items during OBSERVE rather than discovering during EXECUTE" (2026-03-21)
- "Two of six items were false alarms — should have verified before recommending" (2026-03-19)
- Pattern: PREREQUISITE VALIDATION in PLAN exists as a phase instruction but isn't enforced

## Connection to Problems

The PLAN phase includes "PREREQUISITE VALIDATION: env, deps, state, files" but it's a suggestion, not a gate. No ISC criterion is auto-generated for prerequisite verification.

## Potential Ideas

- Make PREREQUISITE VALIDATION a mandatory gate with evidence before BUILD proceeds
- Auto-generate "Prerequisites verified for X" ISC criteria in PLAN
- Add a "pre-flight check" step between PLAN and BUILD
