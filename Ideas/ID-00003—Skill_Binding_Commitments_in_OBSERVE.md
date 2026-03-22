---
id: ID-00003
title: "Skill Binding Commitments Replace Passive Capability Audit"
status: active
created: 2026-03-22
sources: [SR-00003]
phase: contemplate
domain: "pai-optimization"
tags: [skills, capability-audit, binding, observe-phase]
scores:
  feasibility: 85
  novelty: 60
  impact: 80
  elegance: 75
---

## Description

Transform the capability audit from a passive awareness exercise into an active binding step. During OBSERVE, for each relevant skill identified, the algorithm creates an ISC criterion: "Skill X applied to subtask Y". This converts "could have used" into "will use" — the verification phase then catches any skill that was committed but not applied.

## Provenance

CONTEMPLATE analysis of SR-00003. The gap is between identification and commitment. The audit says "these skills exist" but doesn't say "I will use these skills." ISC is the natural enforcement mechanism — it's already how the algorithm tracks commitments.

## Connection

Addresses the 7+ reflection entries noting underutilized skills. The root cause isn't ignorance (the audit finds them) but lack of commitment (nothing forces their use).

## Next Steps

Hypothesis: Converting capability audit to binding commitments increases skill utilization from ~30% to ~70% of identified-relevant skills.
