---
id: ID-00012
title: "Decoding quota defense layer across all 9 canisters"
status: archived
created: 2026-03-23
updated: 2026-03-24
sources: [SR-00025]
phase: dream
domain: "security-hardening"
tags: [security, decoding-quota, deserialization, defense-in-depth]
scores:
  feasibility: 85
  novelty: 40
  impact: 75
  elegance: 70
---

## Description

Apply the `decoding_quota` attribute from ic-cdk (SR-00025) to every `#[update]` and `#[query]` endpoint across all 9 canisters as a workspace-wide security hardening standard. Create a shared macro or attribute wrapper that enforces decoding limits by default, so new endpoints get protection automatically.

This is a "security by default" pattern — rather than relying on developers to remember, the infrastructure enforces it.

## Provenance

DREAM phase: free-association from SR-00025 (decoding_quota API). The leap: don't apply it surgically to "risky" endpoints — apply it everywhere as a blanket defense layer, like a firewall rule. What if deserialization limits were as standard as anonymous principal rejection?

## Connection

Addresses deserialization attack surface. Currently no canister uses decoding_quota. A single malformed payload could exhaust cycles. This makes Awen resilient to an entire class of DoS attacks.

## Next Steps

Hypothesis: Adding decoding_quota(1_000_000) to all public endpoints causes zero regression in existing tests while blocking payloads >1MB.
