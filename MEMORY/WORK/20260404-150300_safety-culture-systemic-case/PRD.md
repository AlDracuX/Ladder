---
task: Safety Culture Systemic Case Package
slug: 20260404-150300_safety-culture-systemic-case
effort: medium
phase: complete
progress: 0/5
mode: dev-job
started: 2026-04-04T15:00:00Z
updated: 2026-04-04T15:00:00Z
ladder_refs: [HY-00054, ID-00075]
domain: legal-strategy
canisters: [legal_analysis, evidence_vault]
---

## Context

Nuclear safety, disaster patterns, and regulatory capture experts combined present a systemic case: the same culture that led to Jason Waring's death retaliated against the claimant's Code 1 disclosure. ONR prosecutions corroborate. The systemic narrative connects the claimant's protected disclosure (Code 1 safety concern) to the broader pattern of safety culture failure at the nuclear site, culminating in a fatality and subsequent regulatory enforcement. This is the strongest thread for demonstrating that the detriment was because of the disclosure, not despite it. Impact score: 90.

## Scope

Build types and bundle assembly logic within `legal_analysis` and `evidence_vault` canisters to:

1. Model the systemic case bundle combining expert, regulatory, and incident evidence
2. Construct the causal narrative chain from disclosure to prosecution
3. Apply the Halet v Luxembourg public interest test
4. Generate a unified bundle document for tribunal submission

## Acceptance Criteria

- [ ] ISC-1: SystemicCaseBundle type -- bundle_id (u64), experts (Vec<ExpertReference> with expert_name, domain, key_findings), regulatory_evidence (Vec<RegulatoryItem> with body, action_type, date, outcome), incident_references (Vec<IncidentRef> with incident_id, description, date, casualties, causal_factors), created_at (u64)
- [ ] ISC-2: CausalNarrative -- ordered chain: Code 1 disclosure -> safety culture failures -> Waring death -> ONR prosecution -> whistleblower retaliation, modeled as Vec<NarrativeLink> with event, date, evidence_refs (Vec<EvidenceId>), causal_connection (String), next_link (Option<usize>), with validation that chain is unbroken
- [ ] ISC-3: Public interest test scorer -- Halet v Luxembourg factors (nature of information disclosed, authenticity, public interest served, damage to employer, motive of whistleblower, severity of sanction) applied to case facts, each factor scored 0.0-1.0 with evidence_refs, overall public interest score computed
- [ ] ISC-4: Bundle output -- single assembled document combining all systemic evidence for tribunal, structured as sections (executive summary, causal chain, expert evidence, regulatory evidence, incident evidence, public interest analysis), with evidence reference index
- [ ] ISC-5: Unit test -- assemble bundle from 4 expert briefs (nuclear safety, disaster patterns, regulatory capture, safety culture) + ONR prosecution + whistleblower response, verify causal chain links correctly, verify public interest scorer produces expected factor scores, verify bundle output contains all sections

## Dependencies

- Nuclear safety expert brief
- Disaster patterns expert brief
- Regulatory capture expert brief
- Safety culture expert brief
- ONR prosecution details and outcome
- Jason Waring incident documentation
- Code 1 disclosure documentation
- Halet v Luxembourg [GC] (App no. 21884/18) ECHR judgment

## Evidence

- Expert briefs (nuclear safety, disaster patterns, regulatory capture, safety culture)
- ONR prosecution records
- Jason Waring incident report and investigation
- Code 1 disclosure (claimant's protected disclosure)
- Bylor's response to whistleblower
- Halet v Luxembourg judgment (public interest test framework)

## Out of Scope

- Expert brief drafting or editing
- ONR prosecution document retrieval
- Tribunal submission formatting (ET-specific rules)
- Frontend presentation of systemic case
- Cross-examination preparation
