---
id: ID-00020
title: "Build pipeline integrity: .did drift detection and continuous compilation guard"
status: active
updated: 2026-03-24
created: 2026-03-23
sources: [SR-00038, SR-00039, SR-00040]
phase: dream
domain: "build-infrastructure"
tags: [ci, candid, did, cargo-check, build-pipeline, drift-detection]
scores:
  feasibility: 90
  novelty: 40
  impact: 70
  elegance: 75
---

## Description

Unify three build-time integrity checks into a single `mise run integrity` pipeline: (1) `.did` drift detection -- regenerate Candid interfaces from WASM and diff against committed files, failing CI if they diverge; (2) continuous compilation guard -- the existing PostToolUse cargo check hook formalized as a CI step; (3) enrichment completeness -- a check that no Ladder entries remain as unenriched stubs for more than 24 hours.

The key insight from SR-00038, SR-00039, and SR-00040 is that these are all examples of the same meta-pattern: verifying that derived artifacts match their sources. `.did` files must match WASM exports. Compilation state must match source edits. Ladder entries must match their enriched content. A unified integrity check treats all three as instances of "drift detection."

## Provenance

DREAM phase: SR-00038 (.did regeneration pattern), SR-00039 (cargo check hook), and SR-00040 (stub entry problem) are three observations about build/process integrity. The creative connection is recognizing they share the same underlying pattern -- derived state drifting from source state -- and can be addressed by a unified verification pipeline.

## Connection

Improves the overall development workflow reliability. The `.did` drift check is especially important after the query auth changes (SR-00037/ID-00019) which modify endpoint signatures. The cargo check guard prevents the accumulation of compilation errors during multi-file refactoring sessions. The Ladder enrichment check is a process improvement that prevents the exact problem this task was created to fix.

## Next Steps

Hypothesis: A `mise run integrity` task that runs `.did` diff, `cargo check`, and Ladder stub detection catches 100% of drift issues before they reach CI. Experiment: implement the task, run it on the current codebase, then intentionally introduce each type of drift to verify detection.
