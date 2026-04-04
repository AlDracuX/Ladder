---
id: SR-00067
title: "Versioned stable memory protocol: first-byte version indicator for upgrade-safe format migrations"
type: paper
url: "https://mmapped.blog/posts/01-effective-rust-canisters"
status: draft
created: 2026-03-27
tags: [stable-memory, upgrades, versioning]
domain: "all-canisters"
relevance: "high"
---

## Summary

Reserve the first byte of stable memory as a version indicator to accommodate future serialization format changes. This prevents fragile format-guessing logic during upgrades and enables clean multi-stage upgrade procedures if the stable memory layout needs to change. Recommended by Roman Kashitsyn (DFINITY) in "Effective Rust Canisters."

## Key Points

- Reserve byte 0 of stable memory as a version tag (e.g., 0x01 for current format)
- On `post_upgrade`, read the version byte first to determine deserialization strategy
- Enables multi-stage upgrades: v1→v2 migration code runs once, then sets byte to 0x02
- Prevents the "guess the format" antipattern where upgrades try multiple deserializers
- Works alongside `ic-stable-structures` MemoryManager by reserving a dedicated MemoryId

## Connection to Problems

All 9 Awen canisters use `ic-stable-structures` StableBTreeMap for persistence. Currently, none include a version indicator in their stable memory layout. If we ever need to change the serialization format (e.g., adding fields to Storable types, changing Candid encoding), there is no mechanism to detect the old format and migrate. This is especially critical for `evidence_vault` (immutable evidence) and `case_timeline` (legal records) where data loss is unacceptable.

## Potential Ideas

- Add a `STABLE_MEMORY_VERSION: u8` constant to each canister's state module
- Create a shared `awen_types::stable_version` module with read/write helpers
- Implement version-aware `post_upgrade` hooks that can handle format migrations
