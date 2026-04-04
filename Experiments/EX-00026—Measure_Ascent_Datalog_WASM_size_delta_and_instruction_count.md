---
id: EX-00026
title: "Measure Ascent Datalog WASM size delta and instruction count for case_hub transition rules"
status: draft
created: 2026-03-27
hypothesis: HY-00026
algorithm: ""
tags: [datalog, ascent, wasm-size, performance, state-machine, case-hub]
methodology: "Build case_hub WASM before/after replacing can_transition_to match arms with Ascent Datalog rules; measure WASM size delta via wasm-opt and per-check instruction count via PocketIC performance counter"
duration: "4 hours"
success_criteria: "WASM size increase < 50KB AND per-check instruction count < 100K; all existing can_transition_to tests pass"
---

## Objective

Determine whether replacing hardcoded `can_transition_to` match arms in case_hub with Ascent Datalog transition rules (`transition(Active, Settled, true).`) keeps the WASM size increase under 50KB and per-check evaluation within 100K instructions. This validates the viability of declarative state machines for all 9 canisters without unacceptable binary bloat or runtime cost.

## Methodology

1. **Record baseline WASM size**
   ```bash
   cd /mnt/media_backup/PROJECTS/awen-network-canisters
   mise run build
   WASM_BEFORE=$(stat --format=%s /mnt/media_backup/cargo-target/wasm32-unknown-unknown/release/case_hub.wasm)
   echo "Baseline WASM size: $WASM_BEFORE bytes"
   # Also record optimized size:
   wasm-opt -Oz /mnt/media_backup/cargo-target/wasm32-unknown-unknown/release/case_hub.wasm -o /tmp/case_hub_baseline.wasm
   WASM_OPT_BEFORE=$(stat --format=%s /tmp/case_hub_baseline.wasm)
   echo "Baseline optimized: $WASM_OPT_BEFORE bytes"
   ```

2. **Record baseline instruction count for can_transition_to**
   ```bash
   # Write a PocketIC benchmark test that calls can_transition_to 100 times
   # with varied (from, to) pairs and captures performance_counter(0)
   # before and after each batch. Record median per-call count.
   cargo nextest run -p case_hub -E 'test(/benchmark_transition/)'
   ```

3. **Create experiment branch and implement Datalog transition rules**
   ```bash
   git worktree add /tmp/ex-00026 -b experiment/ex-00026-datalog-transitions
   cd /tmp/ex-00026
   ```
   - Add `ascent = { workspace = true }` to `src/case_hub/Cargo.toml`
   - Define Datalog program in a new `src/case_hub/src/transitions.rs`:
     ```rust
     ascent! {
         relation transition(CaseStatus, CaseStatus);
         // Encode all valid transitions as facts:
         transition(CaseStatus::Draft, CaseStatus::Active).
         transition(CaseStatus::Active, CaseStatus::Settled).
         // ... etc for all pairs from current match arms
     }
     ```
   - Replace `can_transition_to` match body with Ascent query invocation
   - Ensure the function signature and return type remain identical

4. **Build modified WASM and measure size delta**
   ```bash
   mise run build
   WASM_AFTER=$(stat --format=%s /mnt/media_backup/cargo-target/wasm32-unknown-unknown/release/case_hub.wasm)
   DELTA=$((WASM_AFTER - WASM_BEFORE))
   echo "WASM delta: $DELTA bytes ($(( DELTA / 1024 )) KB)"
   # Optimized:
   wasm-opt -Oz /mnt/media_backup/cargo-target/wasm32-unknown-unknown/release/case_hub.wasm -o /tmp/case_hub_after.wasm
   WASM_OPT_AFTER=$(stat --format=%s /tmp/case_hub_after.wasm)
   OPT_DELTA=$((WASM_OPT_AFTER - WASM_OPT_BEFORE))
   echo "Optimized delta: $OPT_DELTA bytes ($(( OPT_DELTA / 1024 )) KB)"
   ```

5. **Run instruction count benchmark on modified code**
   ```bash
   cargo nextest run -p case_hub -E 'test(/benchmark_transition/)'
   # Compare median per-call instruction count: before vs after
   ```

6. **Run full existing test suite to check for regressions**
   ```bash
   cargo nextest run -p case_hub
   # All tests must pass without modification
   ```

7. **Test extensibility: add a new transition as a single Datalog fact**
   ```bash
   # Add one new transition fact, rebuild, verify it works
   # Confirm no match arm editing was needed
   ```

## Setup

- Working directory: `/mnt/media_backup/PROJECTS/awen-network-canisters`
- Branch: `experiment/ex-00026-datalog-transitions` (git worktree at `/tmp/ex-00026`)
- Ascent dependency: already in workspace `Cargo.toml` as `ascent = { version = "0.8", default-features = false }`
- Target files:
  - `src/case_hub/src/lib.rs` -- existing `can_transition_to` implementation
  - `src/case_hub/src/transitions.rs` -- new Datalog rules (to be created)
  - `src/case_hub/Cargo.toml` -- add ascent workspace dependency
- Canisters already using ascent: legal_analysis, procedural_intel, case_hub (check if already linked)
- Build target: `wasm32-unknown-unknown`
- Tool: `wasm-opt` from binaryen for optimized size comparison

## Algorithm

No specific AL- entry. Uses the Ascent Datalog engine (already a workspace dependency) to encode state transition rules as relational facts. The `ascent!` macro generates Rust code at compile time, so the measurement captures the generated code's contribution to WASM size. If case_hub already depends on ascent transitively, the marginal size may be near-zero (shared codegen). If not, the full library cost is attributed.

## Success Criteria

- [ ] Baseline WASM size and instruction count recorded for unmodified case_hub
- [ ] can_transition_to reimplemented using Ascent Datalog rules
- [ ] WASM size delta < 50KB (both raw and wasm-opt optimized)
- [ ] Per-check instruction count < 100,000 (median of 100 calls)
- [ ] All existing case_hub tests pass without modification
- [ ] Adding a new transition requires only a Datalog fact (no match arm edits)

## Data Collection

| Metric | Target | Actual |
|--------|--------|--------|
| Baseline WASM (raw, bytes) | n/a | TBD |
| Baseline WASM (optimized, bytes) | n/a | TBD |
| After WASM (raw, bytes) | n/a | TBD |
| After WASM (optimized, bytes) | n/a | TBD |
| Raw delta (KB) | < 50 | TBD |
| Optimized delta (KB) | < 50 | TBD |
| Baseline instructions/call | n/a | TBD |
| After instructions/call | n/a | TBD |
| Instruction delta (%) | negligible | TBD |
| Existing tests passing | 100% | TBD |
| New fact extensibility | 1 fact = 1 transition | TBD |

## Risks & Mitigations

- **Ascent proc macro bloat**: The `ascent!` macro may generate substantial Rust code for even simple rules. Mitigation: if delta exceeds 50KB, try `ascent_run!` (runtime evaluation) instead of compile-time codegen, accepting higher per-call instructions but lower WASM size.
- **Shared vs marginal cost**: If case_hub already links ascent via another crate, the marginal cost is near-zero and the experiment only measures the transition rules themselves. Record both gross and marginal size.
- **PocketIC instruction metering accuracy**: PocketIC's `performance_counter(0)` may not exactly match mainnet metering. Mitigation: use relative comparison (before/after) rather than absolute values.
- **Enum variant exhaustiveness**: The Datalog rules must cover all CaseStatus variants. If the current match arms use a wildcard default, the Datalog approach needs explicit negative facts or a different design.

## Results

(Fill in after running)

## Analysis

(Fill in after running)

## Next Steps

If WASM delta < 50KB and instructions < 100K: create an AL- entry for the Datalog transition pattern and propagate to other canisters with status enums. If WASM exceeds 50KB: evaluate `ascent_run!` as a runtime alternative. If instructions exceed 100K: profile the Datalog query to identify bottleneck (join cost, fact materialization). Create RE- result entry regardless.
