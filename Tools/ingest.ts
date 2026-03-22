#!/usr/bin/env bun

/**
 * PAI Reflection Ingester
 *
 * Reads algorithm-reflections.jsonl, identifies regret patterns,
 * groups by pattern type, and creates Ladder Source entries for
 * patterns that don't already have Sources — closing the optimization loop.
 *
 * Usage:
 *   bun run Tools/ingest.ts [options]
 *
 * Options:
 *   --dry-run       Show what would be created without writing files
 *   --since DATE    Only process reflections after this date
 *   --min-count N   Minimum pattern occurrences to create a Source (default: 3)
 *   --force         Create Sources even if similar ones already exist
 */

import { readdir, readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { join, resolve } from "path";

const ROOT = resolve(import.meta.dir, "..");
const REFLECTIONS_PATH = join(
  process.env.HOME || "~",
  ".claude",
  "MEMORY",
  "LEARNING",
  "REFLECTIONS",
  "algorithm-reflections.jsonl"
);

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

interface PatternMatch {
  patternKey: string;
  label: string;
  reflection: Reflection;
  matchedField: string;
  matchedText: string;
}

interface PatternSummary {
  key: string;
  label: string;
  count: number;
  matches: PatternMatch[];
  earliest: string;
  latest: string;
}

// ── Pattern Definitions ─────────────────────────────────

const PATTERNS: Record<string, { regex: RegExp; label: string }> = {
  SKILL_MISS: { regex: /could have used|should have used.*skill|skill.*would/i, label: "Skill Underutilization" },
  OVER_ENGINEER: { regex: /overkill|simpler|unnecessary|could have.*sed|could have.*direct/i, label: "Over-Engineering" },
  PARALLEL: { regex: /parallel|simultaneous|concurr|batch.*instead/i, label: "Parallelization Misses" },
  VERIFY_FIRST: { regex: /should have (verified|checked|confirmed|validated).*before|before.*writing|before.*starting/i, label: "Late Verification" },
  CONTEXT_MISS: { regex: /should have checked|should have looked|vault.*first|existing.*first/i, label: "Context Not Loaded" },
  PRELOAD: { regex: /pre-load|preload|should have.*loaded|cached.*from|check.*first/i, label: "Source Pre-Loading Missed" },
};

// ── Helpers ─────────────────────────────────────────────

const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const RED = "\x1b[31m";

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function slugify(title: string): string {
  return title
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, "_")
    .substring(0, 60);
}

function formatDate(timestamp: string): string {
  try {
    return new Date(timestamp).toISOString().split("T")[0];
  } catch {
    return timestamp;
  }
}

function truncateQuote(text: string, maxLen: number = 120): string {
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen - 3) + "...";
}

function pct(count: number, total: number): string {
  if (total === 0) return "0";
  return ((count / total) * 100).toFixed(1);
}

async function getNextSourceId(): Promise<string> {
  const dir = join(ROOT, "Sources");
  if (!existsSync(dir)) return "SR-00001";

  const files = await readdir(dir);
  const ids = files
    .filter((f) => f.match(/^SR-\d/) && f.endsWith(".md"))
    .map((f) => {
      const match = f.match(/SR-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => n > 0);

  const next = ids.length > 0 ? Math.max(...ids) + 1 : 1;
  return `SR-${String(next).padStart(5, "0")}`;
}

function parseArgs(args: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].substring(2);
      const value = args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : "true";
      result[key] = value;
      if (value !== "true") i++;
    }
  }
  return result;
}

// ── Core Logic ──────────────────────────────────────────

async function loadReflections(sinceDateStr?: string): Promise<Reflection[]> {
  if (!existsSync(REFLECTIONS_PATH)) {
    console.error(`${RED}Error: Reflections file not found at ${REFLECTIONS_PATH}${RESET}`);
    process.exit(1);
  }

  const raw = await readFile(REFLECTIONS_PATH, "utf-8");
  const lines = raw.trim().split("\n").filter((l) => l.trim());

  const reflections: Reflection[] = [];
  let parseErrors = 0;

  for (const line of lines) {
    try {
      const r = JSON.parse(line) as Reflection;
      if (sinceDateStr) {
        const sinceDate = new Date(sinceDateStr);
        const refDate = new Date(r.timestamp);
        if (refDate < sinceDate) continue;
      }
      reflections.push(r);
    } catch {
      parseErrors++;
    }
  }

  if (parseErrors > 0) {
    console.log(`${DIM}  (${parseErrors} lines skipped due to parse errors)${RESET}`);
  }

  return reflections;
}

function matchPatterns(reflections: Reflection[]): Map<string, PatternSummary> {
  const summaries = new Map<string, PatternSummary>();

  // Initialize summaries
  for (const [key, { label }] of Object.entries(PATTERNS)) {
    summaries.set(key, {
      key,
      label,
      count: 0,
      matches: [],
      earliest: "",
      latest: "",
    });
  }

  for (const reflection of reflections) {
    const fields = [
      { name: "reflection_q1", text: reflection.reflection_q1 },
      { name: "reflection_q2", text: reflection.reflection_q2 },
      { name: "reflection_q3", text: reflection.reflection_q3 },
    ];

    for (const [key, { regex, label }] of Object.entries(PATTERNS)) {
      let matched = false;

      for (const field of fields) {
        if (!field.text) continue;
        if (regex.test(field.text)) {
          if (!matched) {
            const summary = summaries.get(key)!;
            summary.count++;

            summary.matches.push({
              patternKey: key,
              label,
              reflection,
              matchedField: field.name,
              matchedText: field.text,
            });

            const ts = reflection.timestamp;
            if (!summary.earliest || ts < summary.earliest) summary.earliest = ts;
            if (!summary.latest || ts > summary.latest) summary.latest = ts;

            matched = true; // Count each reflection only once per pattern
          }
        }
      }
    }
  }

  return summaries;
}

async function getExistingSourceTitles(): Promise<string[]> {
  const dir = join(ROOT, "Sources");
  if (!existsSync(dir)) return [];

  const files = await readdir(dir);
  const titles: string[] = [];

  for (const file of files) {
    if (!file.match(/^SR-\d/) || !file.endsWith(".md")) continue;

    try {
      const content = await readFile(join(dir, file), "utf-8");
      const match = content.match(/^---\n([\s\S]*?)\n---/);
      if (match) {
        const titleMatch = match[1].match(/title:\s*"?([^"\n]+)"?/);
        if (titleMatch) {
          titles.push(titleMatch[1].trim());
        }
      }
    } catch {
      // Skip unreadable files
    }
  }

  return titles;
}

function isDuplicate(label: string, existingTitles: string[]): boolean {
  const labelLower = label.toLowerCase();
  // Check if the full label appears in any title
  if (existingTitles.some((title) => title.toLowerCase().includes(labelLower))) {
    return true;
  }
  // Also check if ALL significant words (3+ chars) from the label appear in any title
  const words = labelLower.split(/[\s-]+/).filter((w) => w.length >= 3);
  if (words.length >= 2) {
    return existingTitles.some((title) => {
      const titleLower = title.toLowerCase();
      return words.every((word) => titleLower.includes(word));
    });
  }
  return false;
}

function generateSourceContent(
  id: string,
  summary: PatternSummary,
  totalReflections: number
): string {
  const percentage = pct(summary.count, totalReflections);

  // Pick up to 3 sample quotes, preferring diverse timestamps
  const samples = summary.matches
    .sort((a, b) => b.reflection.timestamp.localeCompare(a.reflection.timestamp))
    .slice(0, 3);

  const sampleLines = samples
    .map((m, i) => {
      const quote = truncateQuote(m.matchedText);
      const date = formatDate(m.reflection.timestamp);
      return `  ${i + 1}. "${quote}" (${date})`;
    })
    .join("\n");

  return `---
id: ${id}
title: "PAI Pattern: ${summary.label} (${summary.count} occurrences in ${totalReflections} sessions)"
type: telemetry
url: ""
status: active
created: ${today()}
tags: [pai-integration, automated, reflection-mining]
domain: "pai-optimization"
relevance: "${summary.count} of ${totalReflections} reflections (${percentage}%) exhibit this pattern"
---

## Summary

Automated mining of ${totalReflections} PAI algorithm reflections identified ${summary.count} instances (${percentage}%) of the "${summary.label}" pattern.

## Key Points

- Pattern regex: \`${PATTERNS[summary.key].regex}\`
- First seen: ${formatDate(summary.earliest)}
- Most recent: ${formatDate(summary.latest)}
- Sample reflections:
${sampleLines}

## Connection to Problems

This pattern represents a recurring inefficiency in PAI algorithm execution that could be addressed through structural changes (gates, checklists, or automation).

## Potential Ideas

- Add a mandatory gate to prevent this pattern
- Create ISC criteria that specifically address this failure mode
- Track this pattern's frequency over time to measure improvement
`;
}

// ── Main ────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  const dryRun = args["dry-run"] === "true";
  const sinceDate = args["since"];
  const minCount = parseInt(args["min-count"] || "3", 10);
  const force = args["force"] === "true";

  console.log(`\n${BOLD}PAI Reflection Ingester${RESET}`);
  console.log(`${DIM}Closing the optimization loop: Reflections -> Ladder Sources${RESET}\n`);

  if (dryRun) {
    console.log(`${YELLOW}[DRY RUN] No files will be created${RESET}\n`);
  }

  // Load reflections
  console.log(`${BOLD}Loading reflections...${RESET}`);
  const reflections = await loadReflections(sinceDate);
  console.log(`  ${GREEN}${reflections.length}${RESET} reflections loaded${sinceDate ? ` (since ${sinceDate})` : ""}\n`);

  if (reflections.length === 0) {
    console.log(`${DIM}No reflections to process.${RESET}`);
    return;
  }

  // Match patterns
  console.log(`${BOLD}Scanning for regret patterns...${RESET}\n`);
  const summaries = matchPatterns(reflections);

  // Display pattern summary
  let anyPatterns = false;
  for (const [, summary] of summaries) {
    if (summary.count === 0) continue;
    anyPatterns = true;
    const bar = "█".repeat(Math.min(summary.count, 40));
    const countColor = summary.count >= minCount ? GREEN : DIM;
    const threshold = summary.count >= minCount ? "  ✓ meets threshold" : `  (needs ${minCount})`;
    console.log(`  ${countColor}${String(summary.count).padStart(3)}${RESET} ${bar} ${summary.label}${threshold}`);
  }

  if (!anyPatterns) {
    console.log(`  ${DIM}No regret patterns detected.${RESET}`);
    return;
  }

  console.log();

  // Check for existing Sources (deduplication)
  console.log(`${BOLD}Checking for existing Sources...${RESET}`);
  const existingTitles = await getExistingSourceTitles();
  console.log(`  ${existingTitles.length} existing Sources found\n`);

  // Determine what to create
  const toCreate: PatternSummary[] = [];
  const skipped: { label: string; reason: string }[] = [];

  for (const [, summary] of summaries) {
    if (summary.count < minCount) {
      if (summary.count > 0) {
        skipped.push({ label: summary.label, reason: `below threshold (${summary.count}/${minCount})` });
      }
      continue;
    }

    if (!force && isDuplicate(summary.label, existingTitles)) {
      skipped.push({ label: summary.label, reason: "Source already exists" });
      continue;
    }

    toCreate.push(summary);
  }

  // Report skipped patterns
  if (skipped.length > 0) {
    console.log(`${BOLD}Skipped patterns:${RESET}`);
    for (const s of skipped) {
      console.log(`  ${DIM}${s.label}: ${s.reason}${RESET}`);
    }
    console.log();
  }

  if (toCreate.length === 0) {
    console.log(`${GREEN}No new Sources needed — all patterns are either below threshold or already tracked.${RESET}\n`);
    return;
  }

  // Create Source files
  console.log(`${BOLD}${dryRun ? "Would create" : "Creating"} ${toCreate.length} Source(s):${RESET}\n`);

  // Get the starting ID
  const firstId = await getNextSourceId();
  let currentNum = parseInt(firstId.match(/SR-(\d+)/)![1], 10);

  for (const summary of toCreate) {
    const id = `SR-${String(currentNum).padStart(5, "0")}`;
    const slug = slugify(`PAI_${summary.label}_Pattern`);
    const filename = `${id}\u2014${slug}.md`;
    const filepath = join(ROOT, "Sources", filename);

    const content = generateSourceContent(id, summary, reflections.length);

    if (dryRun) {
      console.log(`  ${CYAN}[DRY RUN]${RESET} ${BOLD}${id}${RESET} — ${summary.label}`);
      console.log(`    ${DIM}File: Sources/${filename}${RESET}`);
      console.log(`    ${DIM}Occurrences: ${summary.count}/${reflections.length} (${pct(summary.count, reflections.length)}%)${RESET}`);
      console.log(`    ${DIM}Date range: ${formatDate(summary.earliest)} to ${formatDate(summary.latest)}${RESET}`);
      console.log();
    } else {
      await writeFile(filepath, content, "utf-8");
      console.log(`  ${GREEN}✓${RESET} ${BOLD}${id}${RESET} — ${summary.label}`);
      console.log(`    ${DIM}File: Sources/${filename}${RESET}`);
      console.log();
    }

    currentNum++;
  }

  // Summary
  const totalPatternHits = Array.from(summaries.values()).reduce((sum, s) => sum + s.count, 0);
  console.log(`${BOLD}Summary:${RESET}`);
  console.log(`  Reflections scanned:  ${reflections.length}`);
  console.log(`  Pattern matches:      ${totalPatternHits}`);
  console.log(`  Sources ${dryRun ? "to create" : "created"}:    ${toCreate.length}`);
  console.log(`  Sources skipped:      ${skipped.length}`);
  console.log();
}

main().catch((err) => {
  console.error(`${RED}Fatal error: ${err.message}${RESET}`);
  process.exit(1);
});
