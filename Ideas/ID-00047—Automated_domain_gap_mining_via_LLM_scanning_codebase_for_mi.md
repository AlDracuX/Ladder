---
id: ID-00047
title: "Automated domain gap mining via LLM scanning codebase for missing types and generating SR entries"
status: draft
created: 2026-03-26
sources: [SR-00066]
phase: mate
domain: "dev-tooling"
tags: [ladder, automation, llm, gap-analysis, codebase-mining, meta-improvement]
scores:
  feasibility: 70
  novelty: 85
  impact: 75
  elegance: 70
---

## Description

Automate the gap-driven development pattern (SR-00066) that closed 6 domain gaps in a single session. An LLM-powered tool (extending AL-00007 semantic gap analysis) scans the codebase for: (1) string literals that should be domain types, (2) `Vec<String>` fields that should be typed enums, (3) hardcoded constants that should be in uk_caps, (4) domain concepts in comments/docs not reflected in type system. Each finding generates a Ladder SR- entry automatically via the CLI.

## Provenance

MATE phase: AL-00007 (semantic pattern gap analysis — read context before flagging) × SR-00066 (retrospective: gap-driven development closed 6 gaps efficiently). Applying the pollinator's semantic analysis to domain type coverage rather than just pattern adoption.

## Connection

- **ID-00008**: Improve pollinator (narrows: Call:: context only). This broadens to all domain gaps.
- **SR-00056–SR-00064**: The 9 gap sources that drove awen_hpc creation — this tool would have found them automatically
- **Ladder pipeline**: Meta-improvement — makes the Sources stage self-feeding

## Next Steps

1. Design: Define "domain gap" heuristics (string-where-enum-expected, magic-number, undocumented-concept)
2. Prototype: `mise run ladder:mine-gaps` using `claude -p` with structured output
3. Measure: Run against current codebase, compare findings to SR-00056–SR-00064
