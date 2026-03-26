---
id: ID-00040
title: "CFA anti-blacklisting protocol types with whistleblower protection chain modeling"
status: draft
created: 2026-03-26
sources: [SR-00061]
phase: dream
domain: "construction-employment"
tags: [blacklisting, whistleblower, CFA, construction, domain-types, protection-chain]
scores:
  feasibility: 5
  novelty: 8
  impact: 6
  elegance: 7
---

## Description

Encode the Construction Framework Agreement anti-blacklisting protocol and whistleblower protection chains as domain types. Model the CFA's explicit anti-blacklisting clause, the Consulting Association pattern (systematic industry blacklisting of union activists and whistleblowers), and the protection chain from disclosure to detriment to dismissal to blacklisting. This enables automated detection of blacklisting patterns across cases by matching the characteristic sequence of events. The types capture both the contractual protections (CFA clause prohibiting blacklisting) and the evidential pattern when those protections are violated.

## Provenance

Derived from SR-00061, which identified that CFA anti-blacklisting protocol structures and construction industry blacklisting patterns are not modeled in the system. The Consulting Association scandal revealed systematic blacklisting in UK construction, and the CFA's anti-blacklisting clause was a direct response. This pattern is relevant to cases where workers in framework agreement environments face retaliation after protected disclosures, and the blacklisting follows a recognisable sequence that can be encoded structurally.

## Connection

Connects to `awen_uk_employment` for whistleblower protection types (ERA 1996 s.43A-43L) and the existing detriment/dismissal domain types. The protection chain model (disclosure -> detriment -> dismissal -> blacklisting) extends the linear causation types already present in `legal_analysis`. The CFA-specific types would live in a construction employment module, potentially within `awen_types` or a dedicated `awen_construction` sub-crate if the domain grows. Feasibility is lower (5) because construction-specific legal patterns require careful domain modeling and the Consulting Association pattern involves cross-employer coordination that is architecturally novel.

## Next Steps

1. Research and document the CFA anti-blacklisting clause structure and its legal basis
2. Define `ProtectionChain` type modeling the disclosure-to-blacklisting sequence
3. Create `BlacklistingPattern` enum covering known patterns (Consulting Association, informal referencing, industry databases)
4. Implement pattern matching logic that flags when a case timeline matches the characteristic blacklisting sequence
5. Add integration with `procedural_intel` for cross-case pattern aggregation
