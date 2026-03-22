<p align="center">
  <img src="assets/ladder-logo.png" alt="Ladder" width="256"/>
</p>

<h1 align="center">Ladder</h1>

<p align="center">
  <strong>A system for autonomous creation and optimization.</strong>
</p>

<p align="center">
  <a href="#the-pipeline">Pipeline</a> &middot;
  <a href="#cognitive-phases">Cognitive Phases</a> &middot;
  <a href="#the-loop">The Loop</a> &middot;
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#fork-it">Fork It</a> &middot;
  <a href="#related-work">Related Work</a>
</p>

---

Ladder is an open system for autonomous creation and optimization — collecting ideas, forming hypotheses, running experiments, and applying results in a continuous loop. It structures the same process that has driven every major period of human innovation, from the Renaissance to Bell Labs, and makes it executable by humans, AI agents, or both.

## Why Ladder?

Every great leap in human progress has followed the same pattern. Renaissance Florence had its salons and workshops — polymaths gathering diverse knowledge, debating ideas, testing them in art and engineering. The Enlightenment had its coffeehouses and scientific societies — structured observation, hypothesis, experimentation. Bell Labs had its open hallways — mathematicians colliding with engineers, theorists stealing from experimentalists, results feeding back into new research.

The process is always the same:

1. **Consume** widely — read, learn, experience across domains
2. **Face problems** — encounter challenges worth solving
3. **Think deeply** — apply what you know to the problem
4. **Learn from results** — observe what worked and what didn't
5. **Talk with others** — exchange ideas with different perspectives
6. **Steal and combine** — copy, modify, and merge ideas from other fields
7. **Sleep on it** — let the subconscious make connections you can't force
8. **Absorb new inputs** — keep feeding the system with fresh material
9. **Get sudden inspiration** — the insight arrives
10. **Test and repeat** — try it, learn, loop back

This is the engine behind *every* major advance. Ladder takes this engine and makes it **autonomous** — structured enough for AI agents to run, observable enough to optimize, and open enough for anyone to use.

> *"We basically take the human process of learning, thinking, combining and copying ideas, sleeping on them, trying them out — and we automate the hell of it at scale."*
> — [A Possible Path to ASI](https://danielmiessler.com/blog/path-to-asi)

## The Pipeline

<p align="center">
  <img src="images/pipeline-flow.png" alt="The Ladder Pipeline" width="900"/>
</p>

Ladder organizes work into six collections, each a stage in the autonomous optimization pipeline:

| Stage | Prefix | Description |
|-------|--------|-------------|
| **Sources** | `SR-` | Raw inputs — papers, articles, observations, system telemetry |
| **Ideas** | `ID-` | Candidate solutions or novel approaches generated from sources |
| **Hypotheses** | `HY-` | Testable predictions derived from ideas |
| **Experiments** | `EX-` | Structured tests of hypotheses with defined methodology |
| **Algorithms** | `AL-` | Proven methods for performing specific tasks |
| **Results** | `RE-` | Verified outcomes from experiments |

Each entry is a markdown file with structured frontmatter. Results feed back as sources for the next cycle — the **loop** that drives continuous, autonomous improvement.

## Cognitive Phases

<p align="center">
  <img src="images/cognitive-phases.png" alt="Cognitive Phases of Ideation" width="900"/>
</p>

Ladder's ideation stage is modeled on the phases of human innovation that have driven progress for centuries. These aren't arbitrary categories — they're the observable patterns behind how breakthroughs actually happen, from Renaissance workshops to modern research labs.

| Phase | Historical Analog | What Happens |
|-------|-------------------|--------------|
| **CONSUME** | Scholars traveling between universities, reading everything | Gather diverse raw material from 3+ domains |
| **DREAM** | Kekulé's dream of the benzene ring, Poincaré's bus insight | Pure free-association with no problem awareness |
| **DAYDREAM** | Newton under the apple tree, Archimedes in the bath | Semi-directed wandering with loose problem awareness |
| **CONTEMPLATE** | Enlightenment scientific societies, rigorous debate | Structured analysis from multiple lenses |
| **STEAL** | Bell Labs hallway collisions — math meets engineering | Map patterns from completely different domains |
| **MATE** | Renaissance workshops blending art, science, and mechanics | Combine ideas from different phases and sources |
| **TEST** | Royal Society peer review, reproducibility standards | Score each idea on feasibility, novelty, impact, elegance |
| **EVOLVE** | Scientific paradigm shifts — old ideas die, strong ones survive | Keep the best, mutate the middle, kill the weak |
| **META-LEARN** | Post-mortems, retrospectives, improving the method itself | Analyze what worked and adjust the strategy |

The pattern repeats across every era of innovation: *consume broadly, recombine freely, test ruthlessly, learn and repeat.* Florentine salons did this over wine. Bell Labs did it in open-plan offices. Silicon Valley does it in garages and group chats. Ladder does it autonomously.

## The Loop

<p align="center">
  <img src="images/the-loop.png" alt="The Loop — From Observation to Verified Improvement" width="900"/>
</p>

The most important concept in Ladder is the **loop**: results don't just sit there — they feed back as sources for the next cycle of creation and optimization.

A result might reveal a new problem (→ source), suggest a better approach (→ idea), or validate an algorithm (→ algorithm). This closed loop is what transforms a static collection into an **autonomous optimization engine** that continuously improves itself and whatever system it's pointed at.

This is the same process described in [Pursuing the Algorithm](https://danielmiessler.com/blog/the-last-algorithm) — a generalized hill-climbing approach that applies to any domain. Observe, hypothesize, test, learn, repeat. The loop is what makes it work.

## Quick Start

```bash
# Clone
git clone https://github.com/danielmiessler/Ladder.git
cd Ladder

# Install dependencies
bun install

# Add an idea
bun run ladder add idea --title "Use semantic caching for API responses"

# Add a hypothesis from that idea
bun run ladder add hypothesis --idea ID-00001 --title "Semantic cache reduces API calls by 40%"

# Add an experiment
bun run ladder add experiment --hypothesis HY-00001 --title "A/B test semantic cache vs direct calls"

# Check pipeline status
bun run ladder status

# List all ideas
bun run ladder list ideas
```

## Directory Structure

```
Ladder/
├── Sources/           # SR- Raw inputs and references
│   ├── README.md
│   └── TEMPLATE.md
├── Ideas/             # ID- Candidate solutions
│   ├── README.md
│   └── TEMPLATE.md
├── Hypotheses/        # HY- Testable predictions
│   ├── README.md
│   └── TEMPLATE.md
├── Experiments/       # EX- Structured tests
│   ├── README.md
│   └── TEMPLATE.md
├── Algorithms/        # AL- Proven methods
│   ├── README.md
│   └── TEMPLATE.md
├── Results/           # RE- Verified outcomes
│   ├── README.md
│   └── TEMPLATE.md
├── Tools/             # TypeScript CLI tooling
├── README.md
├── CLAUDE.md
├── CONTRIBUTING.md
└── LICENSE
```

## Fork It

Ladder is designed to be forked. Your fork is your instance — your problems, your ideas, your experiments.

**Personal use:** Fork it, point it at your own work, and let it find optimizations you'd never spot manually.

**Enterprise use:** Fork it, scope it to your system. Your agents discover problems in your infrastructure, submit them as sources, and the pipeline autonomously turns them into verified improvements.

**AI integration:** Point your AI agents at your Ladder fork. Anytime an agent encounters a problem or sees an opportunity, it submits to the pipeline. The pipeline is the autonomous optimization engine; the agents are sources of observations.

## Philosophy

Ladder is built on three beliefs:

1. **Progress is a loop, not a line.** Every great era of innovation — the Renaissance, the Enlightenment, the Bell Labs era — was driven by tight feedback loops between observation, creation, and testing.
2. **Structure enables creativity.** Naming the cognitive phases doesn't constrain thinking — it makes it observable and improvable. The Royal Society didn't kill creativity by insisting on reproducibility; it accelerated it.
3. **Autonomy is the goal.** The system should be able to run without human intervention — discovering problems, generating ideas, testing hypotheses, and applying results continuously.

## Related Work

Ladder draws from a body of interconnected ideas about autonomous optimization, AI capability, and human creativity:

### Core Concepts

- [A Possible Path to ASI](https://danielmiessler.com/blog/path-to-asi) — The foundational thesis: ASI through scaled ideation and experimentation, emulating the human creative process
- [Pursuing the Algorithm](https://danielmiessler.com/blog/the-last-algorithm) — The concept of a generalized algorithm for continuous improvement across any domain
- [Nobody is Talking About Generalized Hill-Climbing](https://danielmiessler.com/blog/nobody-is-talking-about-generalized-hill-climbing) — Why runtime optimization through iterative hill-climbing is the key capability most people are missing
- [Introducing Substrate](https://danielmiessler.com/blog/introducing-substrate) — Open-source infrastructure for collecting problems, solutions, and evidence at scale

### AI & Knowledge Work

- [AI's Ultimate Use Case: State Transition](https://danielmiessler.com/blog/ai-state-management) — Moving from current state to desired state as the core function of intelligence
- [RAID (Real World AI Definitions)](https://danielmiessler.com/blog/raid-ai-definitions) — Precise definitions for AGI, ASI, and other AI concepts referenced throughout Ladder
- [Exactly Why and How AI Will Replace Knowledge Work](https://danielmiessler.com/blog/exactly-why-and-how-ai-will-replace-knowledge-work) — The economic forces driving AI adoption and why autonomous pipelines matter
- [Bitter Lesson Engineering](https://danielmiessler.com/blog/bitter-lesson-engineering) — Why you should build infrastructure that improves with scale, not clever workarounds

### Creativity & Innovation

- [Creative Output Requires Quality Inputs](https://danielmiessler.com/blog/creative-output-requires-quality-inputs) — Why the CONSUME phase matters: garbage in, garbage out
- [Increasing Creativity By Separating Input and Output Phases](https://danielmiessler.com/blog/increasing-creativity-by-clearly-separating-your-input-and-output-phases) — The science behind Ladder's phase separation
- [The Two Primary Limitations to Our Creativity](https://danielmiessler.com/blog/two-creativity-barriers) — The constraints that Ladder's cognitive phases are designed to overcome
- [AI and the World's Most Important Economic Metric](https://danielmiessler.com/blog/creativity-friction-coefficient) — How reducing the friction of creation changes everything

### Systems & Infrastructure

- [Building a Personal AI Infrastructure (PAI)](https://danielmiessler.com/blog/personal-ai-infrastructure) — The broader system that Ladder integrates with
- [How My Projects Fit Together](https://danielmiessler.com/blog/how-my-projects-fit-together) — Where Ladder sits in the ecosystem alongside Fabric, Substrate, and PAI
- [Companies Are Just a Graph of Algorithms](https://danielmiessler.com/blog/companies-graph-of-algorithms) — Why Ladder's algorithm collection matters: every process is an algorithm that can be optimized
- [Why I Created Fabric](https://danielmiessler.com/blog/fabric-origin-story) — The origin of the pattern-based approach that Ladder extends

### Human Progress

- [The Problem with Human 2.0 and the Promise of Human 3.0](https://danielmiessler.com/blog/human-3-creator-revolution) — The vision of humans as creators, augmented by autonomous tools like Ladder
- [Algorithmic Learning](https://danielmiessler.com/blog/algorithmic-learning) — Learning as a structured, improvable process — not just accumulation
- [Algorithmic vs. Faith-based Learning](https://danielmiessler.com/blog/algorithmic-vs-faith-based-learning) — Why verifiable, iterative learning beats untested assumptions
- [The Great Transition](https://danielmiessler.com/blog/the-great-transition) — The societal shift that makes autonomous creation tools necessary

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to submit sources, ideas, hypotheses, experiments, and results.

## License

MIT — see [LICENSE](LICENSE) for details.
