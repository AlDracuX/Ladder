#!/usr/bin/env bun

/**
 * Shared utilities for Ladder CLI tools.
 * Used by cli.ts, mine.ts, ingest.ts, and pai-integration.ts.
 */

import { readdir, readFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join, resolve } from "path";

// ── Constants ─────────────────────────────────────────

export const ROOT = resolve(import.meta.dir, "..");
export const REFLECTIONS_PATH = join(
  process.env.HOME || "~",
  ".claude",
  "MEMORY",
  "LEARNING",
  "REFLECTIONS",
  "algorithm-reflections.jsonl"
);

// ── Colors ────────────────────────────────────────────

export const RESET = "\x1b[0m";
export const BOLD = "\x1b[1m";
export const DIM = "\x1b[2m";
export const RED = "\x1b[31m";
export const GREEN = "\x1b[32m";
export const YELLOW = "\x1b[33m";
export const CYAN = "\x1b[36m";
export const WHITE = "\x1b[37m";

// ── Types ─────────────────────────────────────────────

export interface Reflection {
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

// ── Helpers ───────────────────────────────────────────

export function today(): string {
  return new Date().toISOString().split("T")[0];
}

export function slugify(title: string): string {
  return title
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, "_")
    .substring(0, 60);
}

export function parseArgs(args: string[]): Record<string, string> {
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

export async function getNextId(dir: string, prefix: string): Promise<string> {
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

export function parseFrontmatter(content: string): Record<string, string> {
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

export async function loadReflections(since?: string): Promise<Reflection[]> {
  if (!existsSync(REFLECTIONS_PATH)) return [];

  const raw = await readFile(REFLECTIONS_PATH, "utf-8");
  const lines = raw.trim().split("\n").filter((l) => l.trim());
  const reflections: Reflection[] = [];

  for (const line of lines) {
    try {
      const entry = JSON.parse(line) as Reflection;
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

export async function getExistingSourceTitles(): Promise<string[]> {
  const dir = join(ROOT, "Sources");
  if (!existsSync(dir)) return [];

  const files = await readdir(dir);
  const titles: string[] = [];

  const readPromises = files
    .filter((f) => f.match(/^SR-\d/) && f.endsWith(".md"))
    .map(async (file) => {
      try {
        const content = await readFile(join(dir, file), "utf-8");
        const fm = parseFrontmatter(content);
        if (fm.title) titles.push(fm.title);
      } catch {
        // skip
      }
    });

  await Promise.all(readPromises);
  return titles;
}

// ── Pattern Definitions ──────────────────────────────

export const PATTERNS: Record<string, { regex: RegExp; description: string; label: string }> = {
  SKILL_MISS: {
    regex: /could have used|should have used.*skill|skill.*would/i,
    description: "Available skill not utilized during execution",
    label: "Skill Underutilization",
  },
  OVER_ENGINEER: {
    regex: /overkill|simpler|unnecessary|could have.*sed|could have.*direct/i,
    description: "Simpler approach existed but complex one chosen",
    label: "Over-Engineering",
  },
  PARALLEL: {
    regex: /parallel|simultaneous|concurr|batch.*instead/i,
    description: "Independent tasks run sequentially instead of parallel",
    label: "Parallelization Misses",
  },
  VERIFY_FIRST: {
    regex: /should have (verified|checked|confirmed|validated).*before|before.*writing|before.*starting/i,
    description: "Prerequisites not verified before building",
    label: "Late Verification",
  },
  CONTEXT_MISS: {
    regex: /should have checked|should have looked|vault.*first|existing.*first/i,
    description: "Existing context not loaded before starting work",
    label: "Context Not Loaded",
  },
  PRELOAD: {
    regex: /pre-load|preload|should have.*loaded|cached.*from|check.*first/i,
    description: "Source data not pre-loaded at session start",
    label: "Source Pre-Loading Missed",
  },
  PHASE_ORDER: {
    regex: /during.*instead of after|before.*not after|earlier.*rather/i,
    description: "Work done in wrong algorithm phase",
    label: "Phase Ordering Error",
  },
  FALSE_ALARM: {
    regex: /false alarm|not needed|N\/A|unnecessary|overkill/i,
    description: "Work done on items that turned out unnecessary",
    label: "False Alarm",
  },
  EFFORT_WRONG: {
    regex: /should have set effort|effort.*too|effort.*wrong/i,
    description: "Effort level miscalibrated for task",
    label: "Effort Miscalibration",
  },
  AGENT_WASTE: {
    regex: /agent.*waste|agent.*fail|failed.*spawn|worktree.*fail/i,
    description: "Agent spawned but failed or wasted resources",
    label: "Agent Waste",
  },
};
