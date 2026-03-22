---
id: SR-00003
title: "PAI Skills Consistently Underutilized During Execution"
type: telemetry
url: ""
status: active
created: 2026-03-22
tags: [pai, skills, capability-audit, reflections]
domain: "pai-optimization"
relevance: "7+ reflections note skills that could have been used but weren't — capability audit isn't driving execution"
---

## Summary

Despite the algorithm's capability audit scanning 25 categories in OBSERVE, reflections repeatedly note that available skills weren't used during execution. The audit identifies capabilities but doesn't create binding commitments to use them.

## Key Points

- "Could have used /simplify to review code quality post-creation" (2026-03-21, 2026-03-20)
- "Could have used /batch skill for the 39 skill edits" (2026-03-21)
- "Could have used /batch for multi-file frontmatter additions" (2026-03-21)
- "VaultHealth skill would give Obsidian CLI backlink detection more accurate than grep" (2026-03-20)
- "Could have used CreateSkill to validate structure" (2026-03-19)
- "Research skill could have been used to verify inquiry status" (2026-03-18)
- Pattern: capability audit is passive (lists skills) rather than active (commits to using them)

## Connection to Problems

The capability audit in OBSERVE produces a list but doesn't generate ISC criteria like "Skill X used for task Y". Skills are known but not committed to.

## Potential Ideas

- Make capability audit produce "WILL USE" commitments, not just awareness
- Add a PLAN-phase skill binding step: for each identified skill, create an ISC criterion
- Track skill utilization rate per session as a meta-metric
