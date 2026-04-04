---
id: SR-00049
title: "Retrospective: decoding_quota attribute does not exist in ic-cdk 0.19 macros"
type: retrospective
url: ""
status: archived
updated: 2026-03-26
created: 2026-03-24
tags: [ic-cdk, decoding-quota, negative-result, api-gap]
domain: "canister-security"
relevance: "medium"
---

## Summary

Experiment EX-00009 proved that `#[decoding_quota]` does not exist as a proc macro attribute in `ic-cdk 0.19.0`. Inspection of the `ic-cdk-macros 0.19.0` source code revealed that `ExportAttributes` only supports: `name`, `guard`, `decode_with`, `encode_with`, `manual_reply`, `composite`, `hidden`, `crate`. There is no `quota` or `decoding_quota` field. SR-00025, which claimed this attribute existed, was based on documentation describing a planned but unimplemented feature. This is a negative result that corrects the pipeline's knowledge.

## Key Points

- `#[decoding_quota]` does not exist in `ic-cdk-macros 0.19.0` — confirmed by source code inspection
- `ExportAttributes` struct supports only 8 fields: name, guard, decode_with, encode_with, manual_reply, composite, hidden, crate
- SR-00025 was based on documentation describing a planned but never-implemented feature
- HY-00015 (hypothesis that decoding_quota reduces attack surface) is disproved
- The feature may arrive in a future ic-cdk version but is not available today
- Payload size limits must be enforced through alternative mechanisms

## Connection to Problems

Without `#[decoding_quota]`, canisters remain vulnerable to oversized Candid payload attacks that could exhaust cycles during deserialization. This is a real security gap in the IC ecosystem. The negative result means SR-00025's recommendations cannot be implemented as described, and any ideas or hypotheses derived from it need correction. It also highlights the risk of treating documentation as proof of implementation.

## Potential Ideas

- Implement manual payload size checking in `inspect_message` as an alternative to `decoding_quota`
- Create a guard function that rejects calls with payloads exceeding a configurable byte threshold
- Monitor ic-cdk releases for when `decoding_quota` actually ships and create a follow-up SR
- Add a custom `#[max_payload(bytes)]` attribute macro that wraps endpoint functions with size checks
