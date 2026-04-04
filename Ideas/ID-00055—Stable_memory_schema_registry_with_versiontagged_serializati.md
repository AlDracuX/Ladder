---
id: ID-00055
title: "Stable memory schema registry with version-tagged serialization for backward-compatible canister upgrades"
status: draft
created: 2026-03-27
sources: [SR-00004, SR-00035, SR-00043]
phase: dream
domain: "architecture"
tags: [stable-memory, upgrade, schema-versioning, migration, backward-compatibility]
scores:
  feasibility: 5
  novelty: 7
  impact: 8
  elegance: 7
---

## Description

Reserve a dedicated MemoryId (e.g., MemoryId(0)) in each canister's MemoryManager as a schema registry. Store a version tag (u32) plus a serialized manifest of all StableBTreeMap memory IDs, their key/value type names, and serialization format version. On post_upgrade, read the registry first — if the stored version is older than the code's expected version, run migration functions that transform data in-place (or copy-and-swap) before the canister resumes serving requests. Combined with SR-00043's snapshot APIs, a failed migration can be rolled back to the pre-upgrade snapshot automatically.

## Provenance

Generated during dream phase from [SR-00004, SR-00035, SR-00043]. Theme: architecture. SR-00004 identified that stable structure upgrade paths are untested. SR-00035 revealed the dual-MemoryManager bug in legal_analysis, showing how memory layout assumptions can silently corrupt data. SR-00043 introduced snapshot APIs that enable safe rollback if a migration fails.

## Connection

Addresses the risk of data loss or corruption during canister upgrades when Storable serialization formats change. All 9 canisters use StableBTreeMap and would benefit from a versioned schema. Particularly relevant for evidence_vault (immutable evidence integrity) and settlement (financial data correctness). Complements ID-00004 (upgrade test harness) by providing the actual migration mechanism that the harness would test.

## Next Steps

Hypothesis: "A schema registry in MemoryId(0) enables automated detection of stale data formats during post_upgrade, preventing silent deserialization failures." Test by adding a schema version to one canister, changing a Storable type's serialization, and verifying the migration runs correctly on upgrade in PocketIC.
