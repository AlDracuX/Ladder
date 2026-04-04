---
id: EX-00032
title: "Introduce Cycles u128 newtype and verify zero raw cycle arithmetic remains across 9 canisters"
status: draft
created: 2026-03-27
hypothesis: HY-00023
algorithm: AL-00008
tags: [cycles, newtype, type-safety, mcp-gateway, awen-types, refactor]
methodology: "Grep baseline count of raw cycle API usage, define Cycles(u128) in awen_types with arithmetic traits and Storable, wrap all cycle API calls in 9 canisters, verify zero raw usage remains and all tests pass"
duration: "6 hours"
success_criteria: "Zero raw u128 cycle arithmetic in src/; Cycles newtype has Add/Sub/Ord/Display/Storable; all existing tests pass"
---

## Objective

Eliminate all raw `u128` cycle arithmetic across 9 canisters by introducing a `Cycles(u128)` newtype in `awen_types`, following the same pattern as the Money newtype (AL-00008) that eliminated pence/pound confusion in settlement. Raw u128 is used for timestamps, byte sizes, record counts, AND cycles -- mixing them is a type confusion bug. The Cycles newtype catches unit mismatches at compile time.

## Methodology

1. **Baseline: count all raw cycle API usage sites**
   ```bash
   cd /mnt/media_backup/PROJECTS/awen-network-canisters
   # Count raw cycle API calls
   rg 'canister_balance128|msg_cycles_available|msg_cycles_accept|msg_cycles_refunded' \
     src/ --count-matches
   # Count raw u128 arithmetic on cycle values (heuristic: assignments from cycle APIs)
   rg 'let.*: u128.*=.*canister_balance|let.*cycles.*: u128' src/ --count-matches
   # Check mcp_gateway rate limiter for cycle tracking
   rg 'cycles' src/mcp_gateway/src/ -C 2
   # Check case_hub cycle estimation
   rg 'cycles' src/case_hub/src/ -C 2
   ```
   Record total count as baseline. Expected: multiple sites in mcp_gateway and case_hub.

2. **Define Cycles newtype in awen_types**
   ```rust
   // packages/awen_types/src/cycles.rs (new file)
   use candid::{CandidType, Deserialize};
   use std::fmt;
   use std::ops::{Add, Sub};

   /// Strongly-typed wrapper for IC cycle counts.
   /// Prevents mixing cycles with other u128 values (timestamps, byte sizes).
   #[derive(CandidType, Deserialize, Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Default)]
   pub struct Cycles(pub u128);

   impl Cycles {
       pub const ZERO: Self = Self(0);
       pub fn new(value: u128) -> Self { Self(value) }
       pub fn get(self) -> u128 { self.0 }
       pub fn saturating_sub(self, other: Self) -> Self { Self(self.0.saturating_sub(other.0)) }
       pub fn saturating_add(self, other: Self) -> Self { Self(self.0.saturating_add(other.0)) }
       pub fn checked_sub(self, other: Self) -> Option<Self> { self.0.checked_sub(other.0).map(Self) }
   }

   impl Add for Cycles {
       type Output = Self;
       fn add(self, rhs: Self) -> Self { Self(self.0 + rhs.0) }
   }

   impl Sub for Cycles {
       type Output = Self;
       fn sub(self, rhs: Self) -> Self { Self(self.0 - rhs.0) }
   }

   impl fmt::Display for Cycles {
       fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
           write!(f, "{} cycles", self.0)
       }
   }

   // Storable impl for upgrade persistence
   impl Storable for Cycles { /* Candid serialization */ }
   ```

3. **Create wrapper functions for IC cycle APIs**
   ```rust
   // packages/awen_types/src/cycles.rs
   /// Safe wrapper for ic_cdk::api::canister_balance128()
   pub fn canister_balance() -> Cycles {
       Cycles(ic_cdk::api::canister_balance128())
   }

   /// Safe wrapper for ic_cdk::api::msg_cycles_available128()
   pub fn msg_cycles_available() -> Cycles {
       Cycles(ic_cdk::api::call::msg_cycles_available128())
   }

   /// Safe wrapper for ic_cdk::api::msg_cycles_accept128()
   pub fn msg_cycles_accept(max: Cycles) -> Cycles {
       Cycles(ic_cdk::api::call::msg_cycles_accept128(max.0))
   }
   ```

4. **Replace all raw cycle usage across 9 canisters**
   ```bash
   # For each canister, replace raw cycle API calls with Cycles wrappers
   # Example transformation in mcp_gateway:
   # BEFORE: let balance: u128 = ic_cdk::api::canister_balance128();
   # AFTER:  let balance: Cycles = awen_types::cycles::canister_balance();

   # Verify the replacement compile
   cargo check -p mcp_gateway --target wasm32-unknown-unknown
   cargo check -p case_hub --target wasm32-unknown-unknown
   # ... for all 9 canisters
   ```

5. **Verify zero raw cycle arithmetic remains**
   ```bash
   # After replacement: same grep should return 0 matches
   rg 'canister_balance128|msg_cycles_available128|msg_cycles_accept128|msg_cycles_refunded128' \
     src/ --count-matches
   # Expected: 0 matches (all wrapped via Cycles newtype)
   ```

6. **Run full test suite**
   ```bash
   mise run nextest
   mise run build  # Verify WASM compilation
   mise run check  # fmt + clippy
   ```

## Setup

- Working directory: `/mnt/media_backup/PROJECTS/awen-network-canisters`
- Branch: `experiment/ex-00032-cycles-newtype`
- Dependencies: none new (Cycles type goes in `awen_types` which is already in workspace)
- Reference: AL-00008 (Money newtype pattern) -- same approach, different domain
- Key files:
  - `packages/awen_types/src/lib.rs` -- add `pub mod cycles;`
  - `packages/awen_types/src/cycles.rs` -- new file with Cycles type
  - `src/mcp_gateway/src/lib.rs` -- rate limiter cycle tracking
  - `src/case_hub/src/lib.rs` -- cycle estimation before inter-canister calls
- Build target: wasm32-unknown-unknown (must compile for IC)
- Workspace lints: `unsafe_code = "forbid"`, `unwrap_used = "deny"` apply

## Algorithm

AL-00008: Newtype pattern for domain-specific numeric values. The pattern: define a newtype wrapper, implement arithmetic traits (Add, Sub, Ord), implement Display and Storable, create wrapper functions for raw API calls, replace all raw usage sites. Compiler enforces type safety -- you cannot add `Cycles` to a `u64` timestamp or compare `Cycles` to a byte count without explicit conversion.

## Success Criteria

- [ ] Baseline count of raw cycle API calls documented per canister
- [ ] Cycles(u128) newtype defined in packages/awen_types/src/cycles.rs
- [ ] Cycles implements: Add, Sub, Ord, Display, Default, Clone, Copy, CandidType, Storable
- [ ] Wrapper functions created for canister_balance128, msg_cycles_available128, msg_cycles_accept128
- [ ] All raw cycle API calls in mcp_gateway replaced with Cycles wrappers
- [ ] All raw cycle API calls in case_hub replaced with Cycles wrappers
- [ ] All raw cycle API calls in remaining 7 canisters replaced (if any exist)
- [ ] Post-replacement grep confirms zero raw cycle API calls in src/
- [ ] All existing nextest tests pass (zero regressions)
- [ ] cargo check passes for all 9 canisters (wasm32 target)
- [ ] clippy clean (mise run check passes)

## Data Collection

| Metric | Target | Actual |
|--------|--------|--------|
| Raw cycle API calls (baseline) | TBD (inventory) | TBD |
| Raw cycle API calls per canister | TBD | TBD |
| Raw cycle API calls (after) | 0 | TBD |
| Cycles newtype trait impls | 9 (Add, Sub, Ord, Display, Default, Clone, Copy, CandidType, Storable) | TBD |
| Wrapper functions | 3 (balance, available, accept) | TBD |
| Test regressions | 0 | TBD |
| clippy warnings introduced | 0 | TBD |
| WASM size delta (total across 9) | negligible (<1KB) | TBD |

## Risks & Mitigations

- **Some crates may use cycle values in ways that resist wrapping**: Logging cycle values as raw u128, or passing to Candid interfaces that expect u128. Mitigation: `Cycles` implements `Display` for logging and `CandidType` for serialization. For external interfaces that require raw u128, provide `cycles.get()` method.
- **The newtype may need From<u128> at API boundaries**: External calls or test mocks may fabricate cycle values. Mitigation: provide `Cycles::new(value)` constructor but NOT `impl From<u128>` to prevent implicit conversion. Tests can use `Cycles::new()` explicitly.
- **Test mocks that fabricate cycle values need updating**: Tests may create raw u128 values for cycle-related assertions. Mitigation: update test helpers to use `Cycles::new()`. The BDD crate has relaxed lints so this is straightforward.
- **ic_cdk API may not be available in native test builds**: The wrapper functions call `ic_cdk::api::canister_balance128()` which requires the IC runtime. Mitigation: feature-gate IC API calls behind `#[cfg(target_arch = "wasm32")]` and provide mock implementations for native test builds.

## Results

(Fill in after running)

## Analysis

(Fill in after running)

## Next Steps

If zero raw cycle arithmetic achieved with zero regressions: create RE- result confirming AL-00008 generalizes to cycles domain. Add to CI as a lint check (grep for raw cycle API calls should fail). If some sites resist wrapping: document which sites and why, create follow-up HY- for alternative approaches. Consider extending the newtype pattern to other u64/u128 domains (timestamps, byte sizes).
