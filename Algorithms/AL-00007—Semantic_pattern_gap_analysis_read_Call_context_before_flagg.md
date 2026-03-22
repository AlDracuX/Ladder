---
id: AL-00007
title: "Semantic pattern gap analysis: read Call context before flagging missing patterns"
status: complete
created: 2026-03-22
domain: "dev-tooling"
tags: [gap-analysis, false-positive-prevention, semantic-analysis]
experiments: [EX-00002]
complexity: low
---

## Description

When checking whether a canister implements a pattern (e.g., idempotency, CallerGuard, quota), don't rely on keyword grep alone. Read the surrounding code context to understand whether the pattern is actually needed.

## Method

1. **Grep for the trigger keyword** (e.g., `Call::`, `#[update]`, `impl Storable`)
2. **Read 5-10 lines of context** around each match
3. **Classify the usage**:
   - Read-only query → pattern may not apply (e.g., idempotency not needed for `get_stats`)
   - State-modifying write → pattern likely needed
   - Commented out / TODO → pattern not yet relevant
4. **Only flag as "missing"** if the usage is state-modifying AND the protective pattern is absent

## When to Use

- Cross-canister gap analysis (pollinator)
- Audit finding verification
- Pattern propagation assessment
- Any time grep-based detection flags a "missing" pattern

## Inputs

- Pattern to check (AL- entry with keywords and applicability rules)
- Target canisters to scan
- Source code context (5-10 lines around each keyword match)

## Outputs

- Qualified gap assessment: MISSING (write path, pattern absent) / FALSE POSITIVE (read-only, pattern not needed) / N/A (not applicable)

## Limitations

- Requires semantic understanding (LLM or human review) — cannot be fully automated with grep
- Some patterns apply to reads too (e.g., CallerGuard blocks anonymous access on all methods)

## Evidence

- RE-00003: 5 canisters flagged as "missing idempotency" were all read-only queries (false positive)
- SR-00027: Pollinator grep for `Call::` cannot distinguish reads from writes
