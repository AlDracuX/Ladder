---
id: ID-00003
title: "Automated statutory rate sunset: uk_caps.rs version-gated with effective dates"
status: active
updated: 2026-03-24
created: 2026-03-22
sources: [SR-00006]
phase: contemplate
domain: "statutory-calculations"
tags: [uk-law, caps, versioning, sunset]
scores:
  feasibility: 7
  novelty: 5
  impact: 8
  elegance: 7
---

## Description

Add version-gated statutory rates to uk_caps.rs with effective dates. Each rate constant would have a `valid_from` and `valid_until` date. At compile time or runtime, the correct rate for the claim date is selected. Prevents stale 2024/25 rates being used for 2026/27 claims.

## Provenance

CONTEMPLATE phase from SR-00006 (hardcoded rates with no sunset). Theme: domain correctness.

## Connection

Affects settlement (Vento bands, statutory cap), deadline_alerts (ERA qualification periods), legal_analysis (schedule of loss). UK government updates rates annually in April.

## Next Steps

Hypothesis: version-gated caps eliminate manual rate update errors and allow multi-year claim support.
