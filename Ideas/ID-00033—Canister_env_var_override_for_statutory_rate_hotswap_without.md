---
id: ID-00033
title: "Canister env var override for statutory rate hot-swap without upgrade"
status: draft
created: 2026-03-25
sources: [SR-00044, AL-00010]
phase: mate
domain: "uk-employment-law"
tags: [env-vars, statutory-rates, hot-swap, runtime-config, uk-caps]
scores:
  feasibility: 80
  novelty: 50
  impact: 60
  elegance: 75
---

## Description

UK employment statutory rates change annually (unfair dismissal cap, redundancy weekly pay cap, basic award maximum, etc.), and currently updating these values requires a canister code upgrade because the rates are compiled into `uk_caps.rs` as constants. ic-cdk 0.19 introduces canister environment variables (SR-00044) that can be set via the management canister without a code upgrade. This idea uses environment variables to override the effective dates and rate values at runtime: the canister reads `env::var("UK_CAPS_EFFECTIVE_DATE")` and `env::var("UK_CAPS_WEEKLY_PAY")` at query time, falling back to the compiled-in defaults if no override is set. This enables hot-swapping statutory rates the moment new government figures are published, without waiting for a code review, build, and deployment cycle. The existing `is_stale` effective-date checking logic (AL-00010) provides the safety net -- if an override sets a future effective date, `is_stale` prevents premature application.

## Provenance

Mating AL-00010 (`is_stale` effective date checking for statutory rate validity) with SR-00044 (canister environment variables in ic-cdk 0.19). AL-00010 already validates whether a rate is current or stale based on its effective date. SR-00044 provides a mechanism to change values at runtime without code changes. The cross-pollination is that `is_stale` becomes the safety valve for runtime overrides: you can push new rates via env vars at any time, and `is_stale` ensures they only take effect when the effective date has passed. This separates the "when to apply" decision (AL-00010) from the "how to deliver" mechanism (SR-00044).

## Connection

Primary beneficiary is `awen_uk_employment` (the shared library containing statutory calculations) and every canister that imports it (deadline_alerts for limitation periods, settlement for compensatory award caps, legal_analysis for statutory rate references). Changes required: (1) modify `uk_caps.rs` rate-lookup functions to check for env var overrides before returning compiled constants, (2) add env var names as constants (e.g., `AWEN_UK_WEEKLY_PAY_CAP`, `AWEN_UK_UNFAIR_DISMISSAL_CAP`), (3) update `is_stale` to work with both compiled and overridden effective dates, (4) document the env var override procedure for the operations team.

## Next Steps

1. Verify that canister environment variables are readable via `std::env::var` or the ic-cdk API in a WASM context. Build a minimal test canister that reads an env var and returns it via a query method.
2. Modify one rate function in `uk_caps.rs` (e.g., `weekly_pay_cap()`) to check for an env var override with fallback to the compiled constant, and write a unit test that sets the env var and verifies the override takes effect.
3. Design the operational workflow: who sets the env vars, how are they validated before deployment, and what monitoring detects if an override contains an incorrect value.
