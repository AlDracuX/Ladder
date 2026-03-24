---
id: RE-00008
title: "NEGATIVE: decoding_quota not available as update macro attribute in ic-cdk 0.19.0"
status: complete
created: 2026-03-24
experiment: EX-00009
outcome: negative
tags: [security, decoding-quota, ic-cdk, deserialization]
loops_to: [SR-00025, ID-00012]
---

## Summary

The hypothesis HY-00015 proposed adding `#[decoding_quota(N)]` to all `#[update]` endpoints to reject deserialization bombs. Source code inspection of ic-cdk-macros 0.19.0 confirms this attribute does NOT exist. The `#[update]` proc macro only supports: name, guard, decode_with, encode_with, manual_reply, composite, hidden, crate. No `decoding_quota` parameter is available.

## Data

### ic-cdk-macros 0.19.0 ExportAttributes (line 12-35 of export.rs)

```rust
#[derive(Default, FromMeta)]
struct ExportAttributes {
    pub name: Option<String>,
    pub guard: Vec<String>,
    pub decode_with: Option<String>,
    pub encode_with: Option<String>,
    pub manual_reply: bool,
    pub composite: bool,
    pub hidden: bool,
    pub cratename: Option<String>,
}
```

No `decoding_quota` field exists.

### Default deserialization behavior (line 256-259 of export.rs)

The `#[update]` macro generates:
```rust
let mut decoder_config = ::candid::DecoderConfig::new();
decoder_config.set_skipping_quota(10000);
let (args) = ::candid::utils::decode_args_with_config(&arg_bytes, &decoder_config).unwrap();
```

- `skipping_quota(10000)` IS set by default (partial protection)
- `set_decoding_quota()` is NOT called (no protection against deep/large valid payloads)

### Where decoding_quota exists in ic-cdk 0.19.0

Only in the outbound Call builder API (`ic_cdk::api::call::DecoderConfig`) for inter-canister call response decoding. Not for incoming endpoint argument deserialization.

### Endpoint count (188 total across 9 canisters)

| Canister | Count |
|----------|-------|
| procedural_intel | 32 |
| legal_analysis | 29 |
| evidence_vault | 25 |
| case_hub | 24 |
| case_timeline | 20 |
| deadline_alerts | 19 |
| settlement | 16 |
| reference_shield | 14 |
| mcp_gateway | 9 |

### decode_with alternative assessment

The `decode_with` attribute allows custom decoders but requires per-endpoint type-matched functions. For 188 endpoints with different argument types, this is impractical without a custom proc macro wrapper. Not viable as a direct approach.

## Analysis

**The hypothesis is DISPROVED for ic-cdk 0.19.0.** The `decoding_quota` concept exists in the ic-cdk codebase but only for outbound call response decoding, not for inbound endpoint argument deserialization.

The existing `skipping_quota(10000)` default provides partial protection against payloads with unexpected fields, but does NOT protect against deeply nested or large payloads that match the expected types.

This is a gap in ic-cdk's security surface: there is no first-class way to limit deserialization work for incoming Candid payloads on `#[update]` or `#[query]` endpoints.

## Outcome

**NEGATIVE** -- The proposed approach is not implementable in ic-cdk 0.19.0. The attribute does not exist.

### Actionable Next Steps

1. **New Source (SR)**: Document this gap as a finding for upstream ic-cdk feature request
2. **New Idea (ID)**: Create an `awen_macros::update` proc macro wrapper that injects `set_decoding_quota()` into the generated decoder, providing the protection HY-00015 intended
3. **New Hypothesis (HY)**: Test whether a custom `awen_update` proc macro can transparently add decoding_quota to all endpoints without modifying the ic-cdk dependency
4. **Upstream**: File feature request on dfinity/cdk-rs for `decoding_quota` parameter on `#[update]`/`#[query]` macros

## Loop

- [x] New source identified -- ic-cdk 0.19.0 lacks decoding_quota on endpoint macros (gap finding)
- [x] New idea suggested -- Custom awen_macros::update wrapper with decoding_quota injection
- [x] New hypothesis formed -- Test awen_update proc macro approach
- [ ] Algorithm validated
- [x] Problem redefined -- The attack surface exists but requires macro-level solution, not attribute

## Lessons Learned

1. Always verify proc macro attribute availability in source before assuming from documentation patterns
2. The existence of a concept in one part of a library (Call builder) does not guarantee it exists in another (endpoint macros)
3. ic-cdk's deserialization protection is partial: `skipping_quota` is set but `decoding_quota` is not
4. Negative experimental results are valuable -- they prevent 188 failed edits across 9 canisters
5. The `decode_with` mechanism exists as a potential injection point for custom security but needs macro tooling to be practical at scale
