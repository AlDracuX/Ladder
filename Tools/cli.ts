#!/usr/bin/env bun

import { readdir, readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join, resolve } from "path";

const ROOT = resolve(import.meta.dir, "..");

const COLLECTIONS = {
  source: { dir: "Sources", prefix: "SR", name: "Source" },
  idea: { dir: "Ideas", prefix: "ID", name: "Idea" },
  hypothesis: { dir: "Hypotheses", prefix: "HY", name: "Hypothesis" },
  experiment: { dir: "Experiments", prefix: "EX", name: "Experiment" },
  algorithm: { dir: "Algorithms", prefix: "AL", name: "Algorithm" },
  result: { dir: "Results", prefix: "RE", name: "Result" },
} as const;

type CollectionKey = keyof typeof COLLECTIONS;

const PLURALS: Record<string, string> = {
  sources: "source", ideas: "idea", hypotheses: "hypothesis",
  experiments: "experiment", algorithms: "algorithm", results: "result",
};

// ── Helpers ──────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function slugify(title: string): string {
  return title
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, "_")
    .substring(0, 60);
}

function matchesDomain(entryDomain: string, filter: string): boolean {
  if (!filter) return true;
  if (!entryDomain) return false;
  const f = filter.toLowerCase();
  const d = entryDomain.toLowerCase();
  if (d === f) return true;
  if (d.startsWith(f + "-")) return true;
  if (d.includes(",")) {
    return d.split(",").some(part => {
      const t = part.trim();
      return t === f || t.startsWith(f + "-");
    });
  }
  return false;
}

async function getNextId(dir: string, prefix: string): Promise<string> {
  const fullDir = join(ROOT, dir);
  if (!existsSync(fullDir)) {
    await mkdir(fullDir, { recursive: true });
    return `${prefix}-00001`;
  }

  const files = await readdir(fullDir);
  const ids = files
    .filter((f) => f.startsWith(prefix) && f.endsWith(".md") && f !== "TEMPLATE.md" && f !== "README.md")
    .map((f) => {
      const match = f.match(new RegExp(`${prefix}-(\\d+)`));
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => n > 0);

  const next = ids.length > 0 ? Math.max(...ids) + 1 : 1;
  return `${prefix}-${String(next).padStart(5, "0")}`;
}

async function listEntries(dir: string, prefix: string, filterDomain?: string): Promise<Array<{ id: string; title: string; status: string }>> {
  const fullDir = join(ROOT, dir);
  if (!existsSync(fullDir)) return [];

  const files = await readdir(fullDir);
  const entries: Array<{ id: string; title: string; status: string }> = [];

  for (const file of files) {
    if (!file.match(new RegExp(`^${prefix}-\\d`)) || !file.endsWith(".md")) continue;

    const content = await readFile(join(fullDir, file), "utf-8");
    const frontmatter = parseFrontmatter(content);
    if (filterDomain && !matchesDomain(frontmatter.domain || "", filterDomain)) continue;
    entries.push({
      id: frontmatter.id || file.replace(".md", ""),
      title: frontmatter.title || "(untitled)",
      status: frontmatter.status || "unknown",
    });
  }

  return entries.sort((a, b) => a.id.localeCompare(b.id));
}

function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const result: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.substring(0, colonIdx).trim();
    const value = line.substring(colonIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (key && value && !key.startsWith(" ")) {
      result[key] = value;
    }
  }
  return result;
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

// ── Status Colors ────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  draft: "\x1b[90m",      // gray
  active: "\x1b[32m",     // green
  testing: "\x1b[33m",    // yellow
  complete: "\x1b[36m",   // cyan
  archived: "\x1b[90m",   // gray
  unknown: "\x1b[31m",    // red
};

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";

function colorStatus(status: string): string {
  const color = STATUS_COLORS[status] || STATUS_COLORS.unknown;
  return `${color}${status}${RESET}`;
}

// ── Templates ────────────────────────────────────────────

function generateEntry(type: CollectionKey, id: string, args: Record<string, string>): string {
  const title = args.title || "";
  const date = today();
  const domain = args.domain || "";

  switch (type) {
    case "source":
      return `---
id: ${id}
title: "${title}"
type: ${args.type || "observation"}
url: "${args.url || ""}"
status: draft
created: ${date}
tags: []
domain: "${domain}"
relevance: ""
---

## Summary

${title}

## Key Points

-

## Connection to Problems

## Potential Ideas
`;

    case "idea":
      return `---
id: ${id}
title: "${title}"
status: draft
created: ${date}
sources: [${args.source || ""}]
phase: ${args.phase || "contemplate"}
domain: "${domain}"
tags: []
scores:
  feasibility: 0
  novelty: 0
  impact: 0
  elegance: 0
---

## Description

${title}

## Provenance

## Connection

## Next Steps
`;

    case "hypothesis":
      return `---
id: ${id}
title: "${title}"
status: draft
created: ${date}
idea: ${args.idea || ""}
tags: []
prediction: ""
metric: ""
success_criteria: ""
---

## Hypothesis

If [condition], then [expected outcome].

## Rationale

## Testing Plan

## Success Criteria

## Risks
`;

    case "experiment": {
      const isLegal = domain.toLowerCase().startsWith("legal");
      const domainFm = domain ? `\ndomain: "${domain}"` : "";
      const legalFm = isLegal ? `\nrisk: ""\nreversible: true` : "";
      const legalBody = isLegal ? `\n## Legal Risk Assessment\n\n## Filing Requirements\n\n## Deadline\n\n## Reversibility\n` : "";
      return `---
id: ${id}
title: "${title}"
status: draft
created: ${date}
hypothesis: ${args.hypothesis || ""}
algorithm: ${args.algorithm || ""}
tags: []
methodology: ""
duration: ""
success_criteria: ""${domainFm}${legalFm}
---

## Objective

${title}

## Methodology

## Setup

## Algorithm

## Success Criteria

## Data Collection

## Results

## Analysis

## Next Steps
${legalBody}`;
    }

    case "algorithm":
      return `---
id: ${id}
title: "${title}"
status: draft
created: ${date}
domain: "${domain}"
tags: []
experiments: []
complexity: medium
---

## Description

${title}

## Method

## When to Use

## Inputs

## Outputs

## Limitations

## Evidence
`;

    case "result":
      return `---
id: ${id}
title: "${title}"
status: draft
created: ${date}
experiment: ${args.experiment || ""}
outcome: inconclusive
tags: []
loops_to: []
---

## Summary

${title}

## Data

## Analysis

## Outcome

## Loop

- [ ] New source identified (→ Sources)
- [ ] New idea suggested (→ Ideas)
- [ ] New hypothesis formed (→ Hypotheses)
- [ ] Algorithm validated (→ Algorithms)
- [ ] Problem redefined (→ Sources)

## Lessons Learned
`;
  }
}

// ── Commands ─────────────────────────────────────────────

async function cmdAdd(type: string, args: Record<string, string>): Promise<void> {
  const key = type as CollectionKey;
  if (!COLLECTIONS[key]) {
    console.error(`Unknown type: ${type}. Valid types: ${Object.keys(COLLECTIONS).join(", ")}`);
    process.exit(1);
  }

  const col = COLLECTIONS[key];

  if (!args.title) {
    console.error(`Error: --title is required`);
    process.exit(1);
  }

  const id = await getNextId(col.dir, col.prefix);
  const slug = slugify(args.title);
  const filename = `${id}—${slug}.md`;
  const filepath = join(ROOT, col.dir, filename);

  // Check for duplicate IDs
  const fullDir = join(ROOT, col.dir);
  if (existsSync(fullDir)) {
    const files = await readdir(fullDir);
    if (files.some((f) => f.startsWith(id))) {
      console.error(`Error: ID ${id} already exists in ${col.dir}/`);
      process.exit(1);
    }
  }

  const content = generateEntry(key, id, args);
  await writeFile(filepath, content, "utf-8");

  console.log(`${BOLD}✓ Created ${col.name}${RESET}`);
  console.log(`  ${DIM}ID:${RESET}   ${id}`);
  console.log(`  ${DIM}File:${RESET} ${col.dir}/${filename}`);
  console.log(`  ${DIM}Title:${RESET} ${args.title}`);
}

async function cmdList(type: string, filterDomain?: string): Promise<void> {
  const key = type as CollectionKey;
  if (!COLLECTIONS[key]) {
    // List all if type is "all"
    if (type === "all") {
      if (filterDomain) console.log(`\n${DIM}(filtered: ${filterDomain})${RESET}`);
      for (const [k, col] of Object.entries(COLLECTIONS)) {
        const entries = await listEntries(col.dir, col.prefix, filterDomain);
        if (entries.length > 0) {
          const plural = col.name === "Hypothesis" ? "Hypotheses" : col.name + "s";
          console.log(`\n${BOLD}${plural} (${col.prefix}-)${RESET}`);
          for (const e of entries) {
            console.log(`  ${e.id}  ${colorStatus(e.status)}  ${e.title}`);
          }
        }
      }
      return;
    }
    console.error(`Unknown type: ${type}. Valid types: ${Object.keys(COLLECTIONS).join(", ")}, all`);
    process.exit(1);
  }

  const col = COLLECTIONS[key];
  const entries = await listEntries(col.dir, col.prefix, filterDomain);

  if (entries.length === 0) {
    console.log(`${DIM}No ${col.name.toLowerCase()}s found.${RESET}`);
    return;
  }

  const plural = col.name === "Hypothesis" ? "Hypotheses" : col.name + "s";
  console.log(`\n${BOLD}${plural} (${col.prefix}-)${RESET}`);
  if (filterDomain) console.log(`${DIM}(filtered: ${filterDomain})${RESET}`);
  console.log();
  for (const e of entries) {
    console.log(`  ${e.id}  ${colorStatus(e.status)}  ${e.title}`);
  }
  console.log();
}

async function cmdStatus(filterDomain?: string): Promise<void> {
  console.log(`\n${BOLD}┌─────────────────────────────────────────┐${RESET}`);
  console.log(`${BOLD}│           LADDER PIPELINE STATUS         │${RESET}`);
  console.log(`${BOLD}└─────────────────────────────────────────┘${RESET}\n`);

  if (filterDomain) {
    console.log(`  ${DIM}(filtered: ${filterDomain})${RESET}\n`);
  }

  const stages = [
    { key: "source" as const, arrow: " → " },
    { key: "idea" as const, arrow: " → " },
    { key: "hypothesis" as const, arrow: " → " },
    { key: "experiment" as const, arrow: " → " },
    { key: "result" as const, arrow: " ↩ " },
  ];

  const counts: Record<string, { total: number; byStatus: Record<string, number> }> = {};

  for (const stage of stages) {
    const col = COLLECTIONS[stage.key];
    const entries = await listEntries(col.dir, col.prefix, filterDomain);
    const byStatus: Record<string, number> = {};
    for (const e of entries) {
      byStatus[e.status] = (byStatus[e.status] || 0) + 1;
    }
    counts[stage.key] = { total: entries.length, byStatus };
  }

  // Also count algorithms
  const alEntries = await listEntries(COLLECTIONS.algorithm.dir, COLLECTIONS.algorithm.prefix, filterDomain);
  const alByStatus: Record<string, number> = {};
  for (const e of alEntries) {
    alByStatus[e.status] = (alByStatus[e.status] || 0) + 1;
  }
  counts.algorithm = { total: alEntries.length, byStatus: alByStatus };

  // Pipeline flow
  console.log(`  ${BOLD}Sources${RESET}  →  ${BOLD}Ideas${RESET}  →  ${BOLD}Hypotheses${RESET}  →  ${BOLD}Experiments${RESET}  →  ${BOLD}Results${RESET}`);
  console.log(`    ${counts.source.total}          ${counts.idea.total}          ${counts.hypothesis.total}              ${counts.experiment.total}             ${counts.result.total}`);
  console.log();

  // Algorithms (separate track)
  console.log(`  ${BOLD}Algorithms${RESET}: ${counts.algorithm.total}`);
  console.log();

  // Status breakdown
  console.log(`  ${DIM}Status breakdown:${RESET}`);
  for (const [key, data] of Object.entries(counts)) {
    if (data.total === 0) continue;
    const col = COLLECTIONS[key as CollectionKey];
    const statusStr = Object.entries(data.byStatus)
      .map(([s, n]) => `${colorStatus(s)}: ${n}`)
      .join(", ");
    console.log(`    ${col.name}: ${statusStr}`);
  }
  console.log();

  // Loop indicator
  const resultEntries = await listEntries(COLLECTIONS.result.dir, COLLECTIONS.result.prefix, filterDomain);
  const loopCount = resultEntries.filter((e) => e.status === "complete").length;
  if (loopCount > 0) {
    console.log(`  ${BOLD}↩ Loop:${RESET} ${loopCount} result(s) feeding back into pipeline`);
    console.log();
  }
}

async function cmdEnrich(idOrType: string): Promise<void> {
  // Find the entry file by ID prefix or full ID
  let found: { filepath: string; type: CollectionKey; content: string } | null = null;

  for (const [key, col] of Object.entries(COLLECTIONS) as [CollectionKey, (typeof COLLECTIONS)[CollectionKey]][]) {
    const fullDir = join(ROOT, col.dir);
    if (!existsSync(fullDir)) continue;
    const files = await readdir(fullDir);
    for (const file of files) {
      if (file.startsWith(idOrType) && file.endsWith(".md")) {
        const filepath = join(fullDir, file);
        const content = await readFile(filepath, "utf-8");
        found = { filepath, type: key, content };
        break;
      }
    }
    if (found) break;
  }

  if (!found) {
    console.error(`Error: No entry found matching "${idOrType}"`);
    process.exit(1);
  }

  const fm = parseFrontmatter(found.content);

  // Check if already enriched (scores > 0 for ideas, or non-placeholder description)
  const isIdea = found.type === "idea";
  if (isIdea) {
    const hasScores = found.content.includes("feasibility: 0") === false;
    const hasDescription = !found.content.match(/## Description\n\n.{0,100}\n\n## Provenance\n\n\n/);
    if (hasScores && hasDescription) {
      console.log(`${DIM}Already enriched: ${fm.id || idOrType}${RESET}`);
      return;
    }
  }

  // Report what needs enrichment
  console.log(`${BOLD}Needs enrichment:${RESET} ${fm.id || idOrType}`);
  console.log(`  ${DIM}Title:${RESET} ${fm.title || "(untitled)"}`);
  console.log(`  ${DIM}Type:${RESET} ${found.type}`);
  console.log(`  ${DIM}File:${RESET} ${found.filepath}`);

  // Type-specific enrichment checks
  const missingFields: string[] = [];

  if (isIdea) {
    const sections = ["Description", "Provenance", "Connection", "Next Steps"];
    const empty: string[] = [];
    for (const section of sections) {
      const regex = new RegExp(`## ${section}\\n\\n([^#]*)`, "m");
      const match = found.content.match(regex);
      if (!match || match[1].trim() === "" || match[1].trim() === fm.title) {
        empty.push(section);
      }
    }
    if (empty.length > 0) {
      console.log(`  ${DIM}Empty sections:${RESET} ${empty.join(", ")}`);
    }
    if (found.content.includes("feasibility: 0")) {
      console.log(`  ${DIM}Scores:${RESET} all zero (need rating)`);
    }
  } else if (found.type === "source") {
    if (!fm.domain || fm.domain === '""') missingFields.push("domain");
    if (!fm.relevance || fm.relevance === '""') missingFields.push("relevance");
  } else if (found.type === "hypothesis") {
    if (!fm.prediction || fm.prediction === '""') missingFields.push("prediction");
    if (!fm.metric || fm.metric === '""') missingFields.push("metric");
    if (!fm.success_criteria || fm.success_criteria === '""') missingFields.push("success_criteria");
  } else if (found.type === "experiment") {
    if (!fm.methodology || fm.methodology === '""') missingFields.push("methodology");
    if (!fm.success_criteria || fm.success_criteria === '""') missingFields.push("success_criteria");
  } else if (found.type === "result") {
    if (fm.outcome === "inconclusive") missingFields.push("outcome (still inconclusive)");
  } else if (found.type === "algorithm") {
    if (!fm.domain || fm.domain === '""') missingFields.push("domain");
    if (!fm.complexity || fm.complexity === '""') missingFields.push("complexity");
  }

  if (missingFields.length > 0) {
    console.log(`  ${DIM}Missing fields:${RESET} ${missingFields.join(", ")}`);
  }

  // Check for empty body sections (all types)
  if (!isIdea) {
    const sections = found.content.split(/\n## /);
    const emptySections = sections
      .slice(1) // skip content before first ##
      .filter((s) => s.trim().split("\n").length <= 2)
      .map((s) => s.split("\n")[0].trim());
    if (emptySections.length > 0) {
      console.log(`  ${DIM}Empty sections:${RESET} ${emptySections.join(", ")}`);
    }
  }

  // Read linked sources for context (ideas only)
  if (isIdea && fm.sources) {
    const sourceIds = fm.sources.replace(/[\[\]]/g, "").split(",").map((s: string) => s.trim()).filter(Boolean);
    if (sourceIds.length > 0) {
      console.log(`  ${DIM}Linked sources:${RESET} ${sourceIds.join(", ")}`);
      for (const srcId of sourceIds) {
        const srcDir = join(ROOT, "Sources");
        if (existsSync(srcDir)) {
          const srcFiles = await readdir(srcDir);
          const srcFile = srcFiles.find((f) => f.startsWith(srcId));
          if (srcFile) {
            const srcContent = await readFile(join(srcDir, srcFile), "utf-8");
            const srcFm = parseFrontmatter(srcContent);
            console.log(`    ${srcId}: ${srcFm.title || "(untitled)"}`);
          }
        }
      }
    }
  }

  console.log();
  console.log(`${BOLD}Action:${RESET} Edit the file to fill empty sections and set scores.`);
  console.log(`  Use: claude "enrich ${fm.id || idOrType}" or edit manually.`);
}

async function cmdStubs(type?: string, filterDomain?: string): Promise<void> {
  const typesToCheck = type
    ? [type as CollectionKey]
    : (Object.keys(COLLECTIONS) as CollectionKey[]);

  let totalStubs = 0;

  for (const key of typesToCheck) {
    const col = COLLECTIONS[key];
    if (!col) continue;
    const fullDir = join(ROOT, col.dir);
    if (!existsSync(fullDir)) continue;

    const files = await readdir(fullDir);
    const stubs: string[] = [];

    for (const file of files) {
      if (!file.match(new RegExp(`^${col.prefix}-\\d`)) || !file.endsWith(".md")) continue;
      const content = await readFile(join(fullDir, file), "utf-8");
      const fm = parseFrontmatter(content);

      if (filterDomain && !matchesDomain(fm.domain || "", filterDomain)) continue;

      // Check if stub: for ideas, scores all 0 and description = title
      if (key === "idea") {
        const hasZeroScores = content.includes("feasibility: 0");
        const descMatch = content.match(/## Description\n\n(.*?)\n/);
        const descIsTitle = descMatch && descMatch[1].trim() === (fm.title || "").trim();
        if (hasZeroScores && descIsTitle) {
          stubs.push(`  ${fm.id || file}  ${colorStatus(fm.status || "draft")}  ${fm.title || "(untitled)"}`);
        }
      } else {
        // For other types, check if body sections are empty placeholders
        const sections = content.split(/\n## /);
        const emptyCount = sections.filter((s) => s.trim().split("\n").length <= 2).length;
        if (emptyCount > sections.length / 2) {
          stubs.push(`  ${fm.id || file}  ${colorStatus(fm.status || "draft")}  ${fm.title || "(untitled)"}`);
        }
      }
    }

    if (stubs.length > 0) {
      console.log(`\n${BOLD}${col.name} stubs (${stubs.length}):${RESET}`);
      for (const s of stubs) console.log(s);
      totalStubs += stubs.length;
    }
  }

  if (totalStubs === 0) {
    console.log(`${DIM}No stubs found — all entries are enriched.${RESET}`);
  } else {
    console.log(`\n${BOLD}Total:${RESET} ${totalStubs} stubs need enrichment.`);
    console.log(`${DIM}Run: bun run ladder enrich <ID> to see what's missing.${RESET}`);
  }
}

function showHelp(): void {
  console.log(`
${BOLD}Ladder${RESET} — Systematic pipeline for turning observations into verified improvements

${BOLD}Usage:${RESET}
  bun run ladder <command> [options]

${BOLD}Commands:${RESET}
  add <type>      Create a new entry
  enrich <ID>     Show what needs enrichment for an entry
  stubs [type]    List all stub/unenriched entries
  list <type>     List entries (or "all")
  status          Show pipeline overview

${BOLD}Types:${RESET}
  source          Raw inputs (SR-)
  idea            Candidate solutions (ID-)
  hypothesis      Testable predictions (HY-)
  experiment      Structured tests (EX-)
  algorithm       Proven methods (AL-)
  result          Verified outcomes (RE-)

${BOLD}Options for 'add':${RESET}
  --title         Entry title (required)
  --domain        Domain tag (dev, legal-strategy, legal-evidence, etc.)
  --source        Source ID (for ideas)
  --idea          Idea ID (for hypotheses)
  --hypothesis    Hypothesis ID (for experiments)
  --experiment    Experiment ID (for results)
  --algorithm     Algorithm ID (for experiments)
  --type          Source type (observation, ruling, filing, intel, etc.)
  --url           Source URL
  --phase         Cognitive phase (consume, dream, daydream, etc.)

${BOLD}Filtering:${RESET}
  --domain        Filter by domain prefix (list, status, stubs)

${BOLD}Examples:${RESET}
  bun run ladder add source --title "EAT ruling on costs" --domain legal-precedent
  bun run ladder add experiment --title "Test saga pattern" --domain dev
  bun run ladder list ideas --domain legal
  bun run ladder list all --domain case-domain
  bun run ladder status --domain dev
  bun run ladder stubs --domain legal
`);
}

// ── Main ─────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === "help" || args[0] === "--help") {
  showHelp();
  process.exit(0);
}

const command = args[0];

switch (command) {
  case "add": {
    if (args.length < 2) {
      console.error("Usage: bun run ladder add <type> --title \"...\"");
      process.exit(1);
    }
    const type = args[1];
    const normalizedType = PLURALS[type] || type;
    const parsedArgs = parseArgs(args.slice(2));
    await cmdAdd(normalizedType, parsedArgs);
    break;
  }

  case "list": {
    if (args.length < 2) {
      console.error("Usage: bun run ladder list <type>");
      process.exit(1);
    }
    const type = args[1];
    const normalizedType = PLURALS[type] || type;
    const parsedArgs = parseArgs(args.slice(2));
    await cmdList(normalizedType, parsedArgs.domain);
    break;
  }

  case "status": {
    const parsedArgs = parseArgs(args.slice(1));
    await cmdStatus(parsedArgs.domain);
    break;
  }

  case "enrich": {
    if (args.length < 2) {
      console.error("Usage: bun run ladder enrich <ID>");
      process.exit(1);
    }
    await cmdEnrich(args[1]);
    break;
  }

  case "stubs": {
    let stubType = args[1];
    let argsStart = 2;
    if (stubType && stubType.startsWith("--")) {
      stubType = undefined;
      argsStart = 1;
    }
    const parsedArgs = parseArgs(args.slice(argsStart));
    await cmdStubs(stubType, parsedArgs.domain);
    break;
  }

  default:
    console.error(`Unknown command: ${command}. Run 'bun run ladder help' for usage.`);
    process.exit(1);
}
