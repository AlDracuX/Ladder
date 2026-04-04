#!/usr/bin/env bun

/**
 * PAI → Ladder Integration
 *
 * Scans PAI hooks, skills, and prompts for improvement opportunities
 * and submits them as Sources to the Ladder pipeline.
 *
 * Usage:
 *   bun run Tools/pai-integration.ts scan hooks
 *   bun run Tools/pai-integration.ts scan skills
 *   bun run Tools/pai-integration.ts scan prompts
 *   bun run Tools/pai-integration.ts scan all
 *   bun run Tools/pai-integration.ts submit --title "..." --type observation --detail "..."
 */

import { readdir, readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { join, resolve } from "path";
import { homedir } from "os";

const ROOT = resolve(import.meta.dir, "..");
const PAI_DIR = join(process.env.HOME || homedir(), ".config", "PAI", "PAI");
const CLAUDE_DIR = join(process.env.HOME || homedir(), ".claude");

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

// ── Scanners ─────────────────────────────────────────────

interface Finding {
  title: string;
  detail: string;
  location: string;
  type: "hook" | "skill" | "prompt";
}

async function scanHooks(): Promise<Finding[]> {
  const findings: Finding[] = [];
  const settingsPath = join(CLAUDE_DIR, "settings.json");

  if (!existsSync(settingsPath)) {
    console.log("  No settings.json found — skipping hooks scan");
    return findings;
  }

  try {
    const content = await readFile(settingsPath, "utf-8");
    const settings = JSON.parse(content);
    const hooks = settings.hooks || {};

    for (const [event, hookList] of Object.entries(hooks)) {
      if (!Array.isArray(hookList)) continue;
      for (const hook of hookList) {
        if (typeof hook === "object" && hook.command) {
          // Flag hooks without timeout as potential improvement
          if (!hook.timeout) {
            findings.push({
              title: `Hook ${event} missing timeout`,
              detail: `Hook command "${hook.command}" has no timeout set. Could hang indefinitely.`,
              location: `settings.json → hooks.${event}`,
              type: "hook",
            });
          }
          // Flag overly complex shell commands
          if (hook.command.includes("&&") && hook.command.split("&&").length > 3) {
            findings.push({
              title: `Complex chained hook in ${event}`,
              detail: `Hook has ${hook.command.split("&&").length} chained commands. Consider splitting into a script.`,
              location: `settings.json → hooks.${event}`,
              type: "hook",
            });
          }
        }
      }
    }
  } catch (e) {
    console.log(`  Error parsing settings.json: ${e}`);
  }

  return findings;
}

async function scanSkills(): Promise<Finding[]> {
  const findings: Finding[] = [];
  const skillsDir = join(CLAUDE_DIR, "skills");

  if (!existsSync(skillsDir)) {
    console.log("  No skills directory found — skipping skills scan");
    return findings;
  }

  async function walkDir(dir: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await walkDir(path)));
      } else if (entry.name === "SKILL.md") {
        files.push(path);
      }
    }
    return files;
  }

  const skillFiles = await walkDir(skillsDir);

  for (const file of skillFiles) {
    try {
      const content = await readFile(file, "utf-8");
      const lines = content.split("\n");

      // Check for skills without clear error handling guidance
      if (!content.includes("error") && !content.includes("fail")) {
        const skillName = file.replace(skillsDir + "/", "").replace("/SKILL.md", "");
        findings.push({
          title: `Skill "${skillName}" lacks error handling guidance`,
          detail: `SKILL.md doesn't mention error handling or failure modes. Could lead to poor error recovery.`,
          location: file,
          type: "skill",
        });
      }

      // Check for very long skills that might need decomposition
      if (lines.length > 500) {
        const skillName = file.replace(skillsDir + "/", "").replace("/SKILL.md", "");
        findings.push({
          title: `Skill "${skillName}" is very large (${lines.length} lines)`,
          detail: `Consider decomposing into sub-skills for better maintainability.`,
          location: file,
          type: "skill",
        });
      }
    } catch {
      // Skip files that can't be read
    }
  }

  return findings;
}

async function scanPrompts(): Promise<Finding[]> {
  const findings: Finding[] = [];
  const algorithmDir = join(PAI_DIR, "Algorithm");

  if (!existsSync(algorithmDir)) {
    console.log("  No Algorithm directory found — skipping prompts scan");
    return findings;
  }

  const files = await readdir(algorithmDir);
  const mdFiles = files.filter((f) => f.endsWith(".md"));

  for (const file of mdFiles) {
    try {
      const content = await readFile(join(algorithmDir, file), "utf-8");
      const lines = content.split("\n");

      // Check for TODO or FIXME comments
      const todoLines = lines.filter(
        (l) => l.includes("TODO") || l.includes("FIXME") || l.includes("HACK")
      );
      if (todoLines.length > 0) {
        findings.push({
          title: `${todoLines.length} TODO/FIXME in ${file}`,
          detail: todoLines.map((l) => l.trim()).join("; "),
          location: join(algorithmDir, file),
          type: "prompt",
        });
      }
    } catch {
      // Skip
    }
  }

  return findings;
}

// ── Commands ─────────────────────────────────────────────

async function cmdScan(target: string): Promise<void> {
  const BOLD = "\x1b[1m";
  const DIM = "\x1b[2m";
  const RESET = "\x1b[0m";
  const GREEN = "\x1b[32m";
  const YELLOW = "\x1b[33m";

  console.log(`\n${BOLD}PAI → Ladder Scanner${RESET}\n`);

  let allFindings: Finding[] = [];

  if (target === "hooks" || target === "all") {
    console.log(`${BOLD}Scanning hooks...${RESET}`);
    const findings = await scanHooks();
    allFindings.push(...findings);
    console.log(`  Found ${findings.length} improvement opportunities\n`);
  }

  if (target === "skills" || target === "all") {
    console.log(`${BOLD}Scanning skills...${RESET}`);
    const findings = await scanSkills();
    allFindings.push(...findings);
    console.log(`  Found ${findings.length} improvement opportunities\n`);
  }

  if (target === "prompts" || target === "all") {
    console.log(`${BOLD}Scanning prompts...${RESET}`);
    const findings = await scanPrompts();
    allFindings.push(...findings);
    console.log(`  Found ${findings.length} improvement opportunities\n`);
  }

  if (allFindings.length === 0) {
    console.log(`${GREEN}✓ No improvement opportunities found${RESET}`);
    return;
  }

  console.log(`${BOLD}${YELLOW}Found ${allFindings.length} total opportunities:${RESET}\n`);

  for (const finding of allFindings) {
    console.log(`  ${BOLD}${finding.title}${RESET}`);
    console.log(`  ${DIM}Type: ${finding.type} | Location: ${finding.location}${RESET}`);
    console.log(`  ${finding.detail}`);
    console.log();
  }

  console.log(
    `${DIM}To submit these as Sources, run:${RESET}`
  );
  console.log(
    `  bun run Tools/pai-integration.ts submit --title "..." --type telemetry --detail "..."\n`
  );
}

async function cmdSubmit(args: Record<string, string>): Promise<void> {
  const BOLD = "\x1b[1m";
  const DIM = "\x1b[2m";
  const RESET = "\x1b[0m";

  if (!args.title) {
    console.error("Error: --title is required");
    process.exit(1);
  }

  const id = await getNextSourceId();
  const slug = slugify(args.title);
  const filename = `${id}—${slug}.md`;
  const filepath = join(ROOT, "Sources", filename);

  const content = `---
id: ${id}
title: "${args.title}"
type: ${args.type || "telemetry"}
url: ""
status: draft
created: ${today()}
tags: [pai-integration, automated]
domain: "pai-system"
relevance: "${args.detail || ""}"
---

## Summary

${args.title}

## Key Points

- ${args.detail || "Automated finding from PAI integration scanner"}

## Connection to Problems

Identified by PAI integration scanner as a potential improvement opportunity.

## Potential Ideas

- Investigate and address this finding
- Determine if this is a systemic pattern
`;

  await writeFile(filepath, content, "utf-8");

  console.log(`${BOLD}✓ Submitted to Ladder${RESET}`);
  console.log(`  ${DIM}ID:${RESET}    ${id}`);
  console.log(`  ${DIM}File:${RESET}  Sources/${filename}`);
  console.log(`  ${DIM}Title:${RESET} ${args.title}`);
}

// ── Arg Parser ───────────────────────────────────────────

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

// ── Main ─────────────────────────────────────────────────

const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case "scan":
    await cmdScan(args[1] || "all");
    break;

  case "submit":
    await cmdSubmit(parseArgs(args.slice(1)));
    break;

  default:
    console.log(`
PAI → Ladder Integration

Usage:
  bun run Tools/pai-integration.ts scan [hooks|skills|prompts|all]
  bun run Tools/pai-integration.ts submit --title "..." --type telemetry --detail "..."
`);
}
