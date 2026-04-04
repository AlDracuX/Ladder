---
id: EX-00028
title: "Proptest round-trip and upgrade simulation for all Storable types across 9 canisters"
status: draft
created: 2026-03-27
hypothesis: HY-00006
algorithm: ""
tags: [storable, proptest, upgrade, round-trip, candid, schema-evolution, data-integrity]
methodology: "Enumerate all Storable types across 9 canisters, write proptest round-trip tests for each, simulate schema evolution by adding optional fields, verify zero silent Default fallbacks"
duration: "6 hours"
success_criteria: "100% of Storable types have round-trip proptests; upgrade simulation tests pass for all types with added optional field; zero silent Default fallbacks detected"
---

## Objective

Validate that a test harness can catch 100% of Storable (CandidStorable) round-trip failures before deployment. The dual MemoryManager bug (P0) demonstrated that storage issues are catastrophic and that CandidStorable's fallback to `Default` on decode failure causes silent data loss. This experiment builds a comprehensive proptest suite covering every type that implements `Storable` across all 9 canisters.

## Methodology

1. **Enumerate all Storable types across the workspace**
   ```bash
   cd /mnt/media_backup/PROJECTS/awen-network-canisters
   rg 'impl Storable for' src/ packages/ --no-heading
   # Expected: ~6 impl blocks (from prior count) but many types use derive macros
   # Also check for CandidStorable derive:
   rg 'CandidStorable|#\[derive.*Storable\]' src/ packages/ --no-heading
   ```
   Create a manifest: `{canister, type_name, file_path, serialization_method}`.

2. **For each Storable type, write a proptest round-trip test**
   ```rust
   // tests/property_tests/storable_roundtrip.rs
   use proptest::prelude::*;

   proptest! {
       #[test]
       fn roundtrip_evidence_metadata(original in arb_evidence_metadata()) {
           let bytes = original.to_bytes();
           let recovered = EvidenceMetadata::from_bytes(bytes);
           prop_assert_eq!(original, recovered);
       }
   }
   ```
   Each type needs an `Arbitrary` impl or a proptest strategy. Types with `Default` fallback in `from_bytes` will silently "pass" with wrong data -- detect this by checking `recovered != Default::default()` when `original != Default::default()`.

3. **Write upgrade simulation tests (schema v1 -> v2)**
   ```rust
   // For each type, simulate adding an optional field:
   // 1. Serialize with current schema (v1)
   // 2. Define v2 struct with one added Optional<T> field
   // 3. Deserialize v1 bytes using v2 schema
   // 4. Assert: all v1 fields preserved, new field is None/default
   //
   // 5. Serialize with v2 schema (new field populated)
   // 6. Deserialize v2 bytes using v1 schema
   // 7. Assert: v1 fields preserved (Candid ignores extra fields)
   ```

4. **Detect silent Default fallbacks**
   ```bash
   # Find all from_bytes implementations that use unwrap_or_default or unwrap_or_else with Default
   rg 'from_bytes.*\{' -A 5 src/ packages/ | rg 'unwrap_or_default|Default::'
   ```
   For each such implementation, write a test that passes garbage bytes and verifies the returned value is explicitly `Default`, not silently corrupted real data.

5. **Run the full proptest suite**
   ```bash
   cargo nextest run -E 'test(/storable_roundtrip/)' -- --nocapture
   cargo nextest run -E 'test(/upgrade_simulation/)'
   # Property tests: 256 cases per type by default
   ```

6. **Measure coverage**
   ```bash
   mise run coverage -- -E 'test(/storable_roundtrip|upgrade_simulation/)'
   # Verify every Storable type in the manifest has at least 1 test
   ```

## Setup

- Working directory: `/mnt/media_backup/PROJECTS/awen-network-canisters`
- Branch: `experiment/ex-00028-storable-roundtrip`
- Dependencies: `proptest` (already in workspace), `candid` (already in workspace)
- Test location: `tests/property_tests/storable_roundtrip.rs` (new file)
- Key files:
  - `packages/awen_types/src/lib.rs` -- shared Storable types
  - `packages/awen_types/src/idempotency.rs` -- ProcessedRequest Storable
  - `src/*/src/lib.rs` -- canister-specific Storable types
- Build target: native (not wasm32 -- proptests run natively)
- Workspace lint exceptions: test modules allow `unwrap_used` and `expect_used`

## Algorithm

No specific AL- entry. Uses the property-based testing pattern: generate random instances of each type, serialize, deserialize, assert equality. The upgrade simulation adds schema evolution testing (Candid's forward/backward compatibility rules). Key insight: Candid allows adding optional fields (safe) but not removing fields or changing types (breaking).

## Success Criteria

- [ ] Complete manifest of all Storable types across 9 canisters with file locations
- [ ] proptest strategy (Arbitrary impl or manual) for every Storable type
- [ ] Round-trip test for each type: serialize -> deserialize -> assert equality
- [ ] Upgrade simulation test for each type: v1 bytes -> v2 deserialize -> fields preserved
- [ ] Backward compatibility test: v2 bytes -> v1 deserialize -> fields preserved
- [ ] Garbage bytes test for each type: verify from_bytes returns Default, not corrupted data
- [ ] All proptests pass (256 cases per type minimum)
- [ ] Zero silent Default fallbacks in non-garbage-bytes scenarios
- [ ] Coverage report confirms all Storable impls exercised

## Data Collection

| Metric | Target | Actual |
|--------|--------|--------|
| Total Storable types found | TBD (inventory) | TBD |
| Types with proptest strategies | 100% of total | TBD |
| Round-trip tests passing | 100% | TBD |
| Upgrade simulation tests passing | 100% | TBD |
| Silent Default fallbacks detected | 0 in normal operation | TBD |
| Garbage bytes handling correct | 100% (returns Default explicitly) | TBD |
| proptest cases per type | 256 minimum | TBD |

## Risks & Mitigations

- **Complex nested types may be hard to generate**: Some Storable types contain `Principal`, `Vec<u8>`, or nested structs. Mitigation: write manual proptest strategies using `prop_compose!` for complex types; use `any::<[u8; 29]>().prop_map(|b| Principal::from_slice(&b))` for Principal.
- **Candid schema evolution rules are subtle**: Adding required (non-optional) fields breaks backward compatibility. Mitigation: the experiment tests the exact Candid rules -- if a type's evolution would break, the test catches it.
- **CandidStorable's Default fallback masks failures**: The current `from_bytes` uses `unwrap_or_default()`, which means deserialization of corrupted data returns a valid but empty struct. Mitigation: the garbage bytes test explicitly verifies this behavior, and the round-trip test ensures non-garbage data never triggers the fallback.
- **proptest may be slow for large types**: Types with large `Vec<u8>` fields could generate huge instances. Mitigation: use `prop::collection::vec(any::<u8>(), 0..256)` to bound generated sizes.

## Results

(Fill in after running)

## Analysis

(Fill in after running)

## Next Steps

If all tests pass: create AL- entry for "Storable round-trip testing pattern" and add to CI as a mandatory check. If failures found: document each failure, fix the Storable impls, create RE- result entry. Consider adding these tests to the existing `tests/property_tests/` directory permanently. If schema evolution tests reveal breaking changes: document which types cannot safely evolve and add migration-required markers.
