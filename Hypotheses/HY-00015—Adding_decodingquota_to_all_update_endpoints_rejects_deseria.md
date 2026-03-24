---
id: HY-00015
title: "Adding decoding_quota to all update endpoints rejects deserialization bombs within 1ms"
status: disproved
updated: 2026-03-24
created: 2026-03-24
idea: ID-00012
tags: [security, decoding-quota, deserialization, defense-in-depth]
prediction: "Oversized Candid payloads are rejected before reaching _impl function body"
metric: "response to 10MB Candid payload on all #[update] endpoints"
success_criteria: "all endpoints reject payloads >1MB with decoding error, zero reach business logic"
---

## Hypothesis

If we add `#[decoding_quota(1_000_000)]` (1MB) to all `#[update]` endpoints across 9 canisters, then oversized Candid payloads (>1MB) are rejected at the deserialization layer before any business logic executes, blocking deserialization-bomb attacks.

## Rationale

SR-00025 documented the `decoding_quota` attribute from ic-cdk which limits Candid deserialization depth and size. ID-00012 proposes applying it across all 9 canisters. Without this, a malicious caller can send deeply nested or very large Candid payloads that consume excessive instructions during deserialization, potentially draining cycles.

## Testing Plan

1. Count all `#[update]` endpoints: `rg '#\[update\]' src/ --count`
2. Add `#[decoding_quota(1_000_000)]` attribute to each `#[update]` function
3. `cargo check --workspace` — verify compilation
4. PocketIC test: send a 10MB Candid payload to `store_evidence` — should get decoding error
5. PocketIC test: send normal-sized payload — should succeed as before

## Success Criteria

- Primary: 10MB payload rejected before reaching `store_evidence_impl`
- Secondary: all normal integration tests still pass
- Tertiary: no instruction count increase for normal-sized payloads

## Risks

- Some endpoints legitimately accept large payloads (e.g., evidence upload) — may need per-endpoint quota tuning
- `decoding_quota` may not be available in our ic-cdk version — need to verify 0.19+ support

## Experiment Result

**DISPROVED** via EX-00009 / RE-00008 (2026-03-24).

`decoding_quota` does NOT exist as a proc macro attribute on `#[update]` in ic-cdk 0.19.0. The `ExportAttributes` struct in ic-cdk-macros only supports: name, guard, decode_with, encode_with, manual_reply, composite, hidden, crate. The concept exists only in the outbound Call builder API for inter-canister call response decoding.

Existing partial protection: `skipping_quota(10000)` is set by default on all endpoints.

Next step: Create custom `awen_macros::update` wrapper or file upstream feature request.
