---
task: EAT Ground Strength Ranker
slug: 20260404-150100_eat-ground-strength-ranker
effort: small
phase: complete
progress: 0/5
mode: dev-job
started: 2026-04-04T15:00:00Z
updated: 2026-04-04T15:00:00Z
ladder_refs: [HY-00052, ID-00086]
domain: legal-strategy
canisters: [legal_analysis, procedural_intel]
---

## Context

10 skeleton grounds for EA-2026-000371. Each has different authority strength, likelihood of success, and strategic value. Ranking enables oral hearing preparation focus. With limited preparation time before the oral hearing, prioritizing the strongest grounds ensures the most impactful arguments receive the most rehearsal and refinement. The 8 supplementary grounds filed 2 Apr 2026 need ranking against the original skeleton grounds to determine optimal presentation order. Impact score: 95.

## Scope

Build types and ranking algorithm within `legal_analysis` and `procedural_intel` canisters to:

1. Model appeal grounds with their supporting authorities
2. Weight authorities by binding hierarchy
3. Compute composite strength scores
4. Output prioritized top-3 grounds for oral hearing preparation

## Acceptance Criteria

- [ ] ISC-1: AppealGround type -- ground_number (u8), summary (String), authorities (Vec<Authority>), strength_rating (f64 0.0-1.0), strategic_value (f64 0.0-1.0), factual_fit (f64 0.0-1.0)
- [ ] ISC-2: AuthorityWeight -- binding hierarchy: Supreme Court (1.0) > Court of Appeal (0.9) > EAT (0.7) > first instance (0.4) > academic/commentary (0.2), with Authority struct containing case_name, citation, court_level, relevance_summary
- [ ] ISC-3: Ranking algorithm -- composite score from authority_weight * factual_fit * judge_likelihood, where authority_weight is max weight from authorities Vec, factual_fit measures how closely facts match authority ratio, judge_likelihood is configurable per-ground estimate
- [ ] ISC-4: Top-3 output -- prioritized grounds for oral hearing preparation, returned as Vec<RankedGround> with rank, ground, composite_score, preparation_notes, sorted descending by composite_score
- [ ] ISC-5: Unit test -- rank all 8 supplementary grounds filed 2 Apr 2026, verify ordering is stable, verify top-3 extraction matches expected strongest grounds, test edge cases (equal scores, zero authorities)

## Dependencies

- EAT skeleton grounds (10 grounds from notice of appeal)
- Supplementary grounds (8 grounds filed 2 Apr 2026)
- Case law authorities cited in each ground

## Evidence

- EAT notice of appeal (EA-2026-000371)
- Supplementary grounds document (filed 2 Apr 2026)
- Case law authorities referenced in grounds

## Out of Scope

- Automatic case law lookup or validation
- Judge profiling or historical outcome analysis
- Brief generation or skeleton argument drafting
- Candid interface (types and ranking logic only)
