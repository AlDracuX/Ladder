---
id: EX-00017
title: "Measure instruction count for full quota scan of 100K StableBTreeMap records in PocketIC"
status: draft
created: 2026-03-27
hypothesis: HY-00010
algorithm: AL-00005
tags: [quota, post-upgrade, performance, instruction-limit, stable-storage, evidence-vault]
methodology: "Populate evidence_vault with 100K synthetic records in PocketIC, run quota_health_check, measure instructions via performance_counter"
duration: "6 hours"
success_criteria: "Full scan of 100K records uses < 2 billion instructions (IC per-message limit is 5B for updates)"
---

## Objective

Determine whether a post-upgrade timer scan that iterates all StableBTreeMap records and counts per-user totals can complete within IC instruction limits for a canister with 100K records. This is the feasibility gate for implementing automated quota violation detection after canister upgrades.

## Methodology

1. **Instrument evidence_vault with performance counter**
   - Add a new `#[update]` endpoint `quota_health_check` to `src/evidence_vault/src/lib.rs`
   - Implementation calls `ic_cdk::api::performance_counter(0)` before and after iterating EVIDENCE_STORE
   - The scan logic: iterate all entries, build `HashMap<Principal, usize>` counting per-owner records, return any owners exceeding 10K quota
   ```rust
   fn quota_health_check_impl() -> QuotaReport {
       let start = ic_cdk::api::performance_counter(0);
       let mut counts: HashMap<Principal, usize> = HashMap::new();
       EVIDENCE_STORE.with(|s| {
           for entry in s.borrow().iter() {
               *counts.entry(entry.value().owner).or_default() += 1;
           }
       });
       let violations: Vec<_> = counts.iter()
           .filter(|(_, &c)| c > 10_000)
           .map(|(p, c)| (*p, *c))
           .collect();
       let end = ic_cdk::api::performance_counter(0);
       QuotaReport { total_records: counts.values().sum(), violations, instructions_used: end - start }
   }
   ```

2. **Build and deploy to PocketIC**
   ```bash
   cd /mnt/media_backup/PROJECTS/awen-network-canisters
   mise run build
   # PocketIC integration test setup
   ```

3. **Populate with 100K synthetic records** (10 users x 10K each)
   ```bash
   # In integration test:
   # Create 10 distinct principals
   # For each principal, call store_evidence 10,000 times with varied data:
   #   - Short descriptions (50 chars) + medium descriptions (500 chars) + long (2000 chars)
   #   - 0-5 tags per record
   #   - 0-3 metadata key-value pairs
   #   - Mix of Some/None for optional fields (case_id, encrypted_content)
   # This simulates realistic record size distribution
   ```

4. **Run quota scan and record instruction count**
   ```bash
   cargo nextest run -p tests -E 'test(/quota_health_check_100k/)' --no-capture 2>&1
   # Extract instruction count from test output
   ```

5. **Run at smaller scales for extrapolation**
   ```bash
   # Also measure at 1K, 10K, 50K records to establish cost curve
   # Plot: records vs. instructions to predict max feasible record count
   ```

6. **Measure heap usage during scan**
   ```bash
   # The HashMap<Principal, usize> for 10 unique users is trivial (~800 bytes)
   # But test with 1000 users (100 records each) to verify heap stays small
   ```

## Setup

- Working directory: `/mnt/media_backup/PROJECTS/awen-network-canisters`
- Branch: `experiment/ex-00017-quota-scan-benchmark` (git worktree)
- Prerequisite: `mise run build` (produces evidence_vault WASM)
- PocketIC integration test in `src/tests/integration/`
- Key source files:
  - `src/evidence_vault/src/lib.rs` -- StoredEvidence struct (lines 113-142, ~18 fields per record)
  - `packages/awen_types/src/lib.rs` -- quota constants (10K per user, 100K global for mcp_gateway)
- Note: StoredEvidence has 18 fields including variable-length Strings, Vec<String>, Option<Vec<u8>> -- Candid deserialization cost per record is significant

## Algorithm

Applies AL-00005 (per-user storage quotas). The scan verifies quota compliance after an upgrade where edge cases (saga failures, schema migrations) may have violated the insert-time quota check.

## Success Criteria

- [ ] Primary: full scan of 100K records uses < 2 billion instructions (measured via `performance_counter(0)`)
- [ ] Secondary: per-user count HashMap fits in heap during scan (100K records / ~1000 users = ~16KB)
- [ ] Secondary: scan completes within 60-second timer callback window (PocketIC wall-clock measurement)
- [ ] Data point: instructions per record (to estimate max feasible record count)
- [ ] Data point: instruction cost curve is linear (no super-linear blowup from BTreeMap traversal)

## Data Collection

| Scale | Records | Users | Instructions | Time (ms) | Instructions/Record |
|-------|---------|-------|-------------|-----------|-------------------|
| Small | 1,000 | 10 | TBD | TBD | TBD |
| Medium | 10,000 | 100 | TBD | TBD | TBD |
| Large | 50,000 | 500 | TBD | TBD | TBD |
| Target | 100,000 | 1,000 | TBD (< 2B) | TBD | TBD |

Additional measurements:
- Heap usage during scan: TBD
- Candid deserialization cost per record (isolate `entry.value()` cost): TBD
- BTreeMap `.iter()` traversal cost without deserialization (key-only scan): TBD

## Risks & Mitigations

- **Candid deserialization cost per record may be high**: StoredEvidence has 18 fields with variable-length data. Mitigation: if too expensive, test a key-only scan approach where `entry.key()` is used to count records without deserializing values (requires owner to be encoded in the key or stored in a separate index).
- **100K record population may be slow in PocketIC**: Each `store_evidence` call is an update message. Mitigation: batch population using a special test-only bulk-insert endpoint, or populate the StableBTreeMap directly via canister state manipulation if PocketIC supports it.
- **PocketIC instruction counter may differ from mainnet**: PocketIC may not meter instructions identically to the IC replica. Mitigation: document the PocketIC version and note results as approximate. Apply a 2x safety margin.
- **If 100K exceeds 2B instructions**: Design a batched scanning approach using timer chains (scan 10K records per timer callback, resume from cursor).

## Results

(Fill in after running)

## Analysis

(Fill in after running)

## Next Steps

If < 2B: implement the post-upgrade quota scan in all 9 canisters via `awen_lifecycle!(post_upgrade)` hook. If > 2B: design batched timer chain approach and create a follow-up HY- for the batched variant. Either way, create RE- entry with the instruction cost curve data.
