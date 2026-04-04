---
id: SR-00069
title: "serde_bytes optimization: 10x instruction reduction for byte array serialization in canisters"
type: paper
url: "https://mmapped.blog/posts/01-effective-rust-canisters"
status: draft
created: 2026-03-27
tags: [performance, serialization, optimization]
domain: "evidence_vault, legal_analysis"
relevance: "medium"
---

## Summary

Applying the `serde_bytes` crate wrapper or `ByteBuf` type to byte array fields (`Vec<u8>`, `[u8; N]`) in serializable structures reduces instruction consumption by ~10x. Without it, serde serializes each byte individually as a separate integer element. With `serde_bytes`, the entire byte slice is serialized as a contiguous blob. Documented in "Effective Rust Canisters" — the unoptimized version consumes 130M instructions to encode 1MB vs 12M with `serde_bytes`.

## Key Points

- Default serde treats `Vec<u8>` as a sequence of integers, serializing each byte separately
- `#[serde(with = "serde_bytes")]` annotation switches to bulk byte serialization
- 130M → 12M instructions for 1MB encoding (10.8x improvement)
- Applies to any struct field containing binary data: hashes, signatures, encrypted blobs, file content
- `ByteBuf` type is the owned equivalent for standalone byte vectors
- Zero code change beyond adding the annotation — no logic modifications needed

## Connection to Problems

`evidence_vault` stores SHA-256 hashes (32 bytes per evidence item) and potentially binary evidence content. `legal_analysis` processes document content that may include binary sections. `mcp_gateway` serializes request/response payloads that can contain arbitrary binary data. If any of these use `Vec<u8>` fields without `serde_bytes`, they're paying a 10x instruction overhead on every serialization.

## Potential Ideas

- Grep for `Vec<u8>` in all Storable/Serialize types and add `serde_bytes` annotations
- Add `serde_bytes` as a workspace dependency if not already present
- Benchmark before/after instruction counts for evidence_vault store operations
