---
id: ID-00046
title: "Datalog-expressed state transition rules replacing hardcoded can_transition_to match arms"
status: draft
created: 2026-03-26
sources: [SR-00028]
phase: mate
domain: "architecture"
tags: [datalog, ascent, state-machine, transitions, declarative, can-transition-to]
scores:
  feasibility: 65
  novelty: 80
  impact: 70
  elegance: 90
---

## Description

Replace hardcoded `can_transition_to(&self, target) -> bool` match arms (AL-00011) with Ascent Datalog rules (SR-00028). Transition validity becomes a fact database: `transition(Active, Settled, true).` instead of `(CaseStatus::Active, CaseStatus::Settled) => true`. Adding new transitions requires adding facts, not editing match arms. The 6 status enums across 7 canisters would share a single Datalog rule set.

## Provenance

MATE phase: AL-00011 (exhaustive can_transition_to validation) × SR-00028 (Ascent 0.8 Datalog engine). The transition validation pattern is proven (EX-00010) but the hardcoded match arms don't scale — each new status variant requires updating every match.

## Connection

- **ID-00023**: Datalog for authorization (different domain — access control, not transitions)
- **ID-00042**: BDD scenario generation from Datalog (downstream consumer)
- **7 canisters**: case_hub (CaseStatus), settlement (NegotiationStatus, SettlementStatus), evidence_vault (EvidenceStatus), deadline_alerts (DeadlineStatus), case_timeline (EventStatus), legal_analysis (AnalysisStatus)

## Next Steps

1. Prototype: encode CaseStatus transitions as Ascent relations
2. Benchmark: Datalog evaluation time vs. hardcoded match
3. Risk: Datalog adds ~50KB to WASM — measure against instruction budget
