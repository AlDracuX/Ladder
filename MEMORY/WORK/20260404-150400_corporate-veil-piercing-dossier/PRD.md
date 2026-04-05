---
task: Corporate Veil Piercing Dossier
slug: 20260404-150400_corporate-veil-piercing-dossier
effort: medium
phase: complete
progress: 0/6
mode: dev-job
started: 2026-04-04T15:00:00Z
updated: 2026-04-04T15:00:00Z
ladder_refs: [HY-00055, ID-00061]
domain: legal-intel
canisters: [procedural_intel, case_hub, legal_analysis]
---

## Context

Sims (LOR employee), Bains (LOR employee, described as "employment vehicle"), Stage 3 panel (EDF chair), and shell entity analysis. Combined evidence pierces the Bylor corporate veil and supports ET Rule 35 addition of 7 corporate respondents. The corporate structure (EDF -> NNB -> LOR -> Bylor) is designed to insulate the ultimate parent from employment liability, but evidence of control at each level -- particularly Sims and Bains operating as LOR employees within Bylor, and the Stage 3 panel being chaired by an EDF appointee -- demonstrates that Bylor lacks genuine independence. Impact score: 85.

## Scope

Build types and dossier assembly logic within `procedural_intel`, `case_hub`, and `legal_analysis` canisters to:

1. Model corporate veil evidence items with source and strength
2. Map control chains between parent and subsidiary entities
3. Auto-assemble piercing arguments from evidence chains
4. Generate Rule 35 application outputs per proposed respondent
5. Assess evidence strength per entity

## Acceptance Criteria

- [ ] ISC-1: CorporateVeilEvidence type -- evidence_id (u64), entity (String), evidence_type (EvidenceType enum: WitnessStatement/CompaniesHouse/SubjectAccessRequest/InternalDocument/EmailCorrespondence/ContractualDocument), quote (String), source_document (String), date_obtained (u64), strength (Strong/Moderate/Weak), relevance_notes (String)
- [ ] ISC-2: ControlChain type -- chain_id (u64), links (Vec<ControlLink>), where ControlLink contains parent_entity (String), subsidiary_entity (String), control_evidence (Vec<u64> referencing evidence_ids), control_type (Ownership/Operational/Personnel/Financial/DecisionMaking), control_strength (f64 0.0-1.0)
- [ ] ISC-3: Dossier assembly -- auto-generate piercing argument from evidence chain, function takes ControlChain and produces PiercingArgument with entity, legal_basis (Prest v Petrodel, DHN Food Distributors, Adams v Cape Industries), factual_summary, evidence_refs, conclusion_strength
- [ ] ISC-4: Rule 35 application output -- formatted argument per proposed respondent with supporting evidence refs, struct Rule35Application with proposed_respondent (String), basis_for_addition (String), evidence_summary (Vec<EvidenceSummary>), control_chain_summary (String), prejudice_assessment (String)
- [ ] ISC-5: Strength assessment per entity -- Strong (3+ evidence items including documentary)/Moderate (2+ items)/Weak (1 item or testimonial only), returned as EntityAssessment with entity, overall_strength, evidence_count, evidence_types (Vec<EvidenceType>), gaps (Vec<String> identifying missing evidence types)
- [ ] ISC-6: Unit test -- model Bylor -> LOR -> NNB -> EDF chain with Sims evidence (LOR employee at Bylor), Bains evidence (LOR "employment vehicle"), Stage 3 panel (EDF chair), Companies House filings, verify control chain links correctly, verify dossier assembly produces coherent piercing argument, verify Rule 35 output for each of 4 entities, verify strength assessments

## Dependencies

- Companies House filings for Bylor, LOR, NNB, EDF entities
- Subject Access Request (SAR) data
- Witness statements referencing Sims and Bains
- Stage 3 panel composition documentation
- ET Rule 35 (addition, substitution, and removal of parties) -- ET Rules 2024 (SI 2024/1155)

## Evidence

- Companies House corporate structure filings
- SAR disclosure (employment arrangements)
- Sims employment evidence (LOR employee operating within Bylor)
- Bains employment evidence (LOR employee, "employment vehicle" description)
- Stage 3 disciplinary panel composition (EDF-chaired)
- Internal documents showing cross-entity control
- Contractual arrangements between entities

## Out of Scope

- Companies House API integration or live data retrieval
- Legal research on veil piercing case law (authorities pre-identified)
- Tribunal filing or submission mechanics
- Frontend presentation of dossier
- Cost/benefit analysis of adding respondents
- Discovery/disclosure applications
