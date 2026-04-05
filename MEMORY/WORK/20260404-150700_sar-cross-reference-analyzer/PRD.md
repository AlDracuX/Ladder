---
task: SAR Cross-Reference Analyzer
slug: 20260404-150700_sar-cross-reference-analyzer
effort: medium
phase: complete
progress: 0/6
mode: dev-job
started: 2026-04-04T15:00:00Z
updated: 2026-04-04T15:00:00Z
ladder_refs: [HY-00058, ID-00082]
domain: legal-intel
canisters: [evidence_vault, legal_analysis]
---

## Context

Multiple Subject Access Request (SAR) responses have been received from different respondent entities, each covering overlapping time periods but disclosing different documents. Bylor/LOR SAR1 breached the statutory 30-day deadline. SAR2 via Bains' SharePoint yielded 85 pages of previously undisclosed material. NNB's DSAR response claimed an extension.

Cross-referencing these SAR responses reveals critical gaps: documents present in one SAR but absent from another covering the same period indicate deliberate withholding or inadequate search. Factual claims in one SAR response may directly contradict claims in another. The compliance timeline -- statutory 30-day deadlines, breach dates, extension claims -- constitutes a separate ICO referral pathway and adds regulatory pressure to the settlement matrix.

Systematic cross-referencing transforms scattered SAR responses into a coherent picture of what was disclosed, what was withheld, and where the respondents' accounts contradict each other.

## Scope

- Define `SARResponse` type in `evidence_vault` for tracking each SAR submission and response
- Define `DocumentCrossRef` type for mapping document presence/absence across SAR responses
- Implement withheld document detector: documents in one SAR absent from another covering the same period
- Implement contradiction finder: factual claims in one SAR contradicting claims in another
- Implement compliance timeline with statutory 30-day deadline tracking and breach flagging
- Unit tests modelling SAR1 vs SAR2 vs NNB-DSAR responses with identified gaps

## Acceptance Criteria

- [ ] ISC-1: SARResponse type with fields: entity, reference, date_requested, date_received, document_count, status
- [ ] ISC-2: DocumentCrossRef type with fields: document_id, present_in (Vec of SAR references), absent_from (Vec of SAR references), significance
- [ ] ISC-3: WithheldDocumentDetector identifying documents in one SAR but absent from another covering the same time period
- [ ] ISC-4: ContradictionFinder detecting factual claims in one SAR response that contradict claims in another
- [ ] ISC-5: Compliance timeline tracking statutory 30-day deadline per SAR with breach flagging and extension validation
- [ ] ISC-6: Unit tests modelling SAR1 vs SAR2 vs NNB-DSAR responses with 3+ identified document gaps and 1+ contradiction

## Dependencies

- `evidence_vault` canister for SAR response storage and document tracking
- `legal_analysis` canister for contradiction detection and gap analysis
- `awen_types` for shared type definitions and validation

## Evidence

- Bylor/LOR SAR1: breached statutory 30-day deadline, incomplete disclosure
- SAR2 via Bains SharePoint: 85 pages of previously undisclosed material
- NNB DSAR: extension claimed, response scope under review
- ICO statutory framework: Data Protection Act 2018, UK GDPR Art 15, 30-day deadline (extendable by 2 months for complex requests)
- Case reference: 6013156/2024

## Out of Scope

- Automated document content extraction or OCR from SAR response PDFs
- ICO complaint drafting (separate filing action)
- Full-text document storage within canisters (only metadata and cross-references)
- SAR response redaction analysis
- Automated SAR submission to respondents
