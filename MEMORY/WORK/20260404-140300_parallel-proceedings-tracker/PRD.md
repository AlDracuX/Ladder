---
task: Parallel Proceedings Tracker
slug: 20260404-140300_parallel-proceedings-tracker
effort: medium
phase: ready
progress: 0/6
mode: dev-job
started: 2026-04-04T14:00:00Z
updated: 2026-04-04T14:00:00Z
ladder_refs: [HY-00047, ID-00065]
domain: legal-procedural
canisters: [deadline_alerts, case_hub, procedural_intel]
---

## Context

Five parallel proceedings are running simultaneously, each with different deadlines, dependencies, and strategic interactions:

1. **Rule 71 #1** (EJ Midgley) -- reconsideration application
2. **Rule 71 #2** (EJ Leverson) -- reconsideration of written reasons
3. **EA-2025-001649-AT** -- amendment appeal (EAT)
4. **EA-2026-000371** -- strike-out appeal (EAT)
5. **Rule 21** -- expedition application

Managing these in isolation risks missing critical dependencies -- for example, the outcome of EA-2026-000371 may render Rule 71 #2 moot, and the Rule 21 expedition application interacts with the final hearing timeline. A structured tracker with dependency mapping and strategic interaction alerts prevents procedural missteps.

## Scope

- Define `Proceeding` and `ProceedingDependency` types across `case_hub` and `procedural_intel`
- Implement deadline auto-calculation from filing date plus statutory period
- Build strategic interaction alert system for dependency-driven notifications
- Create status dashboard query returning all proceedings with next actions
- Integrate with `deadline_alerts` for automated deadline management
- Unit tests with all 5 current proceedings and their known dependencies

## Acceptance Criteria

- [ ] ISC-1: Proceeding type with fields: case_ref, jurisdiction (ET/EAT), type (reconsideration/appeal/review), status, key_dates
- [ ] ISC-2: ProceedingDependency type with fields: proceeding_a, proceeding_b, dependency_type (blocks/informs/supersedes)
- [ ] ISC-3: Deadline auto-calculation from filing_date + statutory_period for each proceeding type
- [ ] ISC-4: Strategic interaction alerts: e.g. "EA-2026-000371 outcome may render Rule 71 #2 moot"
- [ ] ISC-5: Status dashboard query: all_proceedings_status() returning status, next_action, and next_deadline per proceeding
- [ ] ISC-6: Unit tests with all 5 current proceedings and their known dependencies

## Dependencies

- `deadline_alerts` canister for deadline management and notification triggers
- `case_hub` canister for case lifecycle and multi-case aggregation
- `procedural_intel` canister for strategic pattern storage and interaction analysis
- `awen_types` for shared type definitions
- `awen_uk_employment` for statutory period calculations

## Evidence

- Rule 71 #1: EJ Midgley reconsideration
- Rule 71 #2: EJ Leverson reconsideration (written reasons, 1 Apr 2026)
- EA-2025-001649-AT: Amendment appeal (EAT)
- EA-2026-000371: Strike-out appeal (EAT)
- Rule 21 expedition application
- Case reference: 6013156/2024

## Out of Scope

- Automated legal strategy recommendations
- Calendar integration or external notification systems
- Document drafting for any proceeding
- Historical proceedings that have concluded
- EAT procedural rules implementation (use existing `awen_uk_employment` statutory periods)
