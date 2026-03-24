---
id: RE-00003
title: "FALSE POSITIVE: 5 canister idempotency gaps are read-only queries, not state mutations"
status: complete
created: 2026-03-22
experiment: EX-00002
outcome: failure
tags: [false-positive, idempotency, pollinator]
loops_to: [SR-00027]
---

## Summary

HY-00003 is **moot**. The 5 canisters flagged as "missing idempotency" all make read-only inter-canister queries, not state-modifying writes. Idempotency keys are only needed for calls that mutate state.

## Data

| Canister | Call:: sites | Nature | Idempotency needed? |
|----------|-------------|--------|-------------------|
| evidence_vault | vetkd_encrypted_key | Read (mgmt canister) | No |
| mcp_gateway | dynamic dispatch | Proxy/routing | No |
| case_hub | get_stats, get_active_deadlines | Read queries | No |
| legal_analysis | get_case_summary, get_upcoming_hearings, get_suppression_profile, list_deadlines, get_stats, search_metadata, v1_chat | Read queries + LLM call | No |
| procedural_intel | add_deadline (TODO, commented out) | Not yet implemented | N/A |

## Analysis

The pollinator script (`scripts/ladder-pollinate.sh`) uses `grep -rl 'Call::'` to detect inter-canister calls and `grep -rl 'idempotency'` to detect idempotency usage. This is a **false positive** because:

1. `grep` cannot distinguish read-only queries from state-modifying writes
2. Read-only queries (`get_stats`, `get_case_summary`) don't need idempotency
3. Only calls that mutate remote state (like `add_event`, `store_evidence`) need idempotency

The canisters that DO need idempotency (`case_timeline`, `deadline_alerts`) already have it.

## Outcome

**HY-00003 refuted.** The idempotency pattern is already correctly applied where needed.

## Loop

- [x] New source identified → SR-00027 (pollinator false positive)
- [x] New idea suggested → Improve pollinator to distinguish reads from writes
- [ ] Algorithm validated → AL-00002 (saga) is correctly scoped to write-path canisters

## Lessons Learned

1. Grep-based pattern detection cannot understand code semantics
2. The LLM-powered cognitive phases (DREAM/STEAL/MATE) should replace the bash pollinator for gap analysis
3. Always read the actual Call:: context before concluding a pattern is missing
