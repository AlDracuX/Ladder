---
task: Written Reasons Compliance Auditor
slug: 20260404-160400_written-reasons-compliance-auditor
effort: small
phase: ready
progress: 0/5
mode: dev-job
started: 2026-04-04T16:04:00Z
updated: 2026-04-04T16:04:00Z
ladder_refs: [HY-00065, ID-00091]
domain: legal-procedural
canisters: [procedural_intel, deadline_alerts]
---

## Context

Rule 62 of the ET Rules 2024 requires written reasons to be provided "as soon as reasonably practicable" after oral judgment. EJ Leverson's written reasons for the 4 March 2025 strike-out decision were not issued until 1 April 2025 -- a 27-day delay. Whether this delay is compliant depends on what is "reasonably practicable," but 27 days for a strike-out decision (which should be a relatively straightforward judgment) raises questions. This PRD creates a compliance auditing framework that tracks all judgments for timeliness, identifies systemic delay patterns across multiple judgments, and generates structured evidence for HMCTS complaints when non-compliance is detected. The auditor makes delay patterns visible and actionable.

## Scope

- Define JudgmentTimeline type tracking oral judgment to written reasons dates
- Implement configurable compliance thresholds with default benchmarks
- Build pattern detection across multiple judgments for systemic delay identification
- Create HMCTS complaint evidence output with structured dates and comparisons
- Unit tests modelling EJ Leverson 27-day delay and EJ Midgley timeline

## Acceptance Criteria

- [ ] ISC-1: JudgmentTimeline type with fields: judgment_date_oral, written_reasons_date, days_elapsed (computed), compliant (bool based on threshold)
- [ ] ISC-2: ComplianceThreshold configurable with defaults: 14 days = reasonable, 21 days = borderline, 28+ days = potential non-compliance
- [ ] ISC-3: Pattern detection function analysing multiple JudgmentTimeline records to identify systemic delay (mean delay, max delay, count above threshold)
- [ ] ISC-4: HMCTS complaint evidence output with structured fields: judge_name, case_number, judgment_type, oral_date, written_date, days_elapsed, comparisons to other judgments
- [ ] ISC-5: Unit test modelling EJ Leverson 27-day delay (4 Mar to 1 Apr 2025) and EJ Midgley timeline for comparison

## Dependencies

- procedural_intel canister for judgment tracking and pattern storage
- deadline_alerts canister for compliance threshold monitoring
- Calendar date arithmetic for days_elapsed computation

## Evidence

- **HY-00065**: Hypothesis that systematic compliance auditing reveals actionable procedural failures
- **ID-00091**: Idea for written reasons compliance auditor with impact score 85
- EJ Leverson: oral judgment 4 March 2025, written reasons 1 April 2025 (27 days)
- ET Rules 2024, Rule 62 -- "as soon as reasonably practicable" requirement
- HMCTS complaint procedures for judicial delay

## Out of Scope

- Challenging the substance of written reasons (this tracks timeliness only)
- Automated HMCTS complaint filing (output generation only)
- Judicial conduct complaints beyond timeliness
- Comparison with other tribunal regions or national statistics
- Frontend display of compliance dashboard
