---
task: Strike-Out Case Law Matrix
slug: 20260404-160100_strike-out-case-law-matrix
effort: small
phase: complete
progress: 0/5
mode: dev-job
started: 2026-04-04T16:01:00Z
updated: 2026-04-04T16:01:00Z
ladder_refs: [HY-00062, ID-00097]
domain: legal-precedent
canisters: [legal_analysis]
---

## Context

The EAT appeal (EA-2025-001649-AT) requires a skeleton argument that maps each cited authority directly to specific paragraphs of the written reasons being challenged. Currently, precedent references exist but lack structured mapping to the written reasons paragraphs they attack. A direct authority-to-paragraph mapping strengthens the appeal by making the error in each paragraph immediately visible to the EAT judge, with the applicable legal test sitting right next to the error it exposes. This matrix transforms a list of authorities into a precision-targeted attack framework.

## Scope

- Define CaseLawEntry type in legal_analysis canister for authority records
- Define WrittenReasonsMapping type linking precedents to specific written reasons paragraphs
- Implement authority hierarchy weighting (Supreme Court > Court of Appeal > EAT > ET)
- Build coverage checker identifying which written reasons paragraphs lack authority challenge
- Unit tests mapping top 5 strike-out authorities to written reasons paragraphs

## Acceptance Criteria

- [ ] ISC-1: CaseLawEntry type with fields: case_name, citation, court (enum), ratio, application_to_case
- [ ] ISC-2: WrittenReasonsMapping type with fields: precedent_id, wr_paragraph (u32), error_identified, ground_number (u32)
- [ ] ISC-3: Authority hierarchy ranking: Supreme Court (weight 4) > Court of Appeal (3) > EAT (2) > ET (1) used for sorting and strength assessment
- [ ] ISC-4: Coverage checker function returning list of written reasons paragraphs that have no authority challenge mapped
- [ ] ISC-5: Unit test mapping top 5 strike-out authorities to written reasons paragraphs with correct hierarchy weights

## Dependencies

- legal_analysis canister stable storage for new types
- Written reasons document paragraph numbering must be stable (reference document already filed)

## Evidence

- **HY-00062**: Hypothesis that structured authority-to-paragraph mapping improves appeal skeleton persuasiveness
- **ID-00097**: Idea for case law matrix with impact score 90
- Written reasons from EJ Leverson (1 Apr 2025) -- paragraph-numbered document
- EAT appeal EA-2025-001649-AT -- grounds of appeal already drafted

## Out of Scope

- Full skeleton argument drafting (this is the data layer, not the document)
- Authorities unrelated to strike-out (e.g., substantive discrimination law)
- Automated case law research or discovery
- Citation formatting or Blue Book compliance
- Frontend display of the matrix
