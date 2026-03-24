---
id: RE-00012
title: "RESULT: 85 of 263 query endpoints properly filter by caller (69 need fix)"
status: complete
created: 2026-03-24
experiment: EX-00011
outcome: hypothesis_partially_supported
tags: [security, authorization, query-auth, cross-user-leakage, audit]
loops_to: [SR-new-query-auth-gaps]
---

## Summary

Static analysis audit of all 263 `#[query]` endpoints across 9 canisters reveals that **26.2% (69 endpoints) return user/case-specific data without caller verification**. HY-00005 is supported as a necessary fix -- mandatory QueryAuth would eliminate these gaps -- but the current state shows significant cross-user data leakage vectors.

## Data

| Canister | Total | SAFE | NEEDS_FIX | N/A | Fix Rate |
|----------|-------|------|-----------|-----|----------|
| evidence_vault | 40 | 22 | 5 | 13 | 81.5% |
| case_hub | 21 | 12 | 3 | 6 | 80.0% |
| case_timeline | 24 | 12 | 7 | 5 | 63.2% |
| deadline_alerts | 22 | 9 | 2 | 11 | 81.8% |
| legal_analysis | 21 | 4 | 5 | 12 | 44.4% |
| mcp_gateway | 12 | 1 | 2 | 9 | 33.3% |
| procedural_intel | 75 | 8 | 38 | 29 | 17.4% |
| reference_shield | 23 | 3 | 6 | 14 | 33.3% |
| settlement | 25 | 14 | 1 | 10 | 93.3% |
| **TOTAL** | **263** | **85** | **69** | **109** | **55.2%** |

Fix Rate = SAFE / (SAFE + NEEDS_FIX) -- percentage of user-data endpoints that properly filter.

### Critical Risk Endpoints

1. **mcp_gateway.get_request_history** -- all users' tool invocations exposed
2. **reference_shield.get_credentials_for_holder** -- enumerate any user's credentials
3. **legal_analysis.get_et1_form / get_schedule** -- sensitive legal filings exposed
4. **evidence_vault.get_consent_status** -- medical consent records accessible
5. **procedural_intel** (38 endpoints) -- entire strategic analysis pipeline unprotected

## Analysis

### HY-00005 Assessment

The hypothesis "Mandatory QueryAuth on all query endpoints eliminates cross-user data leakage" is **supported with qualification**:

1. **SUPPORTED**: 69 endpoints currently leak data that QueryAuth would prevent
2. **QUALIFICATION**: 109 endpoints legitimately don't need caller auth (system stats, pure computations, public entity data, static reference data)
3. **NUANCE**: Not ALL query endpoints need auth -- only those accessing stored user/case data. A blanket mandate would over-restrict the 109 N/A endpoints.

### Recommended Approach

Instead of mandatory QueryAuth on ALL queries, implement: **Mandatory QueryAuth on all queries that access case-specific or user-specific stored data**. This targets exactly the 69 NEEDS_FIX endpoints while leaving pure computations, system metrics, and public entity data unrestricted.

### Worst Offender: procedural_intel

- 38/75 endpoints (50.7%) need fixes
- The entire "suppression warfare" analysis block (lines 4575-6700) has zero caller verification
- These endpoints take case_id parameters and read stored case data without auth
- Likely added in bulk during feature development without the auth pattern

### Best Practice: settlement canister

- 14/15 user-data endpoints properly filter (93.3%)
- Consistent use of AuthContext::from_ic() pattern
- Owner checks on sensitive operations (compare_offer_to_schedule)

## Outcome

**Hypothesis partially supported.** QueryAuth is necessary for the 69 vulnerable endpoints but should not be mandatory for all 263 endpoints -- system-wide data, pure computations, and intentionally public endpoints should remain unrestricted.

## Loop

- [x] New source identified (SR: 69 query endpoints lack caller auth -- detailed per-canister inventory)
- [x] New idea suggested (ID: Implement a compile-time lint that detects #[query] functions accessing stable storage without AuthContext)
- [x] New hypothesis formed (HY: Adding AuthContext to the 69 NEEDS_FIX endpoints will pass integration tests verifying cross-user isolation)
- [ ] Algorithm validated
- [ ] Problem redefined

## Lessons Learned

1. Security posture varies dramatically by canister -- settlement is 93% secured while procedural_intel is only 17%
2. The `AuthContext::from_ic()` / `_impl(auth, ...)` pattern works well when applied consistently -- the problem is inconsistent application
3. Bulk-added feature endpoints (procedural_intel analysis functions) are the highest risk -- they likely skipped the auth pattern during rapid development
4. Case_id is not sufficient authorization -- it's a public identifier, not a secret. Only caller identity verification prevents cross-user access
5. Pure computation endpoints that accept all inputs as parameters (not looking up stored data) are genuinely safe without auth
