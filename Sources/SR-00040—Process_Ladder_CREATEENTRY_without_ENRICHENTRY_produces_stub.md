---
id: SR-00040
title: "Process: Ladder CREATE_ENTRY without ENRICH_ENTRY produces stub entries"
type: retrospective
url: ""
status: active
updated: 2026-03-23
created: 2026-03-23
tags: [ladder, process, enrichment, atomic-operation, workflow]
domain: "ladder-process"
relevance: "high"
---

## Summary

When the Ladder CLI `add` command creates a new source or idea, it writes a stub file with empty Key Points, Summary (just the title repeated), and no frontmatter enrichment (domain, tags, relevance are blank). If the enrichment step is not performed immediately after creation, these stubs accumulate as low-value entries that clutter the pipeline. This was observed when 8 sources were created in batch but none were enriched, requiring a separate manual enrichment pass.

## Key Points

- `bun run ladder add source --title "..."` creates a file with TEMPLATE.md structure but no substantive content
- The stub has `status: draft`, empty `tags: []`, empty `domain: ""`, and empty `relevance: ""`
- Summary section just echoes the title rather than providing an actual summary
- Key Points section contains only a bare `-` with no content
- The two-step process (create then enrich) should be treated as an atomic operation to prevent stub accumulation
- This exact problem occurred with SR-00033 through SR-00040 which were all stubs until this enrichment pass

## Connection to Problems

This is a meta-observation about the Ladder pipeline itself. Stub entries reduce the signal-to-noise ratio in the Sources directory, making it harder to identify which sources have actionable content. For the Dream phase (idea generation), stub sources cannot contribute meaningful connections because they lack the Key Points and Connection sections that inform ideation.

## Potential Ideas

- Modify the Ladder CLI to require enrichment data at creation time (--summary, --key-points flags) or prompt interactively
- Add a "staleness" check that flags draft entries older than 24 hours with empty Key Points as needing attention
