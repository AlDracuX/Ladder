---
id: EX-00034
title: "Capture stable memory snapshot from PocketIC and run impl tests against real data for bug discovery"
status: draft
created: 2026-03-27
hypothesis: HY-00025
algorithm: AL-00001
tags: [snapshot, impl-pattern, integration-test, stable-memory, evidence-vault, PocketIC, data-driven]
methodology: "Deploy evidence_vault to PocketIC, populate with 500 diverse records (unicode, edge-case dates, max-size payloads), capture stable memory snapshot, deserialize into native test harness, run _impl functions against real data, count bugs not found by synthetic unit tests"
duration: "8 hours"
success_criteria: "Snapshot captured and deserialized successfully; _impl functions exercised against real data; at least 1 bug or edge case found that existing unit tests miss"
---

## Objective

Test whether running `_impl` functions against real stable memory snapshots from a populated PocketIC deployment reveals bugs that synthetic-data unit tests miss. Synthetic test data uses predictable inputs (sequential IDs, short ASCII strings, valid dates). Real data has organic patterns -- variable-length content, unicode, edge-case timestamps, records created by different code paths. The hypothesis predicts at least 1 latent issue will be discovered.

## Methodology

1. **Audit existing unit test data patterns**
   ```bash
   cd /mnt/media_backup/PROJECTS/awen-network-canisters
   # What kind of test data do current unit tests use?
   rg 'test_evidence\|mock_evidence\|Evidence \{' src/evidence_vault/src/ -C 3
   # Are there any unicode, max-length, or edge-case test inputs?
   rg 'unicode\|\\u\{|max_len\|boundary\|edge_case' src/evidence_vault/src/
   # Check for property tests that might already cover this
   rg 'proptest\|quickcheck\|arbitrary' src/evidence_vault/
   ```

2. **Deploy evidence_vault and populate with diverse data**
   ```rust
   // tests/integration/snapshot_impl_test.rs
   #[test]
   #[ignore]
   fn populate_and_capture_snapshot() {
       let pic = PocketIc::new();
       let ev_id = deploy_evidence_vault(&pic);

       // Category 1: Normal data (200 records)
       for i in 0..200 {
           store_evidence(&pic, ev_id, &normal_evidence(i));
       }

       // Category 2: Unicode titles and descriptions (100 records)
       let unicode_titles = vec![
           "\u{1F4CB} Evidence with emoji",
           "\u{0410}\u{0411}\u{0412} Cyrillic title",
           "\u{4E2D}\u{6587} Chinese characters",
           "Title with zero-width\u{200B}space",
           "Right\u{200F}to\u{200F}left marks",
           "Combining\u{0301} diacritics",
           // ... 94 more unicode variations
       ];

       // Category 3: Edge-case timestamps (100 records)
       let edge_dates = vec![
           0u64,                          // epoch
           1u64,                          // just after epoch
           u64::MAX,                      // max timestamp
           u64::MAX - 1,                  // near max
           1704067200_000_000_000u64,     // 2024-01-01 midnight
           // ... dates at DST boundaries, leap seconds, etc.
       ];

       // Category 4: Max-size payloads (50 records)
       for i in 0..50 {
           let large_desc = "X".repeat(10_000); // 10KB description
           store_evidence(&pic, ev_id, &evidence_with_description(i, &large_desc));
       }

       // Category 5: Edge-case string content (50 records)
       let edge_strings = vec![
           "",                             // empty string
           " ",                            // single space
           "\n\n\n",                       // only newlines
           "\0\0\0",                       // null bytes
           "a".repeat(100_000).as_str(),   // 100KB string
           &"<script>alert('xss')</script>", // XSS payload (should be stored as-is)
           // ... 44 more edge cases
       ];

       // Capture snapshot
       // Use PocketIC's state management API
       let snapshot = pic.get_stable_memory(ev_id);
       std::fs::write("/tmp/evidence_vault_snapshot.bin", &snapshot).unwrap();
       println!("Snapshot size: {} bytes", snapshot.len());
   }
   ```

3. **Deserialize snapshot into native test harness**
   ```rust
   // tests/snapshot_harness.rs
   // Load the binary snapshot and reconstruct StableBTreeMap contents
   // Option A: Use ic-stable-structures' Memory trait with a Vec<u8> backend
   // Option B: Use candid::decode to deserialize individual records from known offsets
   // Option C: Use PocketIC's canister state loading to query data via canister interface

   fn load_snapshot_records(snapshot_path: &str) -> Vec<Evidence> {
       let bytes = std::fs::read(snapshot_path).unwrap();
       // Reconstruct MemoryManager and BTreeMap from raw bytes
       let memory = VectorMemory::new(bytes);
       let mm = MemoryManager::init(memory);
       let store: StableBTreeMap<String, Evidence, _> = StableBTreeMap::init(mm.get(EVIDENCE_MEM_ID));
       store.iter().map(|entry| entry.value().clone()).collect()
   }
   ```

4. **Run _impl functions against snapshot data**
   ```rust
   #[test]
   fn test_impl_functions_against_snapshot() {
       let records = load_snapshot_records("/tmp/evidence_vault_snapshot.bin");
       assert!(records.len() >= 500, "Expected 500+ records, got {}", records.len());

       let mut bugs_found = Vec::new();

       for record in &records {
           // Test retrieve: can we get this record back?
           match get_evidence_impl(record.owner, &record.id) {
               Ok(retrieved) => {
                   if retrieved != *record {
                       bugs_found.push(format!("MISMATCH: record {} differs after retrieve", record.id));
                   }
               }
               Err(e) => {
                   bugs_found.push(format!("RETRIEVE_ERROR: record {} -> {:?}", record.id, e));
               }
           }

           // Test chain-of-custody: does the hash chain validate?
           match verify_chain_of_custody_impl(&record.id) {
               Ok(valid) => {
                   if !valid {
                       bugs_found.push(format!("CHAIN_INVALID: record {} has broken chain", record.id));
                   }
               }
               Err(e) => {
                   bugs_found.push(format!("CHAIN_ERROR: record {} -> {:?}", record.id, e));
               }
           }

           // Test search: does this record appear in search results?
           match search_evidence_impl(record.owner, &record.title[..10.min(record.title.len())]) {
               Ok(results) => {
                   if !results.iter().any(|r| r.id == record.id) {
                       bugs_found.push(format!("SEARCH_MISS: record {} not found by title prefix search", record.id));
                   }
               }
               Err(e) => {
                   bugs_found.push(format!("SEARCH_ERROR: record {} -> {:?}", record.id, e));
               }
           }

           // Test validation: do stored records pass input validation?
           match validate_evidence_input(&record.title, &record.description) {
               Ok(()) => {}
               Err(e) => {
                   bugs_found.push(format!("VALIDATION_BYPASS: record {} stored but fails validation: {:?}", record.id, e));
               }
           }
       }

       println!("=== SNAPSHOT TEST RESULTS ===");
       println!("Records tested: {}", records.len());
       println!("Bugs found: {}", bugs_found.len());
       for bug in &bugs_found {
           println!("  BUG: {}", bug);
       }

       // The hypothesis predicts at least 1 bug
       assert!(!bugs_found.is_empty(), "Expected at least 1 bug from snapshot testing");
   }
   ```

5. **Compare with existing unit test coverage**
   ```bash
   # Run existing unit tests to confirm they pass
   cargo nextest run -p evidence_vault
   # Identify which bugs (if any) would also fail unit tests
   # Genuine snapshot-only bugs: fail snapshot test but pass all unit tests
   ```

## Setup

- Working directory: `/mnt/media_backup/PROJECTS/awen-network-canisters`
- Branch: `experiment/ex-00034-snapshot-impl-tests`
- Dependencies: PocketIC, ic-stable-structures 0.7.x (for native memory reconstruction)
- Key files:
  - `src/evidence_vault/src/lib.rs` -- _impl functions to test
  - `packages/awen_types/src/lib.rs` -- Evidence type, validation functions
- Build: `mise run build` (for PocketIC deployment)
- Snapshot storage: `/tmp/evidence_vault_snapshot.bin` (temporary)
- PocketIC API: `get_stable_memory(canister_id)` for snapshot capture
- Note: PocketIC snapshot API availability needs verification (step 1)

## Algorithm

AL-00001: _impl pattern. All canisters separate IC glue from testable business logic. The `_impl` functions are pure Rust with no IC runtime dependency, making them testable in native builds. The innovation here is feeding real (snapshot) data into these functions rather than synthetic test data, combining the _impl pattern with data-driven testing.

## Success Criteria

- [ ] Existing unit test data patterns audited (confirm they use synthetic/predictable inputs)
- [ ] 500+ evidence records populated in PocketIC with 5 diversity categories
- [ ] Stable memory snapshot captured successfully (binary file)
- [ ] Snapshot deserialized into native Vec of Evidence records
- [ ] get_evidence_impl tested against all 500+ records
- [ ] verify_chain_of_custody_impl tested against all records
- [ ] search_evidence_impl tested against all records
- [ ] validate_evidence_input tested against all records
- [ ] **At least 1 bug or edge case found** (primary success criterion)
- [ ] Each bug classified: serialization error, validation bypass, ordering issue, or other
- [ ] Snapshot capture + load + test cycle completes in < 30 seconds
- [ ] Comparison with unit test results: document which bugs are snapshot-only

## Data Collection

| Metric | Target | Actual |
|--------|--------|--------|
| Records populated (total) | 500 | TBD |
| Normal data records | 200 | TBD |
| Unicode records | 100 | TBD |
| Edge-case timestamp records | 100 | TBD |
| Max-size payload records | 50 | TBD |
| Edge-case string records | 50 | TBD |
| Snapshot size (bytes) | TBD | TBD |
| Records successfully deserialized | 500 | TBD |
| **Unique bugs found** | **1+** | TBD |
| Bugs: serialization mismatch | TBD | TBD |
| Bugs: validation bypass | TBD | TBD |
| Bugs: search miss | TBD | TBD |
| Bugs: chain-of-custody error | TBD | TBD |
| Snapshot test cycle time | < 30 seconds | TBD |

## Risks & Mitigations

- **PocketIC snapshot API may not exist**: `get_stable_memory()` may not be available in the PocketIC version used. Mitigation: check PocketIC docs/API first. Alternative: use PocketIC's canister state export, or query all records via canister interface and serialize to disk (less authentic but still exercises _impl functions).
- **Snapshot deserialization may differ from StableBTreeMap**: Native deserialization of raw stable memory requires matching the exact memory layout (MemoryManager allocations, BTreeMap node format). Mitigation: use the same `ic-stable-structures` version and `MemoryManager::init` with a `VectorMemory` backed by the snapshot bytes.
- **Populated data may be too controlled to find real bugs**: Synthetic-but-diverse data is still synthetic. Mitigation: maximize diversity with 5 categories (unicode, timestamps, max-size, edge strings, normal). Include known problematic patterns from production debugging experience.
- **_impl functions may not be accessible from test crate**: Some _impl functions may be crate-private. Mitigation: check visibility with `rg 'pub.*fn.*_impl' src/evidence_vault/src/`. If private, use `integration_test` feature to re-export, or test via the canister interface in PocketIC.
- **Snapshot test may be flaky**: Non-deterministic ordering in BTreeMap iteration could cause intermittent failures. Mitigation: BTreeMap iteration is deterministic (sorted by key). If using PocketIC query interface instead of raw snapshot, results are also deterministic.

## Results

(Fill in after running)

## Analysis

(Fill in after running)

## Next Steps

If bugs found: write regression unit tests for each bug, fix the underlying issues, create RE- result entry. If no bugs found with 500 diverse records: the code is robust against this diversity level (positive result). Consider: (a) testing with 10,000 records, (b) applying snapshot pattern to other canisters, (c) creating AL- entry for "snapshot-driven _impl testing pattern". If snapshot harness is reusable: package as a test utility in `tests/helpers/` for other canisters to adopt.
