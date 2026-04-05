---
task: Staged Filing Priority Scheduler
slug: 20260404-150900_staged-filing-scheduler
effort: small
phase: complete
progress: 0/5
mode: dev-job
started: 2026-04-04T15:00:00Z
updated: 2026-04-04T15:00:00Z
ladder_refs: [HY-00060, ID-00087]
domain: legal-procedural
canisters: [deadline_alerts, case_hub]
---

## Context

The EAT/ directory contains 12 STAGED documents awaiting sequenced filing across multiple authorities (Employment Tribunal, Employment Appeal Tribunal, ICO, SRA). Some documents have hard statutory deadlines -- miss them and the right to file is lost. Others have strategic timing considerations -- filing too early reveals strategy, filing too late loses momentum.

Filing dependencies add complexity: written reasons must be requested before supplementary grounds can be drafted; the skeleton argument depends on the respondent's answer; regulatory referrals should follow tribunal filings to avoid prejudicing the main proceedings. A priority scheduler that combines deadline urgency with strategic value, respects dependency chains, and outputs a clear filing queue with next-action dates ensures nothing is filed late and everything is filed in optimal sequence.

## Scope

- Define `StagedFiling` type in `deadline_alerts` with document metadata, target authority, and deadline
- Implement priority calculator combining deadline urgency and strategic value into a filing priority score
- Implement dependency chain: filing A must precede filing B with validation
- Generate filing queue output as an ordered list with next-action dates and CC requirements
- Unit tests modelling 12 current STAGED documents with known deadlines and dependencies

## Acceptance Criteria

- [ ] ISC-1: StagedFiling type with fields: document_name, target_authority (ET/EAT/ICO/SRA), deadline, priority, dependencies
- [ ] ISC-2: PriorityCalculator computing filing_priority from deadline_urgency multiplied by strategic_value
- [ ] ISC-3: DependencyChain enforcing filing order (e.g., written reasons request before supplementary grounds)
- [ ] ISC-4: Filing queue output as ordered list with next_action dates and CC requirements per filing
- [ ] ISC-5: Unit tests modelling 12 current STAGED documents with known deadlines, dependencies, and expected priority ordering

## Dependencies

- `deadline_alerts` canister for deadline tracking, urgency calculation, and alert generation
- `case_hub` canister for case lifecycle and filing status tracking
- `awen_types` for shared type definitions, date handling, and validation

## Evidence

- 12 STAGED documents in EAT/ directory of the Lawfare vault
- ET Rules 2024 (SI 2024/1155) for tribunal filing deadlines
- EAT Rules 1993 (SI 1993/2854) for appeal filing deadlines (Rule 3(1), Rule 37 4pm cutoff)
- ICO complaint procedure and timescales
- SRA referral procedure and timescales
- Case reference: 6013156/2024, EAT appeal: EA-2025-001649-AT

## Out of Scope

- Automated document submission to tribunals or regulators
- Document drafting or content generation
- Email notification system for approaching deadlines (handled by existing deadline_alerts functionality)
- Court fee payment tracking
- Respondent response monitoring after filing
