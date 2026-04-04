---
id: EX-00019
title: "Validate built-in dedup check in bun CLI prevents 100% duplicate entries at creation time"
status: draft
created: 2026-03-27
hypothesis: HY-00031
algorithm: ""
tags: [ladder, dedup, cli, automation, levenshtein]
methodology: "Implement Levenshtein similarity check in Tools/cli.ts add command, validate against known near-duplicate pairs and distinct titles in current corpus"
duration: "2 hours"
success_criteria: "CLI rejects titles with >80% similarity; catches 3 known near-duplicate pairs; zero false rejections on distinct titles; --force flag available for override"
---

## Objective

Validate that integrating a Levenshtein title-similarity check (80% threshold) directly into the `bun run ladder add` command catches 100% of duplicate entries at creation time, eliminating reliance on the external bash script (`scripts/ladder-dedup-check.sh`) which is optional and frequently skipped. The current corpus has ~48 ideas, ~40 hypotheses, and ~17 experiments -- small enough for O(n) comparison on each add.

## Methodology

1. **Baseline: audit current duplicates**
   ```bash
   cd /mnt/media_backup/PROJECTS/awen-network-canisters
   # Run existing dedup script across all collections
   bash scripts/ladder-dedup-check.sh idea > /tmp/idea-titles.txt
   bash scripts/ladder-dedup-check.sh hypothesis > /tmp/hypothesis-titles.txt
   bash scripts/ladder-dedup-check.sh experiment > /tmp/experiment-titles.txt
   # Manually identify known near-duplicate pairs (expected: 3 pairs per HY-00031)
   ```

2. **Implement Levenshtein similarity function** (describe changes only)
   - File: `ladder/Tools/cli.ts`
   - Add pure TypeScript Levenshtein edit distance function (no external deps)
   - Add `similarity(a: string, b: string): number` returning 0.0-1.0
   - Add `checkDuplicates(title: string, collection: string, threshold: number): DuplicateMatch[]`
   - Threshold default: 0.80

3. **Integrate into add command** (describe changes only)
   - Before writing the new file, call `checkDuplicates(title, type, 0.80)`
   - If matches found: print matches with similarity scores, exit with error code 1
   - Add `--force` flag to bypass dedup check for intentional near-duplicates
   - Error message format: `"Duplicate detected: {existing_id} ({similarity}% similar): {existing_title}"`

4. **Test: exact duplicate rejection**
   ```bash
   cd /mnt/media_backup/PROJECTS/awen-network-canisters/ladder
   # Attempt to add an idea with an exact existing title
   bun run ladder add idea --title "Contract monitors on 5 core impl functions detect at least 1 unknown invariant violation during fuzz testing"
   # Expected: rejected with error showing HY-00037 as match
   echo "Exit code: $?"  # Expected: 1
   ```

5. **Test: near-duplicate rejection (>80% similar)**
   ```bash
   # Attempt to add a title 85% similar to an existing one
   bun run ladder add idea --title "Adding in-flight request counter to mcp_gateway rejects burst requests above concurrency limit"
   # Expected: rejected showing HY-00030 as match
   ```

6. **Test: distinct titles pass (no false rejection)**
   ```bash
   # Attempt to add a clearly distinct title
   bun run ladder add idea --title "Implement WebSocket support for real-time dashboard updates"
   # Expected: passes (similarity to all existing titles < 80%)
   # Clean up the created file afterward
   ```

7. **Test: --force flag override**
   ```bash
   # Force-add a near-duplicate
   bun run ladder add idea --force --title "Adding in-flight request counter to mcp_gateway rejects burst requests above concurrency limit"
   # Expected: warning printed but file created
   # Clean up the created file afterward
   ```

8. **Corpus-wide validation: zero false rejections on distinct titles**
   ```bash
   # Script: for each existing title, check similarity against all others
   # Verify the 3 known near-duplicate pairs are flagged
   # Verify no non-duplicate pairs exceed 80% threshold
   bun run ladder/Tools/test-dedup.ts
   ```

## Setup

- Working directory: `/mnt/media_backup/PROJECTS/awen-network-canisters/ladder`
- No branch needed -- changes are in `ladder/Tools/cli.ts` only
- Dependencies: none (pure TypeScript Levenshtein implementation)
- Key files:
  - `ladder/Tools/cli.ts` -- main CLI entry point
  - `scripts/ladder-dedup-check.sh` -- existing bash dedup (for baseline comparison)
- Known near-duplicate pairs per HY-00031: ID-00011/ID-00042, ID-00026/ID-00027, ID-00028/ID-00044

## Algorithm

No specific AL- entry. Uses standard Levenshtein edit distance normalized by max string length: `similarity = 1 - (editDistance(a, b) / max(a.length, b.length))`. The O(n*m) dynamic programming implementation is sufficient for the corpus size (<200 entries).

## Success Criteria

- [ ] CLI rejects add commands when title similarity exceeds 80% threshold
- [ ] Error message shows matching entry ID, similarity percentage, and title
- [ ] Catches all 3 known near-duplicate pairs (ID-00011/ID-00042, ID-00026/ID-00027, ID-00028/ID-00044)
- [ ] Zero false rejections when testing all distinct titles in current corpus
- [ ] --force flag bypasses dedup check with warning
- [ ] Levenshtein implementation has no external dependencies

## Data Collection

| Metric | Target | Actual |
|--------|--------|--------|
| Known near-duplicate pairs detected | 3/3 | TBD |
| False rejections on distinct titles | 0 | TBD |
| Exact duplicate detection | 100% | TBD |
| Near-duplicate (>80%) detection | 100% | TBD |
| --force flag override works | yes | TBD |
| Bash script retirable after integration | yes | TBD |

## Risks & Mitigations

- **80% threshold too aggressive**: Legitimately similar-but-distinct ideas (e.g., ID-00026 and ID-00027) may be blocked. Mitigation: the --force flag allows override, and the threshold can be tuned based on corpus analysis.
- **Title-only comparison misses semantic duplicates**: Two entries with completely different wording but same meaning won't be caught. Mitigation: Levenshtein is a first line of defense; semantic dedup (embedding similarity) could be a follow-up experiment.
- **Performance on large corpus**: O(n * m * k) where n=entries, m=max title length, k=max title length. For 200 entries of avg 80 chars, this is ~1.28M operations -- negligible. Mitigation: none needed at current scale.
- **Case sensitivity**: Titles may differ only in case. Mitigation: normalize to lowercase before comparison.

## Results

(Fill in after running)

## Analysis

(Fill in after running)

## Next Steps

If dedup works reliably: retire `scripts/ladder-dedup-check.sh`, update CLAUDE.md instructions to remove the manual dedup step. Consider adding word-token Jaccard similarity as a second check for semantic duplicates. Create RE- result entry.
