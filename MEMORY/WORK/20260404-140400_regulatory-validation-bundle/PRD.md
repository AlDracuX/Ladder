---
task: Regulatory Validation Bundle
slug: 20260404-140400_regulatory-validation-bundle
effort: small
phase: ready
progress: 0/5
mode: dev-job
started: 2026-04-04T14:00:00Z
updated: 2026-04-04T14:00:00Z
ladder_refs: [HY-00049, ID-00063]
domain: legal-precedent
canisters: [evidence_vault, legal_analysis]
---

## Context

ONR criminal prosecutions (NNB GenCo, Bouygues, LOR for CDM breaches) combined with the ONR whistleblower response (CON202508015 confirming safety concerns) provide independent regulatory corroboration of the Code 1 protected disclosure. This is devastating for the respondent's position -- an independent nuclear safety regulator has confirmed the very safety concerns that the claimant raised, and has prosecuted parties for the breaches the claimant reported.

Bundling these regulatory actions as structured corroboration evidence transforms scattered external validations into a coherent narrative: the claimant disclosed genuine safety concerns, the regulator independently confirmed those concerns, and the respondent dismissed the claimant for raising them.

## Scope

- Define `RegulatoryCorroboration` type in `evidence_vault`
- Implement corroboration strength classification (direct_confirmation/related_finding/contextual_support)
- Build bundle query for retrieving all regulatory corroboration per disclosure
- Create timeline overlay mapping regulatory actions onto disclosure timeline
- Unit test with ONR prosecutions and CON202508015 corroborating Code 1 disclosure

## Acceptance Criteria

- [ ] ISC-1: RegulatoryCorroboration type with fields: authority, reference_number, date, finding_summary, corroborates_disclosure_id
- [ ] ISC-2: CorroborationStrength enum: direct_confirmation, related_finding, contextual_support
- [ ] ISC-3: Bundle query get_corroboration_bundle(disclosure_id) returns all regulatory actions supporting a specific disclosure
- [ ] ISC-4: Timeline overlay: map regulatory actions onto disclosure timeline with temporal relationship annotation
- [ ] ISC-5: Unit test modelling ONR prosecutions (NNB/Bouygues/LOR) + CON202508015 corroborating Code 1 disclosure

## Dependencies

- `evidence_vault` canister for evidence storage and chain-of-custody
- `legal_analysis` canister for corroboration analysis and strength classification
- `awen_types` for shared type definitions

## Evidence

- ONR criminal prosecutions: NNB GenCo (CDM breaches), Bouygues (CDM breaches), LOR (CDM breaches)
- ONR whistleblower response: CON202508015 (confirming safety concerns)
- Code 1 protected disclosure: 3 Jul 2024
- Case reference: 6013156/2024

## Out of Scope

- Full regulatory document storage or OCR processing
- Automated monitoring of ONR prosecution outcomes
- Legal argument drafting based on corroboration
- Other regulatory bodies beyond ONR
- Freedom of Information requests or regulatory correspondence management
