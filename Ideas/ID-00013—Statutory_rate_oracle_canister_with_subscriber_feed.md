---
id: ID-00013
title: "Statutory rate oracle canister with subscriber feed"
status: draft
created: 2026-03-23
sources: [SR-00006, SR-00001]
phase: dream
domain: "statutory-domain"
tags: [oracle, governance, statutory-rates, pub-sub, uk-employment]
scores:
  feasibility: 50
  novelty: 75
  impact: 65
  elegance: 80
---

## Description

Instead of hardcoding statutory rates in uk_caps.rs (the problem ID-00003 addresses with version-gating), create a dedicated "rates oracle" canister. This canister publishes statutory updates (tribunal caps, redundancy rates, basic award multipliers) as a versioned feed. Consumer canisters (settlement, legal_analysis, deadline_alerts) subscribe and receive rate updates automatically.

This decouples domain logic from rate data entirely. Annual rate changes become a single oracle update rather than code changes across multiple canisters.

## Provenance

DREAM phase: free-association from SR-00006 (hardcoded rates) crossing with SR-00001 (ASI self-improvement loop). The leap: what if the system updated its own legal knowledge? An oracle pattern makes rate updates a data operation, not a code deployment. The system evolves its statutory knowledge without recompilation.

## Connection

Addresses the same root problem as ID-00003 (statutory rate staleness) but with a fundamentally different architecture. ID-00003 adds expiry dates to existing code; this externalizes rates entirely into a separate data-driven canister.

## Next Steps

Hypothesis: A rates oracle canister serving 2025/26 UK employment statutory caps via query calls eliminates all hardcoded rate references in consumer canisters.
