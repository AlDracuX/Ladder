---
id: EX-00037
title: "Add idempotency keys to all 23 Call bounded_wait sites and verify zero unguarded sites remain"
status: draft
created: 2026-03-27
hypothesis: HY-00029
algorithm: AL-00002
tags: [idempotency, saga, cross-canister, propagation, bounded-wait, deduplication]
methodology: "Audit all 23 Call::bounded_wait sites across 9 canisters, classify as read-only or state-modifying, add IdempotencyKey to each state-modifying site, write replay tests proving 3x call = 1x mutation, re-audit for zero unguarded sites"
duration: "8 hours"
success_criteria: "Zero unguarded Call::bounded_wait sites across all 9 canisters; replay tests pass for all 5 newly-guarded canisters; stable memory overhead < 1KB per key store"
---

## Objective

Apply the AL-00002 saga + idempotency pattern (proven in case_timeline and deadline_alerts) to the remaining 5 canisters (evidence_vault, mcp_gateway, legal_analysis, procedural_intel, case_hub), reducing unguarded inter-canister `Call::bounded_wait` sites from 23 to zero. Verify via replay tests that sending the same request 3 times with the same idempotency key produces exactly 1 state mutation.

## Methodology

1. **Baseline audit: count and classify all Call::bounded_wait sites**
   ```bash
   cd /mnt/media_backup/PROJECTS/awen-network-canisters
   # Count all sites
   grep -rn 'Call::bounded_wait' src/ | wc -l
   # Expected: 23 total across 9 files

   # Classify each site (file, line, calling function, target canister, method, read-only vs mutating)
   grep -rn 'Call::bounded_wait' src/ --include='*.rs' | while read line; do
     echo "$line"
   done > /tmp/ex-00037-baseline.txt

   # Count already-guarded sites (have IdempotencyKey in scope)
   # Expected: case_timeline and deadline_alerts sites are guarded
   grep -B10 'Call::bounded_wait' src/case_timeline/src/lib.rs | grep -c 'idempotency'
   grep -B10 'Call::bounded_wait' src/deadline_alerts/src/lib.rs | grep -c 'idempotency'
   ```

2. **Classify each unguarded site as read-only or state-modifying**
   ```bash
   # For each of the ~18 unguarded sites, check the target method:
   #   - Query methods (read-only): do NOT need idempotency keys
   #   - Update methods (state-modifying): MUST have idempotency keys
   # Document classification in a table
   # Expected breakdown per canister:
   #   evidence_vault: 1 site (vetkd_public_key -- read-only query)
   #   mcp_gateway: 2 sites (dispatch calls -- state-modifying)
   #   legal_analysis: 10 sites (cross-canister analysis calls -- classify each)
   #   procedural_intel: 2 sites (intel queries -- classify each)
   #   case_hub: 3 sites (saga orchestration -- state-modifying)
   ```

3. **For each state-modifying site, add IdempotencyKey parameter**
   ```bash
   git worktree add /tmp/ex-00037 -b experiment/ex-00037-saga-idempotency
   cd /tmp/ex-00037
   # Pattern per site:
   # a) Add IdempotencyKey parameter to the calling function
   # b) Call awen_types::idempotency::check_processed() before the Call::bounded_wait
   # c) If already processed, return cached response
   # d) After successful call, store_processed(key, response_hash, ttl)
   # e) Use awen_types::idempotency::ProcessedRequest and existing StableBTreeMap pattern
   ```

4. **Add IDEMPOTENCY_STORE StableBTreeMap to each canister that lacks one**
   ```bash
   # For each of evidence_vault, mcp_gateway, legal_analysis, procedural_intel, case_hub:
   # Check if IDEMPOTENCY_STORE already exists (case_timeline and deadline_alerts have it)
   grep -rn 'IDEMPOTENCY_STORE\|idempotency_store' src/evidence_vault/ src/mcp_gateway/ \
     src/legal_analysis/ src/procedural_intel/ src/case_hub/
   # Add thread_local StableBTreeMap<String, ProcessedRequest, Memory> if missing
   # Allocate next available MemoryManager segment
   ```

5. **Write replay tests for each newly-guarded canister**
   ```bash
   # For each canister, one test per state-modifying Call::bounded_wait site:
   # 1. Call the function with IdempotencyKey("test-key-001")
   # 2. Record the result and store state snapshot
   # 3. Call again with same IdempotencyKey("test-key-001")
   # 4. Assert result matches first call
   # 5. Assert store state has NOT changed (no duplicate mutation)
   # 6. Call third time with same key
   # 7. Assert same result, same state
   # 8. Call with different key IdempotencyKey("test-key-002")
   # 9. Assert state DID change (different key = new operation)
   cargo nextest run -E 'test(/replay_idempotency/)'
   ```

6. **Re-audit: verify zero unguarded sites**
   ```bash
   # Final count of unguarded sites
   # For each Call::bounded_wait, verify IdempotencyKey is in the calling function's arguments
   # OR the site is classified as read-only (query, no state mutation)
   grep -rn 'Call::bounded_wait' src/ | wc -l
   # Cross-reference with classification table
   # Target: 0 unguarded state-modifying sites
   ```

7. **Measure stable memory overhead per idempotency store**
   ```bash
   # For each canister with new IDEMPOTENCY_STORE:
   # Insert 100 processed requests, measure StableBTreeMap memory usage
   # Target: < 1KB per key (key string + ProcessedRequest ~ 100-200 bytes per entry)
   cargo nextest run -E 'test(/idempotency_memory_overhead/)'
   ```

8. **Run full test suite**
   ```bash
   mise run nextest
   ```

## Setup

- Working directory: `/mnt/media_backup/PROJECTS/awen-network-canisters`
- Branch: `experiment/ex-00037-saga-idempotency` (git worktree at `/tmp/ex-00037`)
- Existing infrastructure:
  - `packages/awen_types/src/idempotency.rs` -- ProcessedRequest type, check/store functions
  - `packages/awen_types/src/saga.rs` -- SagaJournal, SagaStep, SagaStatus types
  - case_timeline, deadline_alerts already use the pattern (reference implementations)
- Target canisters (5):
  - `src/evidence_vault/src/lib.rs` -- 1 Call::bounded_wait site (vetkd)
  - `src/mcp_gateway/src/lib.rs` -- 2 Call::bounded_wait sites
  - `src/legal_analysis/src/lib.rs` -- 10 Call::bounded_wait sites
  - `src/procedural_intel/src/lib.rs` -- 1 Call::bounded_wait site + 1 in sequences.rs
  - `src/case_hub/src/lib.rs` -- 3 Call::bounded_wait sites
- Total sites: 23 across 9 files (some canisters have multiple files)

## Algorithm

AL-00002 (saga + idempotency pattern). Each inter-canister call that modifies state is wrapped with:
1. Generate or accept an IdempotencyKey (caller-provided or auto-generated)
2. Check IDEMPOTENCY_STORE: if key exists and not expired, return cached response
3. Execute Call::bounded_wait
4. On success: store ProcessedRequest with key, response hash, TTL
5. Return response

This ensures at-most-once semantics for state mutations across canister boundaries.

## Success Criteria

- [ ] All 23 Call::bounded_wait sites catalogued with file, line, function, and read-only/mutating classification
- [ ] Each state-modifying site has IdempotencyKey parameter added
- [ ] Each target canister has IDEMPOTENCY_STORE StableBTreeMap allocated
- [ ] Replay test (3x same key = 1x mutation) passes for evidence_vault
- [ ] Replay test passes for mcp_gateway (2 sites)
- [ ] Replay test passes for legal_analysis (state-modifying sites only)
- [ ] Replay test passes for procedural_intel
- [ ] Replay test passes for case_hub (3 sites)
- [ ] Final audit: zero unguarded state-modifying Call::bounded_wait sites
- [ ] Stable memory overhead < 1KB per idempotency key entry
- [ ] All existing tests pass without modification

## Data Collection

| Metric | Target | Actual |
|--------|--------|--------|
| Total Call::bounded_wait sites (baseline) | 23 | TBD |
| Sites already guarded (case_timeline, deadline_alerts) | ~5 | TBD |
| Sites classified as read-only | TBD | TBD |
| Sites requiring idempotency (state-modifying) | TBD | TBD |
| Sites guarded after experiment | all mutating | TBD |
| Unguarded state-modifying sites (after) | 0 | TBD |
| Replay tests written | 1 per mutating site | TBD |
| Replay tests passing | 100% | TBD |
| Memory per idempotency entry (bytes) | < 1,024 | TBD |
| Existing test regressions | 0 | TBD |

## Risks & Mitigations

- **Read-only sites miscounted as unguarded**: Some Call::bounded_wait sites call query methods (no state mutation). These do NOT need idempotency keys. Mitigation: classify each site by checking the target method's `#[query]` vs `#[update]` attribute.
- **legal_analysis has 10 sites -- some may be complex**: The 10 call sites in legal_analysis may have intricate calling patterns. Mitigation: start with the simplest sites, establish the pattern, then apply to complex ones.
- **IdempotencyKey storage grows unbounded**: Without TTL cleanup, the IDEMPOTENCY_STORE grows forever. Mitigation: use the existing DEFAULT_TTL_NANOS (24 hours) from `awen_types::idempotency` and add periodic cleanup (timer or on-access eviction).
- **Changing function signatures breaks callers**: Adding IdempotencyKey parameter changes public API. Mitigation: make it `Option<IdempotencyKey>` with auto-generation for `None`, preserving backward compatibility.
- **Some calls may be intentionally non-idempotent**: Append-only operations (e.g., audit log writes) should always execute. Mitigation: classify these as "always-execute" and document the exception.

## Results

(Fill in after running)

## Analysis

(Fill in after running)

## Next Steps

If zero unguarded sites achieved: create RE- result entry, update CLAUDE.md to document the pattern as mandatory for new inter-canister calls. If some sites cannot be guarded: document exceptions with rationale, create follow-up hypothesis for alternative protection (e.g., saga compensation). Run mutation testing (`mise run mutants`) on idempotency checks to verify they are not dead code.
