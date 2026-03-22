---
id: EX-00003
title: "Measure Skill Binding Effect on Utilization Rate"
status: testing
created: 2026-03-22
hypothesis: HY-00003
algorithm: AL-00001
tags: [skills, binding, utilization, measurement]
methodology: "before-after comparison with ISC tracking"
duration: "4 weeks"
success_criteria: "Skill utilization ratio ≥60% over 20 sessions"
---

## Objective

Test whether converting the capability audit from passive awareness to binding ISC criteria doubles skill utilization rate.

## Methodology

1. **Baseline measurement** (week 0): Review last 20 sessions' reflections. For each, count:
   - Skills mentioned in capability audit or hook hints (identified)
   - Skills actually invoked via Skill tool or skill-specific patterns (used)
   - Ratio = used / identified

2. **Intervention** (week 1): Modify OBSERVE phase to add after capability audit:
   ```
   SKILL BINDING (mandatory for Standard+):
   - From audit, select top-3 most relevant skills
   - Create ISC: "Skill [name] applied to [specific subtask]"
   - VERIFY must confirm each bound skill was used or explicitly waived with reason
   ```

3. **Measurement period** (weeks 2-4): Track utilization ratio per session.

4. **Analysis** (week 4): Compare baseline ratio vs. intervention ratio.

## Setup

- Access to algorithm-reflections.jsonl
- Write access to Algorithm spec
- Session logs for skill invocation tracking

## Success Criteria

- Primary: Utilization ratio increases from ~30% to ≥60%
- Secondary: No increase in ISC count beyond +3 per session
- Tertiary: Qualitative improvement in outcomes for skill-heavy sessions

## Data Collection

- Count Skill tool invocations per session
- Count capability audit skill mentions per session
- Track ISC pass/fail for skill-binding criteria

## Results

### Baseline (2026-03-22)
- **Total sessions:** 134
- **Skill regret rate:** 78.4% (105/134 sessions mention skills they should/could have used)
- **No-skills-needed rate:** 11.9% (16/134 sessions)
- **Skill opportunity mentions in Q3:** 87.3% (117/134)
- **Gate implemented:** Algorithm v3.8.0.md CAPABILITY SELECTION section, mandatory for Standard+
- **Measurement start:** 2026-03-22
- **Next measurement:** After 20 sessions post-gate

## Analysis

(Pending)

## Next Steps

If validated → make skill binding permanent in Algorithm spec.
If failed → investigate whether top-3 selection is picking genuinely relevant skills.
