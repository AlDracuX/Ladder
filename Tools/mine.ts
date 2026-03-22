#!/usr/bin/env bun

import { readdir, readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join, resolve } from "path";

const ROOT = resolve(import.meta.dir, "..");
const REFLECTIONS_PATH = join(
  process.env.HOME || "~",
  ".claude/MEMORY/LEARNING/REFLECTIONS/algorithm-reflections.jsonl"
);

// ── Colors ──────────────────────────────────────────────

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";
const WHITE = "\x1b[37m";

// ── Types ───────────────────────────────────────────────

interface Reflection {
  timestamp: string;
  effort_level: string;
  task_description: string;
  criteria_count: number;
  criteria_passed: number;
  criteria_failed: number;
  prd_id: string;
  implied_sentiment: number;
  reflection_q1: string;
  reflection_q2: string;
  reflection_q3: string;
  within_budget: boolean;
}

interface PatternResult {
  name: string;
  description: string;
  count: number;
  percentage: number;
  samples: string[];
}

// ── Patterns ────────────────────────────────────────────

const PATTERNS: Record<string, { regex: RegExp; description: string }> = {
  SKILL_MISS: {
    regex: /could have used|should have used.*skill|skill.*would/i,
    description: "Available skill not utilized during execution",
  },
  OVER_ENGINEER: {
    regex: /overkill|simpler|unnecessary|could have.*sed|could have.*direct/i,
    description: "Simpler approach existed but complex one chosen",
  },
  PARALLEL: {
    regex: /parallel|simultaneous|concurr|batch.*instead/i,
    description: "Independent tasks run sequentially instead of parallel",
  },
  VERIFY_FIRST: {
    regex: /should have (verified|checked|confirmed|validated).*before|before.*writing|before.*starting/i,
    description: "Prerequisites not verified before building",
  },
  CONTEXT_MISS: {
    regex: /should have checked|should have looked|vault.*first|existing.*first/i,
    description: "Existing context not loaded before starting work",
  },
  PRELOAD: {
    regex: /pre-load|preload|should have.*loaded|cached.*from|check.*first/i,
    description: "Source data not pre-loaded at session start",
  },
  PHASE_ORDER: {
    regex: /during.*instead of after|before.*not after|earlier.*rather/i,
    description: "Work done in wrong algorithm phase",
  },
  FALSE_ALARM: {
    regex: /false alarm|not needed|N\/A|unnecessary|overkill/i,
    description: "Work done on items that turned out unnecessary",
  },
  EFFORT_WRONG: {
    regex: /should have set effort|effort.*too|effort.*wrong/i,
    description: "Effort level miscalibrated for task",
  },
  AGENT_WASTE: {
    regex: /agent.*waste|agent.*fail|failed.*spawn|worktree.*fail/i,
    description: "Agent spawned but failed or wasted resources",
  },
};

// ── Helpers (matching cli.ts) ───────────────────────────

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function slugify(title: string): string {
  return title
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, "_")
    .substring(0, 60);
}

async function getNextSourceId(): Promise<string> {
  const dir = "Sources";
  const prefix = "SR";
  const fullDir = join(ROOT, dir);
  if (!existsSync(fullDir)) {
    await mkdir(fullDir, { recursive: true });
    return `${prefix}-00001`;
  }

  const files = await readdir(fullDir);
  const ids = files
    .filter(
      (f) =>
        f.startsWith(prefix) &&
        f.endsWith(".md") &&
        f !== "TEMPLATE.md" &&
        f !== "README.md"
    )
    .map((f) => {
      const match = f.match(new RegExp(`${prefix}-(\\d+)`));
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => n > 0);

  const next = ids.length > 0 ? Math.max(...ids) + 1 : 1;
  return `${prefix}-${String(next).padStart(5, "0")}`;
}

function parseArgs(args: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].substring(2);
      const value =
        args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : "true";
      result[key] = value;
      if (value !== "true") i++;
    }
  }
  return result;
}

// ── Core Logic ──────────────────────────────────────────

async function loadReflections(since?: string): Promise<Reflection[]> {
  const raw = await readFile(REFLECTIONS_PATH, "utf-8");
  const lines = raw.trim().split("\n");
  const reflections: Reflection[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//")) continue;
    try {
      const entry = JSON.parse(trimmed) as Reflection;
      if (since) {
        const entryDate = entry.timestamp.substring(0, 10);
        if (entryDate < since) continue;
      }
      reflections.push(entry);
    } catch {
      // skip malformed lines
    }
  }

  return reflections;
}

function analyzePatterns(reflections: Reflection[]): PatternResult[] {
  const results: PatternResult[] = [];

  for (const [name, { regex, description }] of Object.entries(PATTERNS)) {
    const matches: string[] = [];

    for (const r of reflections) {
      const combined = [r.reflection_q1, r.reflection_q2, r.reflection_q3]
        .filter(Boolean)
        .join(" ");
      if (regex.test(combined)) {
        // Extract the matching sentence as a sample
        const sentences = combined.split(/[.!?]+/).filter((s) => s.trim());
        const matchingSentence = sentences.find((s) => regex.test(s));
        if (matchingSentence) {
          matches.push(matchingSentence.trim());
        }
      }
    }

    results.push({
      name,
      description,
      count: matches.length,
      percentage: (matches.length / reflections.length) * 100,
      samples: matches.slice(0, 3),
    });
  }

  return results.sort((a, b) => b.count - a.count);
}

// ── Output Formatters ───────────────────────────────────

function formatTable(results: PatternResult[], total: number): string {
  const lines: string[] = [];

  lines.push("");
  lines.push(
    `${BOLD}${CYAN}REFLECTION PATTERN ANALYSIS${RESET}`
  );
  lines.push(`${CYAN}${"=".repeat(55)}${RESET}`);
  lines.push(`${DIM}${total} reflections analyzed${RESET}`);
  lines.push("");

  // Header
  lines.push(
    `  ${BOLD}${WHITE}Rank  Pattern            Count    %     Description${RESET}`
  );
  lines.push(`  ${DIM}${"─".repeat(70)}${RESET}`);

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.count === 0) continue;

    const rank = String(i + 1).padStart(2);
    const pattern = r.name.padEnd(18);
    const count = String(r.count).padStart(4);
    const pct = r.percentage.toFixed(1).padStart(5) + "%";
    const color = i < 3 ? YELLOW : WHITE;

    lines.push(
      `  ${color}${rank}    ${pattern} ${count}  ${pct}${RESET}  ${DIM}${r.description}${RESET}`
    );
  }

  lines.push("");
  return lines.join("\n");
}

function formatJson(results: PatternResult[], total: number): string {
  return JSON.stringify(
    {
      total_reflections: total,
      analyzed_at: new Date().toISOString(),
      patterns: results.map((r) => ({
        name: r.name,
        count: r.count,
        percentage: Math.round(r.percentage * 10) / 10,
        description: r.description,
        samples: r.samples,
      })),
    },
    null,
    2
  );
}

// ── Source Creation ──────────────────────────────────────

async function existingSourceTitles(): Promise<string[]> {
  const dir = join(ROOT, "Sources");
  if (!existsSync(dir)) return [];

  const files = await readdir(dir);
  const titles: string[] = [];

  for (const file of files) {
    if (!file.endsWith(".md") || file === "TEMPLATE.md" || file === "README.md")
      continue;
    const content = await readFile(join(dir, file), "utf-8");
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) continue;
    for (const line of match[1].split("\n")) {
      const colonIdx = line.indexOf(":");
      if (colonIdx === -1) continue;
      const key = line.substring(0, colonIdx).trim();
      const value = line
        .substring(colonIdx + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
      if (key === "title") {
        titles.push(value.toLowerCase());
        break;
      }
    }
  }

  return titles;
}

function patternToTitle(name: string): string {
  const titles: Record<string, string> = {
    SKILL_MISS: "PAI Skills Consistently Underutilized During Execution",
    OVER_ENGINEER: "PAI Over-Engineering Pattern in Algorithm Execution",
    PARALLEL: "PAI Algorithm Consistently Misses Parallelization Opportunities",
    VERIFY_FIRST: "PAI Verification-Before-Build Pattern Not Followed",
    CONTEXT_MISS: "PAI Existing Context Not Loaded Before Starting Work",
    PRELOAD: "PAI Source Data Not Pre-Loaded at Session Start",
    PHASE_ORDER: "PAI Work Executed in Wrong Algorithm Phase",
    FALSE_ALARM: "PAI False Alarm Pattern in Task Execution",
    EFFORT_WRONG: "PAI Effort Level Miscalibration Pattern",
    AGENT_WASTE: "PAI Agent Spawn Failures and Resource Waste",
  };
  return titles[name] || `PAI ${name} Pattern`;
}

async function createSourcesForPatterns(
  results: PatternResult[],
  totalReflections: number
): Promise<void> {
  const existing = await existingSourceTitles();
  let created = 0;

  // Get starting ID once, then increment in memory (avoid quadratic dir reads)
  const firstId = await getNextSourceId();
  let currentNum = parseInt(firstId.match(/SR-(\d+)/)![1], 10);

  for (const r of results) {
    if (r.count === 0) continue;

    const title = patternToTitle(r.name);

    // Check if a Source with a similar title already exists
    const titleLower = title.toLowerCase();
    const alreadyExists = existing.some(
      (t) =>
        t.includes(r.name.toLowerCase().replaceAll("_", " ")) ||
        t.includes(r.name.toLowerCase()) ||
        titleLower.includes(t.substring(0, 20)) ||
        t.includes(titleLower.substring(0, 20))
    );

    if (alreadyExists) {
      console.log(
        `  ${DIM}skip${RESET}  ${r.name} — similar Source already exists`
      );
      continue;
    }

    const id = `SR-${String(currentNum).padStart(5, "0")}`;
    currentNum++;
    const slug = slugify(title);
    const filename = `${id}\u2014${slug}.md`;
    const filepath = join(ROOT, "Sources", filename);

    const sampleQuotes = r.samples
      .map((s, i) => `> ${i + 1}. "${s}"`)
      .join("\n");

    const regexStr =
      PATTERNS[r.name]?.regex.toString() || "N/A";

    const content = `---
id: ${id}
title: "${title}"
type: telemetry
url: ""
status: draft
created: ${today()}
tags: [pai, reflections, pattern-mining, ${r.name.toLowerCase().replace("_", "-")}]
domain: "pai-optimization"
relevance: "${r.count} of ${totalReflections} reflections (${r.percentage.toFixed(1)}%) match this pattern"
---

## Summary

${r.description}

Pattern \`${r.name}\` detected in ${r.count} algorithm reflections (${r.percentage.toFixed(1)}% of analyzed sessions).

## Key Points

- Frequency: ${r.count} occurrences across analyzed reflections
- Detection regex: \`${regexStr}\`
- Category: Recurring self-identified improvement opportunity

## Sample Reflection Quotes

${sampleQuotes}

## Connection to Problems

This pattern represents a systematic gap in PAI algorithm execution that could be addressed through automation, pre-flight checks, or skill improvements.

## Potential Ideas

- Automated detection and prompting when this pattern is about to occur
- Pre-flight checklist item addressing this specific gap
- Skill or algorithm modification to prevent recurrence
`;

    await writeFile(filepath, content, "utf-8");
    console.log(
      `  ${GREEN}+${RESET}  ${BOLD}${id}${RESET}  ${title} (${r.count} hits, ${r.percentage.toFixed(1)}%)`
    );
    created++;
  }

  if (created === 0) {
    console.log(
      `\n${DIM}No new Sources created — all patterns already have matching entries.${RESET}`
    );
  } else {
    console.log(
      `\n${GREEN}Created ${created} new Source(s) in Sources/${RESET}`
    );
  }
}

// ── Help ────────────────────────────────────────────────

function showHelp(): void {
  console.log(`
${BOLD}mine${RESET} — Mine PAI algorithm reflections for recurring improvement patterns

${BOLD}Usage:${RESET}
  bun run Tools/mine.ts [options]

${BOLD}Options:${RESET}
  --top N         Show top N patterns (default: all)
  --create        Auto-generate Source entries for top patterns not already in Sources/
  --since DATE    Only analyze reflections after this date (YYYY-MM-DD)
  --json          Output as JSON instead of formatted text
  --help          Show this help message
`);
}

// ── Main ────────────────────────────────────────────────

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  showHelp();
  process.exit(0);
}

const since = args.since;
const topN = args.top ? parseInt(args.top, 10) : undefined;
const asJson = args.json === "true";
const shouldCreate = args.create === "true";

const reflections = await loadReflections(since);

if (reflections.length === 0) {
  console.error("No reflections found.");
  process.exit(1);
}

let results = analyzePatterns(reflections);

if (topN) {
  results = results.slice(0, topN);
}

if (asJson) {
  console.log(formatJson(results, reflections.length));
} else {
  console.log(formatTable(results, reflections.length));
}

if (shouldCreate) {
  console.log(`${BOLD}Creating Source entries for detected patterns...${RESET}\n`);
  await createSourcesForPatterns(results, reflections.length);
}
