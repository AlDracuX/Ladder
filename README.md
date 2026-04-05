# Ladder

**Dual-domain optimization pipeline for autonomous creation and improvement.**

Ladder structures work into six stages -- Sources, Ideas, Hypotheses, Experiments, Algorithms, and Results -- with results feeding back as sources in a continuous loop. It serves both the dev domain (code, architecture, CI) and the legal domain (litigation strategy, evidence, procedural compliance) from a single pipeline. Each entry is a markdown file with YAML frontmatter, managed via a bun-powered CLI. The pipeline models the cognitive phases behind human innovation (consume, dream, contemplate, steal, mate, test, evolve, meta-learn) and makes them executable by humans, AI agents, or both.

## Quick Start

```bash
cd ladder
bun install
bun run ladder status                  # Full pipeline status
bun run ladder status --domain legal   # Legal domain only
bun run ladder list ideas              # List all ideas
bun run ladder add idea --title "Use semantic caching for API responses"
```

## Pipeline Stages

| Stage | Prefix | Description |
|-------|--------|-------------|
| **Sources** | `SR-` | Raw inputs -- papers, articles, observations, system telemetry |
| **Ideas** | `ID-` | Candidate solutions or novel approaches generated from sources |
| **Hypotheses** | `HY-` | Testable predictions derived from ideas |
| **Experiments** | `EX-` | Structured tests of hypotheses with defined methodology |
| **Algorithms** | `AL-` | Proven methods for performing specific tasks |
| **Results** | `RE-` | Verified outcomes from experiments |

## Directory Structure

```
Sources/           SR- Raw inputs and references
Ideas/             ID- Candidate solutions
Hypotheses/        HY- Testable predictions
Experiments/       EX- Structured tests
Algorithms/        AL- Proven methods
Results/           RE- Verified outcomes
Tools/             TypeScript CLI tooling
```

## See Also

- [Architecture](../docs/ARCHITECTURE.md) -- system design
- [Ladder CLAUDE.md](CLAUDE.md) -- domain taxonomy and shell scripts
- [CONTRIBUTING.md](CONTRIBUTING.md) -- how to submit entries
- [Root README](../README.md) -- project root
