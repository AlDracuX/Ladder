---
task: Whistleblower Protection Authority Bundle
slug: 20260404-160200_whistleblower-authority-bundle
effort: small
phase: ready
progress: 0/5
mode: dev-job
started: 2026-04-04T16:02:00Z
updated: 2026-04-04T16:02:00Z
ladder_refs: [HY-00063, ID-00099]
domain: legal-precedent
canisters: [legal_analysis]
---

## Context

The whistleblower detriment claims rest on a triple authority framework: Fecitt v NHS Manchester (temporal proximity as evidence of causation), Chesterton v Nurmohamed (public interest test for qualifying disclosures), and Halet v Luxembourg (ECtHR-level whistleblower protection reinforcing domestic standards). Applied together, these three authorities create a mutually reinforcing chain -- Chesterton establishes the disclosure qualifies, Fecitt connects the 48-hour proximity between disclosure and detriment, and Halet elevates the protection standard via Convention rights. This PRD structures these three authorities into a testable, scored framework applied to the Code 1 disclosure facts.

## Scope

- Define AuthorityBundle type combining multiple CaseLawEntry records with combined test and narrative
- Implement PublicInterestTest scoring each Halet factor against case facts
- Implement TemporalProximityTest applying Fecitt factors to the 48-hour chain
- Calculate combined strength rating from triple authority application
- Unit tests applying all three authorities to Code 1 disclosure facts

## Acceptance Criteria

- [ ] ISC-1: AuthorityBundle type with fields: authorities (Vec<CaseLawEntry>), combined_test (String), application_narrative (String)
- [ ] ISC-2: PublicInterestTest with each Halet factor scored (met/partially_met/not_met) against case facts with reasoning
- [ ] ISC-3: TemporalProximityTest applying Fecitt factors to the 48-hour disclosure-to-detriment chain with proximity_hours field
- [ ] ISC-4: Combined strength rating derived from triple authority: strong (all 3 support), moderate (2 of 3), weak (1 or fewer)
- [ ] ISC-5: Unit test applying all 3 authorities to Code 1 disclosure facts with expected strong rating

## Dependencies

- CaseLawEntry type (may be created by PRD 32 -- can define locally if PRD 32 not yet complete)
- Code 1 disclosure facts and 48-hour timeline must be representable as structured data

## Evidence

- **HY-00063**: Hypothesis that triple authority bundling strengthens whistleblower protection arguments
- **ID-00099**: Idea for whistleblower authority bundle with impact score 90
- Fecitt v NHS Manchester [2011] EWCA Civ 1190 -- temporal proximity causation test
- Chesterton Global Ltd v Nurmohamed [2017] EWCA Civ 979 -- public interest definition
- Halet v Luxembourg [2023] ECHR -- Grand Chamber whistleblower protection

## Out of Scope

- Other protected disclosures beyond Code 1 (can be modelled later using same framework)
- Full whistleblower claim pleading or ET1 drafting
- ECHR application procedures
- Damages calculation for whistleblower detriment
- Frontend display of authority bundles
