---
id: HY-00031
title: "Integrating dedup check into bun CLI add command prevents 100 percent of duplicate entries at creation time"
status: draft
created: 2026-03-27
idea: ID-00007
tags: [ladder, dedup, cli, automation]
prediction: "A built-in title similarity check in the bun CLI add command blocks creation of entries with over 80% Levenshtein similarity to existing titles, reducing duplicate entries to zero"
metric: "Number of semantically duplicate entries created after the check is integrated vs before"
success_criteria: "CLI rejects add commands when title similarity exceeds 80% threshold; running against current corpus detects known near-duplicates; zero false rejections on intentionally distinct titles"
---

## Hypothesis

If we integrate a title-similarity check (Levenshtein distance with 80% threshold) directly into the `bun run ladder add` command in Tools/cli.ts, then 100% of duplicate entries are caught at creation time, eliminating the need for the external bash script (scripts/ladder-dedup-check.sh) which is optional and frequently skipped.

## Rationale

The current dedup mechanism is a standalone bash script that parses YAML frontmatter with shell commands (grep + awk + sed). It is fragile, optional, and depends on the caller remembering to run it. The Ladder CLI (Tools/cli.ts) is the primary entry point for creating entries -- integrating dedup there makes it automatic and unavoidable. TypeScript's string comparison capabilities support fuzzy matching (Levenshtein, Jaccard, cosine on word tokens) far more robustly than shell parsing. The existing corpus has ~48 ideas and ~28 hypotheses -- small enough for O(n) comparison on each add.

## Testing Plan

1. Baseline: run existing dedup script, count how many near-duplicates exist in current corpus
2. Implement Levenshtein similarity function in Tools/cli.ts (no external deps -- simple edit distance)
3. Add pre-creation check: before writing file, compare title against all existing titles in same collection
4. Write test cases: exact duplicate (should block), 85% similar (should block), 50% similar (should pass), completely different (should pass)
5. Validate: attempt to add known duplicate titles via CLI, confirm rejection with helpful error message
6. Remove dependency on external bash script after validation

## Success Criteria

- CLI blocks entries with title similarity above 80% with clear error showing the matching entry
- Zero false rejections when running against all 48 existing idea titles with distinct new titles
- Catches the 3 known near-duplicate pairs in the current corpus (ID-00011/ID-00042, ID-00026/ID-00027, ID-00028/ID-00044)
- bash script can be retired after CLI integration

## Risks

- 80% threshold may be too aggressive for legitimately similar-but-distinct ideas (e.g., ID-00026 and ID-00027 are related but different)
- Title-only comparison misses semantic duplicates with different wording
- May need a --force flag for cases where similarity is intentional
