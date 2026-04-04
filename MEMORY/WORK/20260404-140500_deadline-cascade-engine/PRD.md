---
task: Deadline Cascade Engine
slug: 20260404-140500_deadline-cascade-engine
effort: medium
phase: ready
progress: 0/6
mode: dev-job
started: 2026-04-04T14:00:00Z
updated: 2026-04-04T14:00:00Z
ladder_refs: [HY-00043, ID-00067]
domain: legal-procedural
canisters: [deadline_alerts, case_hub]
---

## Context

Statutory deadlines compound in a dependent chain: ET1 filing triggers ACAS early conciliation extension, which shifts the ET3 response window, which feeds into Case Management Order deadlines, which cascade to hearing dates. EAT appeals have a strict 42-day window from the date written reasons are sent. Rule 71 reconsideration has no statutory deadline but the ET must respond "without undue delay."

Manual tracking of these interdependencies is error-prone and dangerous. Missing one deadline in the chain silently invalidates downstream dates. In case 6013156/2024, multiple deadline interactions exist: the EAT appeal window (EA-2025-001649-AT) runs from written reasons, the strike-out hearing was vacated, and the final hearing is set for July 6-10. Auto-calculation of cascading deadlines with extension awareness prevents catastrophic missed filings.

## Scope

- Define `DeadlineCascade` type in `deadline_alerts` with trigger events, base periods, extensions, and computed deadlines
- Implement ACAS early conciliation extension calculator using statutory calendar-day formula
- Implement EAT 42-day appeal window auto-computation from written reasons date
- Build cascade visualization data structure showing dependent deadlines as a waterfall with critical path highlighting
- Integrate with `deadline_alerts` canister to fire warnings at 14/7/3/1 day marks before each computed deadline
- Connect cascade events to `case_hub` for cross-case deadline awareness
- Unit tests with real dates proving computation accuracy

## Acceptance Criteria

- [ ] ISC-1: DeadlineCascade type with fields: trigger_event, base_period, extensions (Vec<Extension> covering ACAS/judicial/statutory), computed_deadline, status
- [ ] ISC-2: Extension calculator: ACAS early conciliation adds calendar days per statutory formula (day after EC certificate to original limitation date, then extended by same period)
- [ ] ISC-3: EAT appeal window: 42 days from written reasons date, auto-computed with weekend/bank-holiday awareness
- [ ] ISC-4: Cascade visualization: dependent deadlines represented as waterfall data structure with critical path identification
- [ ] ISC-5: Alert integration: deadline_alerts canister fires warnings at 14/7/3/1 day marks before each computed deadline in the cascade
- [ ] ISC-6: Unit tests with real dates: written reasons sent 1 Apr 2026 produces EAT deadline 13 May 2026 (42 calendar days)

## Dependencies

- `deadline_alerts` canister for alert firing and deadline storage
- `case_hub` canister for cross-case deadline aggregation
- `awen_types` for shared deadline and date types
- `awen_uk_employment` for statutory period calculations

## Evidence

- ET Rules 2024 (SI 2024/1155) -- deadline computation rules
- EAT Rules 1993 (SI 1993/2854) -- Rule 3(1) 42-day appeal window
- ACAS Early Conciliation statutory extension formula (ERA 1996 s207B)
- Case 6013156/2024 timeline: vacated strike-out, final hearing Jul 6-10
- EAT appeal EA-2025-001649-AT

## Out of Scope

- Calendar UI rendering or interactive date pickers
- Email or SMS notification delivery
- ACAS early conciliation initiation workflow
- Integration with external court listing systems
- Bank holiday data sourcing (assumes provided via configuration)
