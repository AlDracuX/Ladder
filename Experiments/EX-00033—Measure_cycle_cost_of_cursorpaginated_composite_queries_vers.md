---
id: EX-00033
title: "Measure cycle cost of cursor-paginated composite queries versus full-scan on 1000 record store"
status: draft
created: 2026-03-27
hypothesis: HY-00024
algorithm: AL-00006
tags: [composite-query, pagination, lazy-entry, performance, case-hub, evidence-vault, PocketIC, benchmark]
methodology: "Deploy evidence_vault + case_hub to PocketIC, populate 1000 records, measure full-scan instruction count, add paginated endpoint using LazyEntry skip/take, measure paginated instruction count for 20-item page, compute percentage reduction"
duration: "8 hours"
success_criteria: "Paginated query uses < 50% of full-scan cycle cost (1000+ records, 20-item page); pagination cursor correctly retrieves all 1000 records across pages; zero regressions"
---

## Objective

Measure whether cursor-paginated composite query endpoints using `LazyEntry` iterators reduce cross-canister read cycle cost by more than 50% compared to the current full-scan-and-filter approach. With 1000 records and a 20-item page, we avoid deserializing ~98% of records -- the 50% threshold is conservative. This experiment validates that the theoretical savings translate to actual instruction count reduction in PocketIC.

## Methodology

1. **Audit current query endpoints and understand LazyEntry iteration**
   ```bash
   cd /mnt/media_backup/PROJECTS/awen-network-canisters
   # Find current list/query endpoints in evidence_vault
   rg '#\[query\]' src/evidence_vault/src/lib.rs -A 3
   # Check how iterators are currently used
   rg '\.iter\(\)' src/evidence_vault/src/lib.rs -C 3
   # Verify LazyEntry is the iterator type (ic-stable-structures 0.7.x)
   rg 'LazyEntry' src/ packages/ --count-matches
   # Check if composite queries are supported
   rg 'composite' Cargo.toml src/*/Cargo.toml
   ```

2. **Deploy and populate test data (1000 records)**
   ```rust
   // tests/integration/pagination_benchmark.rs
   #[test]
   #[ignore]
   fn benchmark_full_scan_vs_paginated() {
       let pic = PocketIc::new();
       let ev_id = deploy_evidence_vault(&pic);
       let hub_id = deploy_case_hub(&pic);

       // Populate 1000 evidence records with varied data
       for i in 0..1000 {
           let evidence = StoreEvidenceRequest {
               title: format!("Evidence item {}", i),
               description: format!("Description for evidence {}, containing enough data to make deserialization meaningful", i),
               data_hash: sha256(&format!("data-{}", i).as_bytes()),
               case_id: format!("case-{}", i % 10), // 10 cases, 100 records each
               // ... other fields
           };
           call_store_evidence(&pic, ev_id, &evidence);
       }
   ```

3. **Baseline: measure full-scan instruction count**
   ```rust
       // Measure full scan (current implementation)
       let mut full_scan_counts = Vec::new();
       for _ in 0..10 {
           // Reset instruction counter or use PocketIC metrics
           let result = call_list_evidence(&pic, ev_id, /* no pagination */);
           // Record instruction count from PocketIC canister metrics
           full_scan_counts.push(get_instruction_count(&pic, ev_id));
           assert_eq!(result.len(), 1000); // Verify all records returned
       }
       let full_scan_avg = full_scan_counts.iter().sum::<u64>() / 10;
   ```

4. **Implement paginated query endpoint**
   ```rust
   // src/evidence_vault/src/lib.rs (experiment branch only)
   #[query]
   fn list_evidence_paginated(cursor: Option<String>, page_size: u32) -> PaginatedResponse<Evidence> {
       list_evidence_paginated_impl(ic_cdk::api::msg_caller(), cursor, page_size)
   }

   fn list_evidence_paginated_impl(
       caller: Principal,
       cursor: Option<String>,
       page_size: u32,
   ) -> PaginatedResponse<Evidence> {
       let page_size = page_size.min(100) as usize; // Cap at 100
       EVIDENCE_STORE.with(|s| {
           let store = s.borrow();
           let iter = match &cursor {
               Some(key) => {
                   // LazyEntry skip: range from cursor key onward
                   store.range(key.clone()..)
                       .skip(1) // Skip the cursor key itself
               }
               None => store.iter(),
           };

           let items: Vec<Evidence> = iter
               .filter(|entry| entry.value().owner == caller)
               .take(page_size)
               .map(|entry| entry.value().into())
               .collect();

           let next_cursor = items.last().map(|e| e.id.clone());
           PaginatedResponse { items, next_cursor }
       })
   }
   ```

5. **Measure paginated query instruction count (20-item page)**
   ```rust
       // Measure paginated query (20 items from 1000)
       let mut paginated_counts = Vec::new();
       for _ in 0..10 {
           let result = call_list_evidence_paginated(&pic, ev_id, None, 20);
           paginated_counts.push(get_instruction_count(&pic, ev_id));
           assert_eq!(result.items.len(), 20); // Verify page size
           assert!(result.next_cursor.is_some()); // More pages available
       }
       let paginated_avg = paginated_counts.iter().sum::<u64>() / 10;
   ```

6. **Compute delta and validate pagination completeness**
   ```rust
       // Compute savings
       let reduction_pct = (full_scan_avg - paginated_avg) as f64 / full_scan_avg as f64 * 100.0;
       println!("Full scan avg: {} instructions", full_scan_avg);
       println!("Paginated avg: {} instructions", paginated_avg);
       println!("Reduction: {:.1}%", reduction_pct);
       assert!(reduction_pct > 50.0, "Expected >50% reduction, got {:.1}%", reduction_pct);

       // Verify pagination completeness: iterate all pages
       let mut all_items = Vec::new();
       let mut cursor = None;
       loop {
           let page = call_list_evidence_paginated(&pic, ev_id, cursor, 20);
           all_items.extend(page.items);
           cursor = page.next_cursor;
           if cursor.is_none() { break; }
       }
       // Note: count may differ from 1000 if filtering by caller
       // Verify all accessible records retrieved
   }
   ```

7. **Test composite query from case_hub (if supported)**
   ```rust
   // If composite queries are available in ic-cdk:
   // Add a composite query in case_hub that calls evidence_vault's paginated endpoint
   // Measure the composite query instruction count vs direct call
   // This tests the cross-canister pagination overhead
   ```

## Setup

- Working directory: `/mnt/media_backup/PROJECTS/awen-network-canisters`
- Branch: `experiment/ex-00033-paginated-composite-queries`
- Dependencies: PocketIC, ic-stable-structures 0.7.x (LazyEntry), ic-cdk (composite query support)
- Key files:
  - `src/evidence_vault/src/lib.rs` -- add paginated endpoint
  - `src/case_hub/src/lib.rs` -- add composite query caller
  - `packages/awen_types/src/lib.rs` -- PaginatedResponse type
- Build: `mise run build` (required for PocketIC deployment)
- Measurement: PocketIC canister instruction metrics or manual instrumentation
- Data: 1000 synthetic evidence records (varied sizes and case IDs)

## Algorithm

AL-00006: LazyEntry iterator pattern. StableBTreeMap 0.7.x returns `LazyEntry` from iterators, which defers value deserialization until `.value()` is called. Combined with `.skip()` and `.take()`, this enables efficient cursor pagination without deserializing skipped records. Composite queries (if available) allow case_hub to call evidence_vault's query endpoint without the overhead of a full inter-canister update call.

## Success Criteria

- [ ] Current query endpoints and iterator patterns documented
- [ ] 1000 evidence records populated in PocketIC evidence_vault
- [ ] Full-scan instruction count measured (10 runs, average and stddev)
- [ ] list_evidence_paginated endpoint implemented with cursor-based pagination
- [ ] Paginated instruction count measured (20-item page, 10 runs, average and stddev)
- [ ] **Cycle cost reduction > 50%** (primary success criterion)
- [ ] Pagination completeness: all 1000 records reachable across sequential pages
- [ ] Cursor correctly skips to next page without duplicates or gaps
- [ ] Composite query from case_hub tested (if ic-cdk supports composite queries)
- [ ] All existing tests pass (zero regressions)

## Data Collection

| Metric | Target | Actual |
|--------|--------|--------|
| Records populated | 1000 | TBD |
| Full-scan avg instructions | TBD (baseline) | TBD |
| Full-scan stddev | TBD | TBD |
| Paginated (20-item) avg instructions | TBD | TBD |
| Paginated stddev | TBD | TBD |
| **Cycle cost reduction %** | **> 50%** | TBD |
| Pages to retrieve all 1000 records | 50 (1000/20) | TBD |
| Duplicate records across pages | 0 | TBD |
| Missing records across pages | 0 | TBD |
| Composite query overhead (if tested) | TBD | TBD |
| Existing test regressions | 0 | TBD |

## Risks & Mitigations

- **Composite queries may not be available in PocketIC**: PocketIC may not support the composite query feature. Mitigation: test pagination without composite queries first (direct calls). If composite queries aren't supported, document the limitation and test with regular inter-canister calls.
- **LazyEntry .skip() may still iterate internally**: The skip operation on a BTreeMap range may be O(n) not O(log n) even with LazyEntry, because it still traverses the tree. Mitigation: measure the actual instruction count -- if skip is O(n), the savings come from avoiding deserialization of skipped entries, which is still significant for large values.
- **Cursor token serialization adds overhead**: The cursor (String key) must be serialized and deserialized per page request. Mitigation: cursor is a simple String (the last key), overhead is negligible compared to deserialization of 980 skipped records.
- **Caller-scoped filtering complicates pagination**: If records are filtered by `owner == caller`, some pages may have fewer items (records belonging to other owners are skipped). Mitigation: the paginated endpoint should return `page_size` items that pass the filter, not `page_size` raw entries.
- **PocketIC instruction counter availability**: PocketIC may not expose per-call instruction counts directly. Mitigation: instrument the canister with `ic_cdk::api::performance_counter(0)` calls that write to a stable variable, then query that variable after each test call.

## Results

(Fill in after running)

## Analysis

(Fill in after running)

## Next Steps

If > 50% reduction: create RE- result entry, create AL- for "cursor-paginated query pattern", apply to case_timeline (which also has large stores). If reduction is < 50%: investigate whether the bottleneck is iteration overhead vs deserialization overhead, profile with more granular instruction counting. If composite queries work: create follow-up HY- for applying composite queries to all cross-canister reads. Create follow-up experiment for scaling test (10K, 100K records).
