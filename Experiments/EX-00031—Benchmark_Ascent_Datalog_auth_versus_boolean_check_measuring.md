---
id: EX-00031
title: "Benchmark Ascent Datalog auth versus boolean check measuring instruction count delta in PocketIC"
status: draft
created: 2026-03-27
hypothesis: HY-00022
algorithm: ""
tags: [authorization, datalog, ascent, performance, benchmark, PocketIC, evidence-vault, instruction-count]
methodology: "Deploy evidence_vault to PocketIC, measure baseline instruction count for store_evidence with boolean auth, add Ascent Datalog 3-role policy, re-measure, compute per-call instruction delta"
duration: "8 hours"
success_criteria: "Instruction delta per auth check < 500K; no existing test regressions; WASM size increase < 100KB"
---

## Objective

Benchmark the instruction overhead of replacing boolean `is_controller` authorization checks in evidence_vault with Ascent Datalog role evaluation. The hypothesis predicts overhead under 500K instructions per check (0.025% of the 2 billion instruction limit). Ascent is already compiled into legal_analysis and procedural_intel (per SR-00028), so the key question is whether the Datalog evaluation cost is acceptable for the authorization use case with a small fact base (tens of roles, not millions of rows).

## Methodology

1. **Baseline: measure current instruction count for store_evidence**
   ```bash
   cd /mnt/media_backup/PROJECTS/awen-network-canisters
   # Verify Ascent is already a dependency
   rg 'ascent' src/evidence_vault/Cargo.toml src/legal_analysis/Cargo.toml Cargo.toml
   # Check current auth pattern in evidence_vault
   rg 'is_controller|msg_caller|caller ==' src/evidence_vault/src/ -C 2
   ```

2. **Write PocketIC baseline benchmark**
   ```rust
   // tests/integration/datalog_auth_benchmark.rs
   #[test]
   #[ignore]
   fn baseline_boolean_auth_instruction_count() {
       let pic = PocketIc::new();
       let ev_id = deploy_evidence_vault(&pic);

       // Warm up: 10 calls
       for _ in 0..10 {
           call_store_evidence(&pic, ev_id, &test_evidence());
       }

       // Measure: 100 calls, record instruction count per call
       let mut instruction_counts = Vec::new();
       for i in 0..100 {
           let before = get_canister_instruction_counter(&pic, ev_id);
           call_store_evidence(&pic, ev_id, &test_evidence_with_id(i));
           let after = get_canister_instruction_counter(&pic, ev_id);
           instruction_counts.push(after - before);
       }

       let avg = instruction_counts.iter().sum::<u64>() / 100;
       let stddev = compute_stddev(&instruction_counts);
       println!("BASELINE: avg={avg} instructions, stddev={stddev}");
       // Store as JSON for comparison
   }
   ```

3. **Implement Ascent Datalog authorization in evidence_vault**
   ```rust
   // src/evidence_vault/src/auth.rs (new file, experiment branch only)
   use ascent::ascent;

   ascent! {
       relation has_role(Principal, Role);
       relation can_access(Role, Method);
       relation authorized(Principal, Method);

       authorized(p, m) <-- has_role(p, r), can_access(r, m);
   }

   // 3-role policy:
   // Owner -> all methods
   // Solicitor -> store_evidence, get_evidence, list_evidence
   // Viewer -> get_evidence, list_evidence
   ```

4. **Replace is_controller with Datalog evaluation**
   ```rust
   // In store_evidence_impl:
   // BEFORE: if caller != controller { return Err(...) }
   // AFTER:  if !datalog_authorized(caller, Method::StoreEvidence) { return Err(...) }

   fn datalog_authorized(caller: Principal, method: Method) -> bool {
       let mut prog = AuthProgram::default();
       // Load facts from ROLE_STORE (StableBTreeMap)
       ROLE_STORE.with(|s| {
           for entry in s.borrow().iter() {
               prog.has_role.push((*entry.key(), entry.value().clone()));
           }
       });
       // Load static policy
       prog.can_access.extend(get_policy());
       prog.run();
       prog.authorized.contains(&(caller, method))
   }
   ```

5. **Measure Datalog instruction count (same 100-call benchmark)**
   ```bash
   mise run build
   # Run the same benchmark with Datalog auth
   cargo nextest run -E 'test(/datalog_auth_instruction/)' --run-ignored -- --nocapture
   ```

6. **Compute delta and check WASM size**
   ```bash
   # WASM size comparison
   ls -la /mnt/media_backup/cargo-target/wasm32-unknown-unknown/release/evidence_vault.wasm
   # Compare with baseline WASM size (record before making changes)

   # Instruction delta = (datalog_avg - baseline_avg)
   # Success if delta < 500,000
   ```

## Setup

- Working directory: `/mnt/media_backup/PROJECTS/awen-network-canisters`
- Branch: `experiment/ex-00031-datalog-auth-benchmark`
- Dependencies:
  - `ascent` crate: already in workspace (used by legal_analysis, procedural_intel, case_hub)
  - PocketIC: already configured
- Key files:
  - `src/evidence_vault/src/lib.rs` -- target canister
  - `src/legal_analysis/Cargo.toml` -- reference for ascent dependency
  - `packages/awen_types/src/` -- shared types
- Build: `mise run build` (WASM to `/mnt/media_backup/cargo-target`)
- Measurement: PocketIC does not expose `performance_counter(0)` directly; use canister-level instruction logging or PocketIC's built-in metrics API

## Algorithm

No specific AL- entry. Uses the A/B benchmark pattern: measure metric with implementation A (boolean), implement change B (Datalog), measure same metric, compute delta. The Datalog evaluation involves materializing all role facts, running the join, and checking the derived `authorized` relation. With a small fact base (< 50 facts), this should be a trivially fast in-memory join.

## Success Criteria

- [ ] Baseline instruction count measured: 100 calls, average and stddev recorded
- [ ] Ascent Datalog 3-role policy implemented (Owner, Solicitor, Viewer)
- [ ] ROLE_STORE (StableBTreeMap) added for role fact persistence
- [ ] is_controller replaced with datalog_authorized in all evidence_vault update endpoints
- [ ] Datalog instruction count measured: 100 calls, average and stddev recorded
- [ ] Instruction delta per auth check computed and documented
- [ ] Delta < 500,000 instructions (primary success criterion)
- [ ] WASM size delta measured (target: < 100KB increase)
- [ ] All existing evidence_vault tests pass (zero regressions)

## Data Collection

| Metric | Target | Actual |
|--------|--------|--------|
| Baseline avg instructions per store_evidence call | TBD | TBD |
| Baseline stddev | TBD | TBD |
| Datalog avg instructions per store_evidence call | TBD | TBD |
| Datalog stddev | TBD | TBD |
| **Instruction delta per auth check** | **< 500,000** | TBD |
| Delta as % of 2B instruction limit | < 0.025% | TBD |
| WASM size before (bytes) | TBD | TBD |
| WASM size after (bytes) | TBD | TBD |
| WASM size delta | < 100KB | TBD |
| Existing test regressions | 0 | TBD |
| Roles in test policy | 3 | TBD |
| Facts in test policy | ~15 (3 roles x 5 methods) | TBD |

## Risks & Mitigations

- **Ascent may not compile for evidence_vault's WASM target**: Ascent uses proc macros that generate Rust code; the generated code must be wasm32-compatible. Mitigation: ascent is already compiled into legal_analysis and procedural_intel (both wasm32), so it should work. Verify with `cargo check -p evidence_vault --target wasm32-unknown-unknown` after adding the dependency.
- **PocketIC instruction counter measurement noise**: Individual calls may vary. Mitigation: use 100 calls with 10-call warmup and compute both average and stddev. If stddev > 10% of mean, increase to 500 calls.
- **Small fact base today may not represent future scale**: With thousands of principals, evaluation cost could change. Mitigation: add a scaling test with 100, 500, and 1000 role facts and plot instruction count vs fact count. Document the scaling curve.
- **Datalog re-materialization on every call**: The naive approach re-runs Ascent on every auth check. Mitigation: if overhead exceeds 500K, test a cached approach where the `authorized` relation is materialized once and stored, only re-computed on role changes.

## Results

(Fill in after running)

## Analysis

(Fill in after running)

## Next Steps

If delta < 500K: create RE- result entry, create AL- for "Datalog RBAC pattern", apply to remaining 8 canisters. If delta > 500K: test cached materialization approach; if that passes, create a modified AL- with caching requirement. If WASM size increase > 100KB: investigate tree-shaking or feature-gating Ascent. Create HY- for scaling test with 1000+ principals if initial results are promising.
