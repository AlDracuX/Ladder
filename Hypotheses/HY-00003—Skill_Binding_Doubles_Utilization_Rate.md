---
id: HY-00003
title: "Skill Binding Commitments Double Utilization Rate"
status: active
created: 2026-03-22
idea: ID-00003
tags: [skills, binding, utilization, measurement]
prediction: "Converting capability audit to binding ISC criteria increases skill utilization from ~30% to ~70%"
metric: "Ratio of skills-used to skills-identified-as-relevant per session"
success_criteria: "Baseline: ~30% utilization. Target: ≥60% utilization over 20 sessions"
---

## Hypothesis

If the capability audit generates binding ISC criteria ("Skill X applied to subtask Y") instead of passive awareness, then the ratio of skills actually used to skills identified as relevant will increase from ~30% to at least 60%.

## Rationale

The current audit identifies relevant skills but creates no commitment. ISC criteria are the algorithm's commitment mechanism — if a skill is in the ISC, VERIFY will flag it as failed if unused. This converts voluntary use into obligatory use with accountability.

## Testing Plan

1. Baseline: Review 20 recent sessions, count (skills identified in audit) vs (skills actually invoked)
2. Implement binding: modify capability audit to emit ISC criteria for top-3 relevant skills
3. Run 20 sessions with binding active
4. Measure utilization ratio: skills-invoked / skills-committed
5. Also measure: did forcing skill use improve outcomes? (qualitative review)

## Success Criteria

Utilization ratio ≥60% over 20 sessions. Secondary: no increase in session duration from forced skill use.

## Risks

- Forcing skill use might add unnecessary overhead on simple tasks
- Some skills may be identified as relevant but genuinely not needed
- ISC bloat: too many skill-binding criteria could dilute focus
