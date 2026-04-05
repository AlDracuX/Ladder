---
task: Rule 71 Response Tracker
slug: 20260404-160300_rule71-response-tracker
effort: small
phase: complete
progress: 0/5
mode: dev-job
started: 2026-04-04T16:03:00Z
updated: 2026-04-04T16:03:00Z
ladder_refs: [HY-00064, ID-00090]
domain: legal-procedural
canisters: [deadline_alerts, procedural_intel]
---

## Context

Two Rule 71 applications are outstanding with the Employment Tribunal. Application #1 was filed 19 November 2025 and has been outstanding for 134+ days with no response. Application #2 was filed 6 March 2026. While the ET Rules do not impose a statutory deadline on tribunal responses to Rule 71 applications, the overriding objective (Rule 2) requires cases to be dealt with "without undue delay." The absence of any response to Application #1 after 134+ days is itself a procedural failing that warrants escalation via HMCTS complaint. This PRD creates a tracking and escalation system that monitors outstanding applications, auto-flags at configurable thresholds, and generates complaint templates citing the specific rule and days outstanding.

## Scope

- Define Rule71Application type in deadline_alerts canister
- Implement escalation trigger system with configurable day thresholds
- Build HMCTS complaint template generator citing Rule 62 and days outstanding
- Create status query function returning all outstanding Rule 71 applications
- Unit tests modelling both current Rule 71 applications with known filing dates

## Acceptance Criteria

- [ ] ISC-1: Rule71Application type with fields: application_number (u32), filed_date, subject (String), days_outstanding (computed), escalation_history (Vec<EscalationEvent>)
- [ ] ISC-2: EscalationTrigger auto-flagging at 30/60/90/180 day thresholds with configurable threshold list
- [ ] ISC-3: HMCTSComplaintTemplate auto-generating complaint text citing Rule 62, application subject, and days outstanding
- [ ] ISC-4: Status query all_outstanding_rule71s() returning list with days_outstanding and next_escalation_date for each
- [ ] ISC-5: Unit test modelling both current Rule 71 applications: #1 filed 2025-11-19 (134+ days), #2 filed 2026-03-06

## Dependencies

- deadline_alerts canister for time-based tracking and threshold monitoring
- procedural_intel canister for escalation strategy persistence
- Current date computation for days_outstanding calculation

## Evidence

- **HY-00064**: Hypothesis that systematic tracking and escalation improves tribunal response times
- **ID-00090**: Idea for Rule 71 tracking with impact score 85
- Rule 71 Application #1: filed 2025-11-19, subject matter on record
- Rule 71 Application #2: filed 2026-03-06, subject matter on record
- ET Rules 2024, Rule 62 (written reasons) and Rule 71 (applications) -- procedural basis
- Rule 2 overriding objective -- "without undue delay" standard

## Out of Scope

- Other application types beyond Rule 71
- Automated filing of HMCTS complaints (template generation only)
- Integration with HMCTS online systems
- Tracking respondent applications or responses
- Frontend display of tracker dashboard
