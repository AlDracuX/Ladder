---
task: Multi-Respondent Entity Mapper
slug: 20260404-140900_multi-respondent-entity-mapper
effort: medium
phase: complete
progress: 0/6
mode: dev-job
started: 2026-04-04T14:00:00Z
updated: 2026-04-04T14:00:00Z
ladder_refs: [HY-00050, ID-00073]
domain: legal-intel
canisters: [procedural_intel, case_hub, legal_analysis]
---

## Context

Case 6013156/2024 involves 18 respondents across 3 tiers: 1 primary respondent (Bylor Ltd), 7 proposed corporate additions, and 10 individual respondents. The corporate hierarchy is complex: Bylor Ltd is a subsidiary of Laing O'Rourke (LOR), which operates as contractor for NNB Generation Company (NNB), itself a subsidiary of EDF Energy. Witness statements from Sims and Bains reveal that true employment control flowed through this corporate chain rather than resting solely with the named employer.

Mapping these entities with their control relationships and supporting evidence automates Rule 35 applications to add respondents. Each level in the hierarchy requires documented control evidence drawn from witness statements, Companies House filings, Subject Access Request responses, and public records. The entity mapper structures this complex web into a queryable graph with evidence at each edge.

## Scope

- Define `RespondentEntity` type in `procedural_intel` for each respondent with corporate metadata
- Define `CorporateHierarchy` type representing parent-subsidiary relationships with control classification
- Define `ControlEvidence` type linking evidence sources to hierarchy edges
- Implement `get_hierarchy` query returning full corporate chain with evidence at each level
- Build Rule 35 output generator producing respondent addition justification from hierarchy and evidence
- Store entity graph in `procedural_intel` with cross-references to `case_hub` and `legal_analysis`
- Unit tests modelling the full Bylor-LOR-NNB-EDF chain

## Acceptance Criteria

- [ ] ISC-1: RespondentEntity type with fields: name, entity_type (Corporate/Individual), companies_house_ref (Option<String>), role_in_case (Primary/ProposedCorporate/Individual), control_evidence (Vec<ControlEvidence>)
- [ ] ISC-2: CorporateHierarchy type with fields: parent (entity_id), subsidiary (entity_id), control_type (Direct/Indirect/EmploymentVehicle), evidence_refs (Vec<ControlEvidence>)
- [ ] ISC-3: ControlEvidence type with fields: source (WitnessStatement/CompaniesHouse/SubjectAccessRequest/PublicRecord), paragraph_ref (Option<String>), quote (String), strength (Strong/Moderate/Weak)
- [ ] ISC-4: Query get_hierarchy(entity_id) returns full corporate chain from leaf entity to ultimate parent, with ControlEvidence populated at each hierarchical level
- [ ] ISC-5: Rule 35 output: auto-generate respondent addition justification document from hierarchy data and control evidence, structured for tribunal submission
- [ ] ISC-6: Unit test: model Bylor (subsidiary of LOR, control_type EmploymentVehicle) to LOR (subsidiary of NNB, control_type Direct) to NNB (subsidiary of EDF, control_type Direct), with Sims witness statement, Bains witness statement, and Stage 3 disciplinary panel evidence at appropriate edges

## Dependencies

- `procedural_intel` canister for entity and hierarchy storage
- `case_hub` canister for case-level respondent aggregation
- `legal_analysis` canister for Rule 35 justification generation
- `awen_types` for shared type definitions and validation
- Companies House data for corporate relationship verification

## Evidence

- Companies House filings: Bylor Ltd, Laing O'Rourke plc, NNB Generation Company Ltd, EDF Energy
- Sims witness statement: reveals control relationships and reporting lines
- Bains witness statement: reveals employment vehicle arrangements
- Stage 3 disciplinary panel composition: individuals from multiple corporate entities
- Subject Access Request responses showing cross-entity HR involvement
- ET Rules 2024 Rule 35: addition of parties

## Out of Scope

- Automated Companies House API integration or live data fetching
- Director and officer personal liability analysis
- Piercing the corporate veil legal arguments
- Automated Rule 35 application drafting beyond justification content
- Historical corporate structure changes over time
- Shareholder relationship mapping beyond parent-subsidiary
