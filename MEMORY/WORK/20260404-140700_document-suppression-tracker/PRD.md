---
task: Document Suppression Tracker
slug: 20260404-140700_document-suppression-tracker
effort: small
phase: ready
progress: 0/5
mode: dev-job
started: 2026-04-04T14:00:00Z
updated: 2026-04-04T14:00:00Z
ladder_refs: [HY-00046, ID-00068]
domain: legal-evidence
canisters: [evidence_vault, legal_analysis]
---

## Context

In case 6013156/2024, the disciplinary invitation letter was not produced by the respondent for 465 days despite 6 formal disclosure requests. This pattern of document suppression -- where a party fails to produce clearly relevant documents over an extended period despite repeated requests -- is a significant evidential issue. It may indicate deliberate concealment, support adverse inference applications, and trigger regulatory obligations under data protection law.

This feature tracks outstanding document requests by age and request frequency, computing a suppression urgency score. When configurable thresholds are breached, it auto-generates ICO complaint draft templates, providing a structured escalation pathway from disclosure request to regulatory complaint.

## Scope

- Define `DocumentRequest` type in `evidence_vault` tracking document name, request history, and responses
- Implement `SuppressionScore` calculation: days_outstanding multiplied by request_count for urgency weighting
- Build age-based alert thresholds at 30/60/90/180/365 days with escalation recommendations
- Create ICO complaint draft template auto-generation when threshold is breached
- Store suppression tracking data with full audit trail in `evidence_vault`
- Unit tests modelling the disciplinary invitation letter suppression timeline

## Acceptance Criteria

- [ ] ISC-1: DocumentRequest type with fields: document_name, first_requested (date), request_count (u32), responses (Vec<Response> with date and content summary for each)
- [ ] ISC-2: SuppressionScore calculation: days_outstanding multiplied by request_count equals urgency weight, with derived priority ranking
- [ ] ISC-3: Age-based alerts: configurable thresholds at 30/60/90/180/365 day marks with escalation recommendations (reminder/formal-request/tribunal-application/ICO-complaint)
- [ ] ISC-4: ICO escalation template: auto-generate ICO complaint draft containing document name, request timeline, response summary, and data protection grounds when threshold is breached
- [ ] ISC-5: Unit tests with disciplinary invitation letter timeline: first requested date, 6 requests over 465 days, suppression score calculation, and ICO template generation trigger

## Dependencies

- `evidence_vault` canister for document request storage and audit trail
- `legal_analysis` canister for suppression analysis and template generation
- `awen_types` for shared type definitions and validation

## Evidence

- Disciplinary invitation letter: 6 formal requests over 465 days without production
- Disclosure request correspondence timeline in case 6013156/2024
- ICO complaint template requirements (Data Protection Act 2018, UK GDPR Article 15)
- ET Rules 2024 disclosure obligations

## Out of Scope

- Automated ICO complaint submission
- Email integration for sending disclosure requests
- PDF generation of ICO complaint documents
- Integration with ICO online complaint portal
- Tracking respondent solicitor communications
