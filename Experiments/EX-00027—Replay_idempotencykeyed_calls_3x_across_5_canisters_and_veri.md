---
id: EX-00027
title: "Replay idempotency-keyed calls 3x across 5 canisters and verify single state mutation"
status: draft
created: 2026-03-27
hypothesis: HY-00003
algorithm: AL-00002
tags: [idempotency, inter-canister, replay, deduplication, resilience]
methodology: "Identify all Call:: sites in 5 canisters, add IdempotencyKey lifecycle, write PocketIC replay tests calling each endpoint 3x with same key, verify exactly 1 state mutation per canister"
duration: "8 hours"
success_criteria: "All 5 canisters have idempotency on every Call:: site; replay tests pass (3x call = 1x state change); zero regressions in existing nextest suite"
---

## Objective

Validate that adding the `awen_types::idempotency` pattern to all inter-canister `Call::` sites in evidence_vault, mcp_gateway, legal_analysis, procedural_intel, and case_hub prevents duplicate state mutations when the same request is replayed. case_timeline and deadline_alerts already implement this pattern (AL-00002), so those serve as reference implementations.

## Methodology

1. **Inventory all Call:: sites in the 5 target canisters**
   ```bash
   cd /mnt/media_backup/PROJECTS/awen-network-canisters
   rg 'Call::bounded_wait|Call::unbounded_wait' \
     src/evidence_vault/src/ src/mcp_gateway/src/ \
     src/legal_analysis/src/ src/procedural_intel/src/ \
     src/case_hub/src/ \
     --count-matches
   ```
   Record the exact count per canister. Expected: ~34 total across 5 canisters based on grep counts.

2. **Review reference implementations for the pattern**
   ```bash
   # See how case_timeline implements idempotency
   rg 'idempotency_key|check_processed|record_processed|cleanup_expired' \
     src/case_timeline/src/ src/deadline_alerts/src/ -C 3
   ```
   Document the lifecycle: check_processed -> execute -> record_processed -> cleanup_expired.

3. **For each canister, add IdempotencyKey parameter to every Call:: wrapper function**
   - Add `IDEMPOTENCY_STORE: StableBTreeMap<String, ProcessedRequest, Memory>` to storage macro
   - Wrap each inter-canister call with: check_processed -> skip if duplicate -> execute -> record_processed
   - Add cleanup_expired timer (reuse existing pattern from deadline_alerts)
   - Branch: `experiment/ex-00027-idempotency-5-canisters`

4. **Write replay tests for each canister (PocketIC integration)**
   ```bash
   # Create test file
   # tests/integration/idempotency_replay_test.rs
   # For each canister:
   #   1. Deploy canister to PocketIC
   #   2. Make an inter-canister call with idempotency_key = "test-key-001"
   #   3. Record state (count of records, balances, etc.)
   #   4. Replay the EXACT same call 2 more times with same key
   #   5. Assert: state is identical to after first call
   #   6. Make call with DIFFERENT key "test-key-002"
   #   7. Assert: state has changed (new record created)
   ```

5. **Run full test suite to verify no regressions**
   ```bash
   mise run build
   cargo nextest run -E 'test(/idempotency_replay/)'
   mise run nextest  # full suite
   ```

6. **Measure stable memory overhead**
   ```bash
   # Before: total stable memory usage per canister
   # After: total stable memory usage with IDEMPOTENCY_STORE populated
   # Record delta per canister
   ```

## Setup

- Working directory: `/mnt/media_backup/PROJECTS/awen-network-canisters`
- Branch: `experiment/ex-00027-idempotency-5-canisters` (git worktree)
- Dependencies: `awen_types::idempotency` module (already exists in `packages/awen_types/src/idempotency.rs`)
- Reference: case_timeline and deadline_alerts idempotency implementations
- Target canisters (5): evidence_vault, mcp_gateway, legal_analysis, procedural_intel, case_hub
- Build system: `mise run build` (WASM output to `/mnt/media_backup/cargo-target`)
- Test runner: `cargo nextest run` (never `cargo test`)

## Algorithm

AL-00002: Saga idempotency pattern. The lifecycle is: (1) check if `idempotency_key` exists in `IDEMPOTENCY_STORE`, (2) if yes, return cached response hash, (3) if no, execute the call, (4) record the response hash with TTL, (5) periodic cleanup of expired entries via canister timer.

## Success Criteria

- [ ] All Call:: sites inventoried with exact count per canister
- [ ] IDEMPOTENCY_STORE added to all 5 canisters with MemoryManager allocation
- [ ] Every Call:: site wrapped with check/record/cleanup lifecycle
- [ ] Replay test per canister: 3x same key produces exactly 1 state mutation
- [ ] Replay test per canister: different key produces new state mutation
- [ ] cleanup_expired timer registered in each canister's post_upgrade
- [ ] All existing nextest tests pass (zero regressions)
- [ ] Stable memory overhead per canister documented

## Data Collection

| Metric | Target | Actual |
|--------|--------|--------|
| Call:: sites in evidence_vault | TBD (inventory) | TBD |
| Call:: sites in mcp_gateway | TBD (inventory) | TBD |
| Call:: sites in legal_analysis | TBD (inventory) | TBD |
| Call:: sites in procedural_intel | TBD (inventory) | TBD |
| Call:: sites in case_hub | TBD (inventory) | TBD |
| Replay tests passing | 5/5 canisters | TBD |
| Existing test regressions | 0 | TBD |
| Memory overhead per IDEMPOTENCY_STORE (bytes) | <10KB per canister | TBD |

## Risks & Mitigations

- **Some calls may be intentionally non-idempotent**: Review each Call:: site to determine if it should be idempotent. Calls that are fire-and-forget notifications may not need dedup. Mitigation: classify each site as idempotent-required vs exempt, document rationale.
- **Key storage adds stable memory footprint**: Each ProcessedRequest is ~100 bytes. With 24h TTL and <100 requests/day, overhead is negligible. Mitigation: measure actual overhead, set conservative TTL.
- **MemoryManager memory ID conflicts**: Each canister has a fixed set of MemoryManager IDs. Adding IDEMPOTENCY_STORE requires a new ID. Mitigation: check existing IDs via `grep 'MEM_ID' src/{canister}/src/lib.rs` and allocate next available.
- **Cleanup timer conflicts with existing timers**: Some canisters already have periodic timers. Mitigation: use `ic_cdk_timers::set_timer_interval` which supports multiple concurrent timers.

## Results

(Fill in after running)

## Analysis

(Fill in after running)

## Next Steps

If all 5 canisters pass: create RE- result entry confirming AL-00002 applies universally. Create AL- entry for "universal idempotency" pattern. If some canisters have sites that resist wrapping: document which sites and why, create follow-up HY- for alternative dedup strategies.
