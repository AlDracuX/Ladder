# Ladder — AI Guidance

## What Is This?

Ladder is an open source pipeline for systematic improvement: Sources → Ideas → Hypotheses → Experiments → Results, with results feeding back as sources (the loop).

## Key Conventions

- **IDs**: Each collection uses a prefix: `SR-`, `ID-`, `HY-`, `EX-`, `AL-`, `RE-` followed by 5-digit zero-padded number
- **Format**: All entries are markdown with YAML frontmatter
- **Status values**: `draft`, `active`, `testing`, `complete`, `archived`
- **Linking**: Entries reference upstream items (e.g., a hypothesis links to its parent idea via `idea: ID-00001`)
- **CLI**: Use `bun run ladder <command>` — never npm/npx

## Directory Structure

- `Sources/` — Raw inputs (papers, articles, observations, telemetry)
- `Ideas/` — Candidate solutions generated from sources
- `Hypotheses/` — Testable predictions from ideas
- `Experiments/` — Structured tests with methodology
- `Algorithms/` — Proven methods for specific tasks
- `Results/` — Verified outcomes from experiments
- `Tools/` — TypeScript CLI tooling (bun-based)

## When Adding Entries

1. Use the CLI: `bun run ladder add <type> --title "..."`
2. Or create manually following the TEMPLATE.md in each directory
3. Always include all required frontmatter fields
4. Link to upstream entries where applicable
5. Use the next available ID number

## Pipeline Flow

```
Sources → Ideation → Ideas → Hypotheses → Experiments → Results
   ↑                                                        |
   └──────────────────────── Loop ──────────────────────────┘
```

Results feed back as sources. This is the core mechanic.

## Shell Scripts

Automation scripts live in `scripts/ladder-*.sh` (project root), not inside `ladder/`:

| Script | Purpose |
|--------|---------|
| `ladder-cognitive.sh` | Run cognitive phases (OBSERVE, DREAM, STEAL, MATE, CONTEMPLATE) |
| `ladder-loop.sh` | Full autonomous loop iteration |
| `ladder-pollinate.sh` | Cross-canister pattern adoption gap analysis (with dedup) |
| `ladder-experiment-runner.sh` | Create experiment branch from hypothesis |
| `ladder-validate-experiment.sh` | Run quality gates and create result entry |
| `ladder-dedup-check.sh` | List existing titles for duplicate detection |
| `ladder-phase-selector.sh` | Select cognitive phase by hour of day |
| `ladder-seed-audit.sh` | Batch-create SR- entries from audit findings |
| `ladder-post-test.sh` | Create SR- entries from nextest failures |
| `ladder-post-audit.sh` | Create SR- entries from cargo-deny/clippy |
| `ladder-coverage-delta.sh` | Detect coverage drops and log as SR- entries |
| `ladder-scan-legal.sh` | Scan Lawfare Vault for new filings, evidence, respondent gaps |
| `ladder-pollinate-legal.sh` | Cross-reference case requirements against vault for gaps |

## Code Style

- TypeScript only, bun runtime
- No Python, no npm/npx
- Minimal dependencies
- CLI-first philosophy

## Domain Taxonomy

Ladder serves two optimization loops from one pipeline:

| Domain Value | Scope |
|-------------|-------|
| `dev` | Code, architecture, tooling, CI |
| `legal-strategy` | Litigation tactics, hearing prep, filing strategy |
| `legal-evidence` | Evidence management, disclosure, bundle preparation |
| `legal-procedural` | Rules, deadlines, applications, compliance |
| `legal-intel` | OSINT, respondent research, corporate intelligence |
| `legal-precedent` | Case law, statutory interpretation, EAT authority |
| `uk-employment-law` | Statutory domain types (ERA 1996, EA 2010, ET Rules 2024) |
| `case-domain` | Case-specific types, entities, relationships |

Filter by domain: `bun run ladder list all --domain legal` (prefix match — catches all `legal-*`).

## Lawfare Vault

**Path:** `/home/alex/Projects/Lawfare-vault` (configurable via `LAWFARE_VAULT` env var)
**Contents:** Obsidian vault with 293 md files, 426 PDFs — full litigation record for ET case 6013156/2024.
**Access:** Read-only. Ladder scans the vault for sources but never modifies vault files.
**Security:** Vault has strict classification rules. See Lawfare vault `CLAUDE.md § Security Classification`. Never upload strategy, intel, or OSINT documents externally.

### Lifecycle Prefix Mapping

| Vault Prefix | Ladder Status | Meaning |
|-------------|--------------|---------|
| `FILED-` | complete | Submitted to tribunal/court — immutable |
| `STAGED-` | active | Ready to file, next action |
| `WORK-` | draft | In progress analysis/drafts |
| `REF-` | reference | Static background material |
