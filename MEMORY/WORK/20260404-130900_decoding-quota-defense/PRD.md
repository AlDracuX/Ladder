---
task: Decoding Quota Defense Layer
slug: 20260404-130900_decoding-quota-defense
effort: small
phase: ready
progress: 0/5
mode: dev-job
started: 2026-04-04T13:00:00Z
updated: 2026-04-04T13:00:00Z
ladder_refs: [ID-00012]
domain: dev
canisters: [evidence_vault, case_timeline, deadline_alerts, reference_shield, mcp_gateway, legal_analysis, procedural_intel, case_hub, settlement]
---

## Context

ID-00012. Deserialization attacks are a known cycle-drain vector on the Internet Computer. A malicious caller can craft deeply nested or excessively large Candid payloads that force a canister to burn through cycles during decoding before any business logic executes. ic-cdk 0.19 introduced the decoding_quota attribute which caps the number of Candid decoding steps per call, rejecting oversized payloads early and cheaply.

Currently none of the 9 Awen Network canisters enforce decoding quotas. Every public endpoint is vulnerable to payload-based cycle drain. This PRD applies decoding_quota as a blanket defense across all canisters with a shared macro wrapper to ensure consistency and prevent future endpoints from shipping unprotected.

## Scope

- Create a shared macro wrapper (in awen_types or a dedicated proc-macro crate) that wraps #[update] and #[query] with decoding_quota(1_000_000) enforcement
- Apply the macro to all public endpoints across all 9 canisters
- Add a CI lint step (clippy lint or custom script) that detects any public endpoint missing decoding quota protection
- Verify all existing tests pass with quota enforcement enabled
- Add a load test that confirms large/malicious payloads are rejected before full deserialization

## Acceptance Criteria

- [ ] ISC-1: Shared macro wrapper for #[update] and #[query] that enforces decoding_quota(1_000_000)
- [ ] ISC-2: Applied to all public endpoints across 9 canisters
- [ ] ISC-3: CI lint (clippy or custom) detects unprotected endpoints
- [ ] ISC-4: All existing tests pass with quota enabled
- [ ] ISC-5: Load test -- verify large payloads get rejected before full deserialization

## Dependencies

- None (can run in parallel with everything)
- ic-cdk 0.19+ already in use across the workspace

## Evidence

- **ID-00012**: Identified deserialization attack surface across all canisters

## Out of Scope

- Custom per-endpoint quota tuning (blanket 1M is the starting point; per-endpoint overrides are a future optimization)
- Rate limiting (handled separately by mcp_gateway)
- Other cycle-drain vectors (computation limits, memory attacks)
- Changes to ic-cdk itself
