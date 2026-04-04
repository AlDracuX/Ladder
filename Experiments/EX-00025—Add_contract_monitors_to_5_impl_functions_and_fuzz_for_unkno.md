---
id: EX-00025
title: "Add contract monitors to 5 impl functions and fuzz for unknown invariant violations"
status: draft
created: 2026-03-27
hypothesis: HY-00037
algorithm: ""
tags: [design-by-contract, invariants, monitoring, fuzz-testing, contracts-crate]
methodology: "Define postcondition contracts for 5 high-risk _impl functions, replace panic with logging, run existing fuzz harnesses for 10K iterations each, analyze violation logs"
duration: "6 hours"
success_criteria: "At least 1 genuine invariant violation detected across 50K total fuzz iterations; zero false positives; monitoring overhead under 10%; violation log includes full context"
---

## Objective

Validate that wrapping 5 core `_impl` functions with postcondition contracts (logging violations to stable storage instead of panicking) reveals at least 1 previously unknown invariant violation during fuzz testing. This demonstrates that runtime monitoring catches bugs that static analysis and unit tests miss, exploring the space between known test inputs and production edge cases.

## Methodology

1. **Baseline: document existing fuzz harness coverage**
   ```bash
   cd /mnt/media_backup/PROJECTS/awen-network-canisters
   ls fuzz/fuzz_targets/ 2>/dev/null
   # Expected: 9 harnesses with 62 fuzz tests
   # Identify which harnesses exercise the 5 target functions:
   grep -rn 'store_evidence_impl\|add_timeline_event_impl\|calculate_award_impl\|store_case_impl\|dispatch_request_impl' fuzz/
   ```

2. **Define postcondition contracts for each target function** (describe, not implement)

   **store_evidence_impl** (evidence_vault):
   - Post: returned Evidence.sha256_hash == SHA-256(input.data)
   - Post: returned Evidence.owner == caller principal
   - Post: returned Evidence.id is unique (not in existing store)

   **add_timeline_event_impl** (case_timeline):
   - Post: returned event.timestamp >= last event's timestamp for same case (chronological ordering)
   - Post: returned event.case_id matches input case_id

   **calculate_award_impl** (settlement):
   - Post: returned award.total_pence <= COMPENSATORY_AWARD_CAP_PENCE + BASIC_AWARD_MAX_PENCE
   - Post: returned award.basic_award_pence <= BASIC_AWARD_MAX_PENCE
   - Post: returned award.total_pence >= 0 (no negative awards)

   **store_case_impl** (case_hub):
   - Post: returned case.id is unique
   - Post: returned case.status == initial status (Draft or equivalent)

   **dispatch_request_impl** (mcp_gateway):
   - Post: rate_limit_state is consistent (count <= max per window)
   - Post: response canister_id matches request routing

3. **Implement contract monitoring** (describe, not implement)
   - Option A: Use `contracts` crate `#[ensures]` attribute (if wasm32 compatible)
   - Option B: Manual pre/post condition checks wrapped in #[cfg(feature = "contracts")]
   - Violation handler: instead of panic, write to a `StableVec<ContractViolation>` where
     `ContractViolation { function_name, input_summary, expected, actual, ic_timestamp }`
   - Feature-gate: `#[cfg(feature = "contract_monitors")]` so production builds skip overhead

4. **Run fuzz harnesses with contract monitors enabled**
   ```bash
   # Build with contract monitors feature
   CARGO_TARGET_DIR=/mnt/media_backup/cargo-target \
     cargo build --features contract_monitors -p evidence_vault -p case_timeline \
     -p settlement -p case_hub -p mcp_gateway

   # Run each harness for 10,000 iterations
   # evidence_vault fuzz:
   cargo +nightly fuzz run fuzz_evidence_vault -- -runs=10000
   # case_timeline fuzz:
   cargo +nightly fuzz run fuzz_case_timeline -- -runs=10000
   # settlement fuzz:
   cargo +nightly fuzz run fuzz_settlement -- -runs=10000
   # case_hub fuzz:
   cargo +nightly fuzz run fuzz_case_hub -- -runs=10000
   # mcp_gateway fuzz:
   cargo +nightly fuzz run fuzz_mcp_gateway -- -runs=10000
   ```

5. **Collect and analyze violation logs**
   ```bash
   # After each fuzz run, dump the StableVec contents
   # For unit-test mode: violations logged to a thread_local Vec
   # Classify each violation:
   #   - Genuine bug: unexpected state that violates documented invariant
   #   - Contract too strict: valid behavior that the postcondition incorrectly rejects
   #   - Test artifact: violation caused by fuzz harness setup, not real code
   ```

6. **Measure monitoring overhead**
   ```bash
   # Compare fuzz iteration throughput with and without contract monitors
   # Run 10,000 iterations with monitors: record total time
   # Run 10,000 iterations without monitors: record total time
   # Target: <10% overhead
   ```

## Setup

- Working directory: `/mnt/media_backup/PROJECTS/awen-network-canisters`
- Branch: `experiment/ex-00025-contract-monitors` (git worktree)
- Dependencies: check `contracts` crate wasm32 compatibility; if not compatible, use manual pre/post checks
- Target functions (5):
  - `src/evidence_vault/src/lib.rs` -- `store_evidence_impl`
  - `src/case_timeline/src/lib.rs` -- `add_timeline_event_impl`
  - `src/settlement/src/lib.rs` -- `calculate_award_impl`
  - `src/case_hub/src/lib.rs` -- `store_case_impl`
  - `src/mcp_gateway/src/lib.rs` -- `dispatch_request_impl`
- Fuzz harnesses: `fuzz/fuzz_targets/`
- Workspace lint note: `panic = "deny"` means we MUST log violations, not panic

## Algorithm

No specific AL- entry. Uses the design-by-contract pattern: define preconditions (input validation) and postconditions (output invariants) for each function. The key innovation is logging violations instead of panicking -- this is required by the workspace lint `panic = "deny"` and enables monitoring in production without disrupting service.

## Success Criteria

- [ ] Postcondition contracts defined for all 5 target _impl functions
- [ ] Violation handler logs to stable storage instead of panicking
- [ ] Contract monitors feature-gated behind #[cfg(feature = "contract_monitors")]
- [ ] All 5 fuzz harnesses run for 10,000 iterations with monitors enabled
- [ ] At least 1 genuine invariant violation detected across 50,000 total iterations
- [ ] Zero false positives (all logged violations represent actual invariant breakage)
- [ ] Monitoring overhead adds less than 10% to fuzz iteration time
- [ ] Violation log includes function name, input summary, expected vs actual, timestamp

## Data Collection

| Metric | Target | Actual |
|--------|--------|--------|
| Functions monitored | 5 | TBD |
| Total fuzz iterations | 50,000 (5 x 10K) | TBD |
| Total violations logged | 1+ genuine | TBD |
| Genuine bugs found | 1+ | TBD |
| False positives (contract too strict) | 0 | TBD |
| Test artifacts (harness setup issues) | 0 | TBD |
| Monitoring overhead (%) | <10% | TBD |
| Iterations/second without monitors | TBD | TBD |
| Iterations/second with monitors | TBD | TBD |

## Risks & Mitigations

- **contracts crate wasm32 incompatibility**: The `contracts` crate uses proc macros that may not work on wasm32-unknown-unknown. Mitigation: implement manual contract checks as wrapper functions if the crate fails to compile. Pattern: `fn store_evidence_impl_monitored(args) { let result = store_evidence_impl(args); check_postconditions(&result); result }`.
- **Custom violation handler not supported**: The contracts crate may not allow replacing the default panic handler. Mitigation: use manual checks (Option B) that log directly to StableVec.
- **Fuzz harness depth**: Existing fuzz harnesses may not exercise the 5 target functions deeply enough. Mitigation: review harness code, add direct calls to target functions if missing, generate focused inputs.
- **Workspace panic = "deny"**: Any uncaught panic in contract checking would cause a compile error. Mitigation: all contract checks must use Result return types, not assert!() or panic!().

## Results

(Fill in after running)

## Analysis

(Fill in after running)

## Next Steps

If violations found: write regression tests for each, fix the underlying bugs, create RE- result entry. If no violations in 50K iterations: either the code is robust (good!) or the postconditions need to be more specific -- consider property-based testing with more targeted invariants. Create AL- entry for the contract monitoring pattern regardless of outcome.
