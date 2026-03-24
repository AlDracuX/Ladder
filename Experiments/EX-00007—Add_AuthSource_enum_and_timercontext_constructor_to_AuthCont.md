---
id: EX-00007
title: "Add AuthSource enum and timer_context constructor to AuthContext"
status: testing
created: 2026-03-24
hypothesis: HY-00014
algorithm:
tags: [authcontext, timer, audit, security, awen_types]
methodology: "Direct code modification with workspace-wide compilation validation"
duration: "30 minutes"
success_criteria: "4 AuthContext constructors produce 4 distinct AuthSource values; cargo check --workspace passes; nextest -p awen_types passes"
---

## Objective

Add AuthSource enum and timer_context constructor to AuthContext to enable distinguishable audit log entries for timer-initiated vs user/controller operations.

## Methodology

1. Add `AuthSource` enum (User, Controller, Timer, Anonymous) to `packages/awen_types/src/security.rs`
2. Add `pub source: AuthSource` field to `AuthContext` struct
3. Update all existing constructors to set appropriate source variant
4. Add `timer_context()` constructor with `AuthSource::Timer`
5. Update all 40 struct literal construction sites across 5 downstream files
6. Write unit test asserting all 4 contexts produce distinct source values
7. Validate with `cargo check --workspace` and `cargo nextest run -p awen_types`

## Setup

- Workspace: `/mnt/media_backup/PROJECTS/awen-network-canisters`
- Target file: `packages/awen_types/src/security.rs`
- Blast radius: 40 struct literal sites in 5 files (deadline_alerts: 31, case_hub: 3, procedural_intel: 2, case_timeline: 2, security.rs: 2)

## Algorithm

N/A (no Ladder Algorithm involved)

## Success Criteria

- `AuthContext::for_test().source == AuthSource::User`
- `AuthContext::controller_for_test().source == AuthSource::Controller`
- `AuthContext::timer_context().source == AuthSource::Timer`
- `AuthContext::anonymous_submission().source == AuthSource::Anonymous`
- `cargo check --workspace` clean
- `cargo nextest run -p awen_types` all pass

## Data Collection

- Compilation output from `cargo check --workspace`
- Test results from `cargo nextest run -p awen_types`

## Results

(To be filled after execution)

## Analysis

(To be filled after execution)

## Next Steps

(To be filled after execution)
