---
id: ID-00023
title: "Declarative role-based authorization via Ascent Datalog replacing hardcoded checks"
status: active
updated: 2026-03-23
created: 2026-03-23
sources: [SR-00028]
phase: mate
domain: "security"
tags: [authorization, datalog, ascent, rbac, declarative, policy]
scores:
  feasibility: 4
  novelty: 8
  impact: 5
  elegance: 8
---

## Description

Express canister authorization rules as Ascent Datalog relations instead of hardcoded `is_controller` boolean checks. Define facts like `has_role(principal, "admin")`, `can_access(role, "store_evidence")`, and rules like `authorized(P, M) :- has_role(P, R), can_access(R, M)`. The ascent engine (already in the workspace for legal_analysis claim rules per SR-00028) evaluates these at runtime. This enables multi-role authorization (e.g., "case_manager" role that can view but not delete, "admin" role with full access) without recompiling the canister — roles could be updated via a controller endpoint that modifies the Datalog fact base in stable storage.

## Provenance

Generated during MATE phase from AL-00003 (CallerGuard) × SR-00028 (Ascent Datalog engine). CallerGuard currently supports two levels: anonymous (rejected) and controller (full access), with no intermediate roles. The Ascent engine already compiled into legal_analysis could evaluate richer authorization policies. This is a non-obvious cross-pollination: a legal reasoning engine repurposed for access control.

## Connection

Would require changes to `awen_types/src/security.rs` (AuthContext role resolution), and any canister wanting multi-role auth. Highest value in `evidence_vault` (solicitor access vs. client access) and `case_hub` (case manager vs. owner). Currently overkill for the 9-canister system where controllers are the only privileged role, but becomes valuable if Awen supports multi-user organizations or solicitor delegation.

## Next Steps

- Hypothesis: "Ascent Datalog authorization resolves role checks within 1ms per query, meeting IC instruction budget"
- First test: add a simple two-role policy to evidence_vault and benchmark ascent evaluation cost vs. current boolean check
- Risk: Datalog evaluation adds latency to every authenticated call — must be negligible
