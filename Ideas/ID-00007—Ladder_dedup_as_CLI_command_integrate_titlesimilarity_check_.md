---
id: ID-00007
title: "Ladder dedup as CLI command: integrate title-similarity check into bun CLI"
status: draft
created: 2026-03-22
sources: [SR-00022]
phase: contemplate
domain: "tooling"
tags: [ladder, dedup, cli, automation]
scores:
  feasibility: 9
  novelty: 3
  impact: 5
  elegance: 8
---

## Description

Move the title-similarity dedup check from an external bash script into the Ladder bun CLI as a native command. Currently dedup runs via `scripts/ladder-dedup-check.sh` which is fragile (depends on shell parsing). A TypeScript implementation would be more robust, support fuzzy matching, and integrate with the `add` command to auto-check before creation.

## Provenance

CONTEMPLATE phase from SR-00022 (dedup script pattern). Theme: tooling.

## Connection

The dedup check is a safety rule in the Ladder skill. Making it a first-class CLI command ensures it's never skipped. Could also power the new `stubs` command's duplicate detection.

## Next Steps

Hypothesis: integrated dedup reduces duplicate entries by 100% compared to optional bash script.
