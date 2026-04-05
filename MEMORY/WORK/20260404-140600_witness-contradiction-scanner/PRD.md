---
task: Witness Statement Contradiction Scanner
slug: 20260404-140600_witness-contradiction-scanner
effort: medium
phase: complete
progress: 0/6
mode: dev-job
started: 2026-04-04T14:00:00Z
updated: 2026-04-04T14:00:00Z
ladder_refs: [HY-00044, ID-00070]
domain: legal-evidence
canisters: [legal_analysis, procedural_intel]
---

## Context

TLT Solicitors' witness statements for Bylor Ltd contain at least 7 identified technical errors spread across 4 documents. Sims' statement contains wrong dates in paragraphs 2 and 3, factual misrepresentations in paragraph 10. Bains' statement at paragraph 2 contradicts the employer's own documented position. Manual comparison across statements is exhaustive and risks missing cross-statement inconsistencies.

Automated scanning structures each paragraph as a typed claim (factual, opinion, or legal conclusion), then cross-references same-topic paragraphs across multiple witness statements. Date claims are validated against the known case timeline. The result is a comprehensive contradiction report ranked by severity, enabling targeted cross-examination and skeleton argument construction.

## Scope

- Define `StatementParagraph` type in `legal_analysis` for structured paragraph representation
- Implement `CrossStatementCheck` logic comparing same-topic paragraphs across witnesses
- Build `DateValidator` to extract date claims from paragraphs and cross-reference against known timeline
- Define `ContradictionReport` type for structured output of detected inconsistencies
- Implement severity ranking for contradictions (direct, inferential, temporal)
- Store scan results in `procedural_intel` for cross-examination preparation
- Unit tests modelling known Sims and Bains errors

## Acceptance Criteria

- [ ] ISC-1: StatementParagraph type with fields: witness_name, paragraph_number, claim_text, claim_type (factual/opinion/legal)
- [ ] ISC-2: CrossStatementCheck: compare same-topic paragraphs across statements for factual inconsistency, returning matched pairs with inconsistency classification
- [ ] ISC-3: DateValidator: extract dates from paragraph text, cross-reference against known timeline events, flag discrepancies with day-level precision
- [ ] ISC-4: ContradictionReport type with fields: paragraph_a, paragraph_b, contradiction_type (direct/inferential/temporal), severity (critical/major/minor)
- [ ] ISC-5: Scan output: structured report of all detected inconsistencies ranked by severity with paragraph references and quoted text
- [ ] ISC-6: Unit tests: model Sims para 2 (wrong date), Sims para 3 (wrong date), Sims para 10 (factual misrepresentation), and Bains para 2 (employer position contradiction)

## Dependencies

- `legal_analysis` canister for contradiction analysis types and scan logic
- `procedural_intel` canister for cross-examination data storage
- `awen_types` for shared type definitions and validation
- Known case timeline data for date validation baseline

## Evidence

- Sims witness statement: paragraphs 2, 3, 10 contain identified errors
- Bains witness statement: paragraph 2 contradicts employer's documented position
- Case timeline: 6013156/2024 chronological events
- TLT Solicitors disclosure bundle document list

## Out of Scope

- Natural language processing or AI-powered semantic analysis
- OCR or PDF text extraction from witness statements
- Automated witness statement drafting
- Full-text storage of witness statements (only paragraph-level references and claim summaries)
- Cross-examination question generation
