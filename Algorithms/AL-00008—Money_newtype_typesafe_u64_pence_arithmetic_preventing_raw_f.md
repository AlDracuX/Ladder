---
id: AL-00008
title: "Money newtype: type-safe u64 pence arithmetic preventing raw f64 casts"
status: complete
created: 2026-03-24
domain: financial-accuracy
tags: [money, newtype, type-safety, precision, settlement]
experiments: [EX-00004]
complexity: low
---

## Description

A `Money(u64)` newtype that wraps pence values for type-safe currency arithmetic. All monetary values are stored as whole pence (1/100 GBP), preventing raw `as f64` casts that risk precision loss. The type provides safe conversion methods (`from_pence`, `from_pounds_f64`, `to_pounds_f64`), saturating arithmetic (`Add`, `Sub`), and rate multiplication with proper rounding. Derives `CandidStorable` for direct use in stable storage.

Chain: EX-00004 -> HY-00008 -> ID-00021 -> SR-00036

## Method

1. **Define the newtype** in a shared package (`packages/awen_types/src/money.rs`):

```rust
#[derive(CandidType, Serialize, Deserialize, Clone, Copy, Debug, Default,
         PartialEq, Eq, PartialOrd, Ord, Hash, CandidStorable)]
pub struct Money(u64);
```

2. **Implement safe constructors** that handle edge cases (NaN, negative, infinity clamp to zero):

```rust
impl Money {
    pub const fn from_pence(pence: u64) -> Self { Self(pence) }
    pub const fn pence(&self) -> u64 { self.0 }

    pub fn from_pounds_f64(pounds: f64) -> Self {
        if !pounds.is_finite() || pounds <= 0.0 { return Self(0); }
        Self((pounds * 100.0).round() as u64)
    }

    pub fn to_pounds_f64(&self) -> f64 { self.0 as f64 / 100.0 }
}
```

3. **Implement saturating arithmetic** (overflow-safe, underflow clamps to zero):

```rust
impl Add for Money {
    type Output = Self;
    fn add(self, rhs: Self) -> Self::Output { Self(self.0.saturating_add(rhs.0)) }
}
impl Sub for Money {
    type Output = Self;
    fn sub(self, rhs: Self) -> Self::Output { Self(self.0.saturating_sub(rhs.0)) }
}
```

4. **Add rate multiplication** for percentage/probability calculations:

```rust
pub fn multiply_rate(&self, rate: f64) -> Self {
    if !rate.is_finite() || rate < 0.0 { return Self(0); }
    let result = self.0 as f64 * rate;
    if result.is_finite() && result >= 0.0 && result <= u64::MAX as f64 {
        Self(result.round() as u64)
    } else { Self(0) }
}
```

5. **Implement Display** with GBP formatting: `£123.45`

6. **Replace raw casts** in canister code: find all `value as f64` patterns involving money, replace with `Money::from_pence(value).to_pounds_f64()` or direct Money operations.

7. **Re-export** from `packages/awen_types/src/lib.rs` so all canisters can `use awen_types::Money`.

## When to Use

- Any canister storing or computing with GBP amounts (settlement offers, schedule of loss, statutory caps, costs analysis)
- Any function that converts between pence and pounds
- Anywhere `as f64` is used on a monetary u64 value
- Settlement valuation calculations, ACAS uplift percentages, Vento band comparisons

## When NOT to Use

- Non-monetary u64 values (timestamps, counters, IDs)
- Rate/percentage values that are inherently f64 (e.g., probability multipliers)
- Display-only formatting where the source is already a string

## Inputs

- `u64` pence value (via `from_pence`)
- `f64` pounds value (via `from_pounds_f64` — rounds to nearest penny)
- `f64` rate for multiplication (via `multiply_rate`)

## Outputs

- `Money` struct (storable in `StableBTreeMap`, serializable via Candid)
- `u64` pence (via `.pence()`)
- `f64` pounds (via `.to_pounds_f64()` — for display/format only)
- `String` (via `Display` — e.g., "£35,000.00")

## Limitations

- Only supports GBP (single-currency assumption throughout codebase)
- `from_pounds_f64` still involves an `as u64` cast internally — but it's bounded by the `round()` + finite check
- No support for negative amounts (negative pounds clamp to zero) — this is intentional for tribunal compensation contexts
- `to_pounds_f64()` and `multiply_rate()` use f64 internally — the type prevents *accidental* casts, not all floating-point operations
- Does not handle sub-penny precision (e.g., interest calculations needing more than 2 decimal places)

## Evidence

- **EX-00004**: Created Money newtype, refactored settlement canister. 25 raw `as f64` casts eliminated. All 552 settlement tests pass with zero regressions. 20 Money-specific unit tests cover roundtrip, saturation, edge cases (NaN, infinity, negative).
- **RE-00007**: PASSED — 54% reduction in raw casts. Remaining 21 casts are non-money values (rates, percentages, test code).
- Source file: `packages/awen_types/src/money.rs` (260 lines)
