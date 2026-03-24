---
id: EX-00009
title: "Add decoding_quota attribute to all update endpoints across 9 canisters"
status: complete
created: 2026-03-24
hypothesis: HY-00015
algorithm:
tags: [security, decoding-quota, deserialization, ic-cdk, defense-in-depth]
methodology: "Source code inspection of ic-cdk-macros 0.19.0 + compilation test"
duration: "30 minutes"
success_criteria: "Determine if #[decoding_quota(N)] attribute exists on #[update] macro, and if not, identify alternative approach"
---

## Objective

Test whether `decoding_quota` can be added as a proc macro attribute to all `#[update]` endpoints across 9 canisters to reject deserialization bombs, as hypothesized in HY-00015.

## Methodology

1. Inspect ic-cdk-macros 0.19.0 source to verify if `decoding_quota` is a supported attribute parameter on `#[update]`
2. Document what parameters ARE available on `#[update]`
3. Identify what decoding protection already exists by default
4. If attribute exists: add to all 188 `#[update]` endpoints, compile, test
5. If attribute does not exist: document the gap, evaluate `decode_with` alternative, create actionable recommendation

## Setup

- ic-cdk version: 0.19.0 (workspace dependency)
- ic-cdk-macros version: 0.19.0
- Target: 9 canisters with 188 total `#[update]` endpoints
- Canisters: evidence_vault (25), legal_analysis (29), procedural_intel (32), case_hub (24), case_timeline (20), deadline_alerts (19), settlement (16), reference_shield (14), mcp_gateway (9)

## Algorithm

### Step 1: Source Inspection
Read `ExportAttributes` struct in ic-cdk-macros-0.19.0/src/export.rs to determine available `#[update]` parameters.

### Step 2: Default Protection Audit
Check what deserialization protection the macro already applies by default.

### Step 3: Gap Analysis
Compare what HY-00015 proposes vs what is actually available.

### Step 4: Alternative Evaluation
Assess `decode_with` custom decoder as an alternative mechanism.

## Success Criteria

- PRIMARY: Determine availability of `decoding_quota` attribute on `#[update]`
- SECONDARY: Document existing default protections
- TERTIARY: Provide actionable recommendation for achieving the hypothesis goal

## Data Collection

### ic-cdk-macros 0.19.0 ExportAttributes

Available `#[update]` parameters (from darling-derived struct):
- `name: Option<String>` -- custom export name
- `guard: Vec<String>` -- guard function(s)
- `decode_with: Option<String>` -- custom argument decoder function
- `encode_with: Option<String>` -- custom return encoder function
- `manual_reply: bool` -- manual reply mode
- `composite: bool` -- composite query (query-only)
- `hidden: bool` -- hide from Candid export
- `crate: Option<String>` -- custom crate path

**FINDING: `decoding_quota` is NOT a supported parameter on `#[update]`.**

### Default Deserialization Protection

The `#[update]` macro expansion (line 256-259 of export.rs) generates:
```rust
let arg_bytes = ::ic_cdk::api::msg_arg_data();
let mut decoder_config = ::candid::DecoderConfig::new();
decoder_config.set_skipping_quota(10000);
let (args) = ::candid::utils::decode_args_with_config(&arg_bytes, &decoder_config).unwrap();
```

- `skipping_quota(10000)` IS set by default (limits work for skipping unneeded fields)
- `decoding_quota` is NOT set (no limit on decoding work for the actual expected fields)

### Where decoding_quota EXISTS in ic-cdk 0.19.0

The `decoding_quota` field exists ONLY in the `DecoderConfig` struct used by the **outbound Call builder API** (for inter-canister call response decoding):
```rust
// In ic_cdk::api::call
pub struct DecoderConfig {
    pub decoding_quota: Option<usize>,
    pub skipping_quota: Option<usize>,
    pub debug: bool,
}
```

This is for controlling how responses from OTHER canisters are decoded, not how incoming arguments to YOUR endpoints are decoded.

### Update Endpoint Count by Canister

| Canister | #[update] count |
|----------|----------------|
| procedural_intel | 32 |
| legal_analysis | 29 |
| evidence_vault | 25 |
| case_hub | 24 |
| case_timeline | 20 |
| deadline_alerts | 19 |
| settlement | 16 |
| reference_shield | 14 (13 lib.rs + 1 vc_issuer.rs) |
| mcp_gateway | 9 |
| **TOTAL** | **188** |

## Results

**NEGATIVE RESULT: `#[decoding_quota(N)]` does NOT exist as a proc macro attribute in ic-cdk-macros 0.19.0.**

The hypothesis as stated -- "Adding decoding_quota to all update endpoints" via a `#[decoding_quota(10000)]` attribute -- is NOT implementable in the current ic-cdk version.

However, ic-cdk-macros already provides partial protection via `skipping_quota(10000)` on all endpoints by default. The `decode_with` parameter offers a path to custom decoders that could set `decoding_quota`.

## Analysis

### What is already protected
- All `#[update]` and `#[query]` endpoints already have `skipping_quota(10000)` set, which limits the work done skipping unexpected/unneeded fields in the Candid payload.

### What is NOT protected
- There is no limit on `decoding_quota` for the actual fields being decoded. A deeply nested but structurally valid payload (matching the expected types) can consume unbounded deserialization work.

### The `decode_with` alternative
The `decode_with` parameter on `#[update]` allows specifying a custom decoding function. We could create a shared helper like:
```rust
pub fn decode_with_quota<T: CandidType + for<'a> Deserialize<'a>>(bytes: Vec<u8>) -> T {
    let mut config = DecoderConfig::new();
    config.set_decoding_quota(1_000_000);
    config.set_skipping_quota(10_000);
    candid::utils::decode_args_with_config(&bytes, &config).unwrap_or_default()
}
```
But this requires per-endpoint type signatures and would need 188 individual `decode_with` annotations.

### Recommended approach
1. **Short term**: File an issue/RFC with DFINITY to add `decoding_quota` as a first-class `#[update]` parameter (alongside the existing `skipping_quota` default)
2. **Medium term**: Create a proc macro wrapper `#[awen_update(decoding_quota = 1_000_000)]` that generates the custom decoder
3. **Long term**: Wait for ic-cdk to natively support `decoding_quota` in the macro expansion

## Next Steps

1. Create a new hypothesis HY-XXXXX for the `decode_with` approach
2. File upstream feature request for ic-cdk `decoding_quota` macro parameter
3. Consider creating `awen_macros::update` wrapper that adds quota by default
4. Mark HY-00015 as "disproved (not available)" with pointer to this experiment
