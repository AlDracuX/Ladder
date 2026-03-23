---
id: SR-00016
title: "Gap: 5 canisters missing idempotency on inter-canister calls (AL-00002)"
type: observation
url: ""
status: active
created: 2026-03-22
tags: [idempotency, inter-canister, reliability, saga]
domain: "reliability"
relevance: "high"
---

## Summary

5 of 9 canisters (evidence_vault, mcp_gateway, legal_analysis, procedural_intel, case_hub) make inter-canister calls without idempotency keys. AL-00002 defines the saga pattern with idempotency but it's only partially applied. Consolidates findings from SR-00016 through SR-00020.

## Key Points

- evidence_vault: rollback_evidence called by case_hub saga without idempotency key on the call
- mcp_gateway: call_tool dispatches to other canisters without request deduplication
- legal_analysis: rollback_case_analyses is idempotent by design (deletes are idempotent) but not explicitly keyed
- procedural_intel: advance_sequence_step triggers deadline creation without idempotency
- case_hub: saga begin/complete/fail use saga_id as implicit key but cross-canister calls don't propagate it

## Connection to Problems

Duplicate inter-canister calls on network retry can cause double state mutations. The saga compensation endpoints (rollback_*) are safe because delete is idempotent, but forward operations (store_evidence, add_deadline, create_sequence) are not.

## Potential Ideas

- Apply idempotency_key parameter to all cross-canister #[update] calls (from awen_types::idempotency)
- ID-00002 already proposes this — link there
