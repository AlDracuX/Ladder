---
id: ID-00037
title: "Construction industry domain crate encoding NEC3 NAECI and blacklisting rules"
status: draft
created: 2026-03-25
sources: [SR-00060]
phase: dream
domain: "case-domain"
tags: [nec3, naeci, blacklisting, construction, jurisdiction-module]
scores:
  feasibility: 5
  novelty: 8
  impact: 7
  elegance: 6
---

## Description

Create an `awen_construction` crate (or extend awen_hpc) encoding NEC3 ECC contract terms (Option A pricing, X-clauses, Z-clauses for nuclear), NAECI Blue Book working rules (overtime rates, travel time, accommodation allowances), and CFA anti-blacklisting protocol provisions. This makes construction-sector employment claims machine-analyzable — e.g., automatically detecting whether a dismissal violated NEC3 clause 26.2 (termination procedures) or whether NAECI rates were properly applied.

## Provenance

Generated during dream phase from [SR-00060, SR-00061, SR-00062]. Theme: case-domain gaps. SR-00060 identified missing NEC3/NAECI types; SR-00061 identified the blacklisting gap; SR-00062 identified the case-specific crate pattern.

## Connection

Addresses the gap where Awen can handle generic employment law but not construction-specific contractual and industry frameworks. Affects legal_analysis (contract interpretation), procedural_intel (industry pattern detection). The HPC case specifically involves NEC3 terms that govern Bylor's employment practices — encoding these enables automated contract compliance checking.

## Next Steps

Hypothesis: "Encoding NEC3 termination clauses enables automated detection of procedural non-compliance in construction dismissals". Start with the 5 most relevant NEC3 clauses for the HPC case and test against known facts.
