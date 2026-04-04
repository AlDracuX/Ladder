---
id: HY-00036
title: "Rates oracle canister serving 2025-26 caps via query calls eliminates all hardcoded references in consumer canisters"
status: draft
created: 2026-03-27
idea: ID-00013
tags: [oracle, governance, statutory-rates, pub-sub, uk-employment]
prediction: "A rates oracle canister serving uk_caps constants via query endpoints enables settlement and legal_analysis to fetch rates at runtime, reducing hardcoded uk_caps::* imports in canister code to zero"
metric: "Number of direct uk_caps::* constant imports in canister source files (currently 2 canisters: settlement, legal_analysis)"
success_criteria: "After migration, grep for 'uk_caps::' in src/ returns 0 matches in canister code; all rate values served by oracle query; annual rate update requires only oracle data push, not code deployment"
---

## Hypothesis

If we create a rates oracle canister that stores versioned statutory rate data (currently in packages/awen_types/src/uk_caps.rs) and exposes it via query endpoints, then settlement and legal_analysis can fetch rates at runtime instead of importing compile-time constants, reducing direct uk_caps::* imports in canister code from 2 canisters to 0 and making annual rate updates a data operation rather than a code deployment.

## Rationale

Currently, uk_caps.rs defines compile-time constants (BASIC_AWARD_MAX_PENCE=2_100_000, COMPENSATORY_AWARD_CAP_PENCE=11_822_300, etc.) imported by settlement/src/types.rs and legal_analysis/src/lib.rs. When statutory rates change annually, this requires a code change, recompilation of all dependent canisters, and redeployment. A rates oracle canister would store these values in stable storage with effective_date metadata, allowing: (1) annual updates via a single admin call, (2) historical rate lookups for cases spanning rate changes, (3) consumer canisters to query rates at runtime. The existing is_stale() function in uk_caps.rs already acknowledges that rates expire -- the oracle formalizes this.

## Testing Plan

1. Baseline: grep 'uk_caps::' in src/ to count current direct imports (expect 2 canisters)
2. Create oracle canister with StableBTreeMap<EffectiveDate, StatutoryRates> and query endpoints
3. Seed oracle with 2025/26 rates matching current uk_caps.rs constants
4. Modify settlement to fetch rates via Call::bounded_wait to oracle instead of compile-time import
5. Modify legal_analysis similarly
6. PocketIC test: deploy oracle + settlement, verify settlement calculations match pre-migration results
7. Test rate update: push 2026/27 rates to oracle, verify settlement uses new rates without redeployment

## Success Criteria

- Zero uk_caps::* imports in canister source code (src/ directory)
- All settlement and legal_analysis calculations produce identical results pre and post migration
- Annual rate update requires only one admin call to oracle, no canister redeployment
- Oracle query latency adds less than 1ms to settlement calculations
- Historical rate lookup works (query with past effective_date returns correct rates)

## Risks

- Oracle canister becomes a runtime dependency for settlement and legal_analysis -- if oracle traps, both fail
- Query call overhead per calculation may be unacceptable for batch operations (e.g., calculating 100 awards)
- Rate caching in consumer canisters introduces staleness window
- uk_caps.rs serves dual purpose: compile-time validation in tests AND runtime values -- oracle only replaces runtime use
