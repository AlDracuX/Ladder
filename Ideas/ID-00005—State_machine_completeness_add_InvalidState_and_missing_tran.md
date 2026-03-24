---
id: ID-00005
title: "State machine completeness: add InvalidState and missing transition variants"
status: active
updated: 2026-03-24
created: 2026-03-22
sources: [SR-00003]
phase: contemplate
domain: "architecture"
tags: [state-machine, validation, completeness, bug-prevention]
scores:
  feasibility: 8
  novelty: 4
  impact: 8
  elegance: 8
---

## Description

Add InvalidState error variant to every status enum and implement exhaustive can_transition_to() methods. The ComplaintStatus bug (P0, now fixed) showed that missing transition validation allows any state to reach any other. Apply the same fix pattern systematically to all remaining enums: NegotiationStatus, ListingStatus, KeyStatus.

## Provenance

CONTEMPLATE phase from SR-00003 (missing InvalidState in procedural_intel). Theme: state machine correctness.

## Connection

Affects procedural_intel (ComplaintStatus -- fixed), settlement (NegotiationStatus -- unfixed), deadline_alerts (ListingStatus), evidence_vault (KeyStatus). Pattern: every enum with status transitions needs a validation gate.

## Next Steps

Hypothesis: exhaustive transition validation on all status enums eliminates invalid state bugs across all 9 canisters.
