---
id: ID-00039
title: "Stage 3 appeal domain types with internal contradiction detection for procedural_intel"
status: draft
created: 2026-03-26
sources: [SR-00058]
phase: dream
domain: "uk-employment-law"
tags: [appeal, disciplinary, contradiction-detection, procedural-intel, domain-types]
scores:
  feasibility: 7
  novelty: 6
  impact: 7
  elegance: 7
---

## Description

Create domain types in `procedural_intel` for modeling Stage 3 disciplinary appeal findings, including the ability to detect internal contradictions between different stages of an employer's decision-making process. Each stage (investigation, disciplinary hearing, appeal) produces findings that should be logically consistent; this system enables systematic comparison across stages. When a Stage 3 appeal panel contradicts Stage 2 findings without acknowledging the discrepancy, the types capture that as a structured `ContradictionEvent` with severity scoring.

## Provenance

Derived from SR-00058, which identified that Stage 3 appeal findings and internal contradiction evidence are not currently modeled in the system. In real tribunal cases, employers' internal processes frequently produce contradictory findings across disciplinary stages, and these contradictions are powerful evidence of procedural unfairness. The gap was identified during analysis of multi-stage disciplinary processes where appeal panels upheld dismissals while implicitly contradicting earlier fact-finding.

## Connection

Connects to the existing `procedural_intel` canister which already models tactics and procedural patterns. The contradiction detection types would extend the canister's pattern extraction capabilities. Also relates to the `legal_analysis` canister's document analysis pipeline, which could feed findings into contradiction comparison. The `awen_types` shared library would house the core `StageFinding` and `ContradictionEvent` types.

## Next Steps

1. Define `StageFinding`, `DisciplinaryStage`, and `ContradictionEvent` types in `awen_types`
2. Implement `detect_contradictions(stage_a: &StageFinding, stage_b: &StageFinding) -> Vec<ContradictionEvent>` as a pure function
3. Add contradiction severity scoring (minor inconsistency vs. direct factual contradiction)
4. Write property tests ensuring contradiction detection is symmetric and deterministic
5. Integrate with `procedural_intel` canister's pattern storage
