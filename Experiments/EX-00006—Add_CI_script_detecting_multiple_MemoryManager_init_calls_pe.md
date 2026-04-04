---
id: EX-00006
title: "Add CI script detecting multiple MemoryManager init calls per crate"
status: complete
updated: 2026-03-26
created: 2026-03-24
hypothesis: HY-00017
algorithm:
tags: [memory-manager, lint, ci, stable-structures, safety]
methodology: "Create scripts/check-memory-managers.sh using rg to count MemoryManager::init per canister crate"
duration: "< 5s"
success_criteria: "exactly 1 MemoryManager::init per canister, exit 1 if any crate has >1"
---

## Objective

Validate that a CI script can detect the dual-MemoryManager bug class by counting `MemoryManager::init` calls per canister crate. Any crate with more than one init call should fail CI.

## Methodology

1. Create `scripts/check-memory-managers.sh` that:
   - Iterates all 9 canister directories under `src/`
   - Uses `rg` to count `MemoryManager::init` calls in non-test .rs files
   - Reports OK (exactly 1), WARNING (0), or ERROR (>1) per canister
   - Exits 0 if all canisters have exactly 1, exits 1 if any have >1
2. Verify script is executable
3. Run on current codebase -- all 9 canisters should pass

## Setup

- Prerequisites: none (just needs source files)
- Tools: `rg` (ripgrep)
- Working directory: `/mnt/media_backup/PROJECTS/awen-network-canisters`

## Algorithm

```bash
for canister in $CANISTERS; do
    count=$(rg 'MemoryManager::init' "src/$canister/src" --glob '!*test*' -c | awk -F: '{sum+=$2} END {print sum+0}')
    # Fail if count > 1
done
```

## Success Criteria

- Primary: current codebase passes (all 9 canisters have exactly 1)
- Secondary: script correctly identifies >1 init calls as an error
- Tertiary: runs in < 5 seconds

## Data Collection

- Per-canister MemoryManager::init count
- Overall exit code

## Results

(populated after execution)

## Analysis

(populated after execution)

## Next Steps

- Add to `mise.toml` as part of `mise run check` or `mise run ci`
- Consider extending to check for other singleton patterns
