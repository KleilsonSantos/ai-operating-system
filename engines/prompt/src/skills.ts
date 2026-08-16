/**
 * Skill packs — how, not who (ADR-0026).
 * Default catalog is empty. File is only read when skill ids are requested.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import {
  SKILL_FAILURE_POLICIES,
  type EnvMap,
  type SkillFailurePolicy,
  type SkillManifest,
} from '@aios/shared';

export type SkillBundle = {
  skills: SkillManifest[];
  path?: string;
  skippedIds: string[];
};

export type LoadSkillsOptions = {
  cwd?: string;
  configPath?: string;
  env?: EnvMap;
};

function readEnv(env?: EnvMap): EnvMap {
  if (env) return env;
  const proc = (globalThis as { process?: { env?: EnvMap } }).process;
  return proc?.env ?? {};
}

function isFailurePolicy(value: string): value is SkillFailurePolicy {
  return (SKILL_FAILURE_POLICIES as readonly string[]).includes(value);
}

function asStringList(value: unknown, field: string, index: number): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(`skill[${index}]: ${field} must be a string array`);
  }
  return value.map((item) => item.trim()).filter(Boolean);
}

export function parseSkillManifest(raw: unknown, index: number): SkillManifest {
  if (!raw || typeof raw !== 'object') {
    throw new Error(`skill[${index}]: expected object`);
  }
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || !r.id.trim()) {
    throw new Error(`skill[${index}]: id required`);
  }
  if (typeof r.purpose !== 'string' || !r.purpose.trim()) {
    throw new Error(`skill[${index}]: purpose required`);
  }
  if (!Array.isArray(r.allowedTools) || r.allowedTools.some((t) => typeof t !== 'string')) {
    throw new Error(`skill[${index}]: allowedTools must be a string array`);
  }
  if (typeof r.failurePolicy !== 'string' || !isFailurePolicy(r.failurePolicy)) {
    throw new Error(`skill[${index}]: failurePolicy must be fail|skip|retry`);
  }
  const allowedTools = r.allowedTools.map((t) => t.trim()).filter(Boolean);
  return {
    id: r.id.trim(),
    purpose: r.purpose.trim(),
    allowedTools,
    failurePolicy: r.failurePolicy,
    ...(r.prerequisites !== undefined
      ? { prerequisites: asStringList(r.prerequisites, 'prerequisites', index) }
      : {}),
    ...(r.contextRequirements !== undefined
      ? { contextRequirements: asStringList(r.contextRequirements, 'contextRequirements', index) }
      : {}),
    ...(r.validation !== undefined
      ? { validation: asStringList(r.validation, 'validation', index) }
      : {}),
  };
}

export function parseSkillCatalog(contents: string): SkillManifest[] {
  let data: unknown;
  try {
    data = JSON.parse(contents);
  } catch {
    throw new Error('invalid JSON in skill catalog');
  }
  const list = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && Array.isArray((data as { skills?: unknown }).skills)
      ? (data as { skills: unknown[] }).skills
      : null;
  if (!list) {
    throw new Error('skill catalog must be an array or { "skills": [...] }');
  }
  return list.map((item, i) => parseSkillManifest(item, i));
}

function findSkillsFileUpwards(start: string): string | undefined {
  let dir = resolve(start);
  for (;;) {
    const candidate = join(dir, 'skills', 'aios.skills.json');
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

export function resolveSkillsPath(options: LoadSkillsOptions = {}): string | undefined {
  const env = readEnv(options.env);
  if (options.configPath) {
    return resolve(options.cwd ?? process.cwd(), options.configPath);
  }
  if (env.AIOS_SKILLS_PATH) {
    return resolve(env.AIOS_SKILLS_PATH);
  }
  return findSkillsFileUpwards(options.cwd ?? process.cwd());
}

export function loadSkillCatalog(options: LoadSkillsOptions = {}): {
  skills: SkillManifest[];
  path?: string;
} {
  const path = resolveSkillsPath(options);
  if (!path || !existsSync(path)) {
    return { skills: [] };
  }
  const skills = parseSkillCatalog(readFileSync(path, 'utf8'));
  return { skills, path };
}

/** Opt-in only. Unknown ids are skipped — they do not invent a pack. */
export function selectSkills(
  catalog: SkillManifest[],
  requestedIds?: string[]
): { selected: SkillManifest[]; skippedIds: string[] } {
  if (!requestedIds?.length) {
    return { selected: [], skippedIds: [] };
  }
  const byId = new Map(catalog.map((s) => [s.id, s]));
  const selected: SkillManifest[] = [];
  const skippedIds: string[] = [];
  const seen = new Set<string>();
  for (const raw of requestedIds) {
    const id = raw.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const hit = byId.get(id);
    if (hit) selected.push(hit);
    else skippedIds.push(id);
  }
  return { selected, skippedIds };
}

export function loadSkills(
  requestedIds: string[] | undefined,
  options: LoadSkillsOptions = {}
): SkillBundle {
  if (!requestedIds?.length) {
    return { skills: [], skippedIds: [] };
  }
  const catalog = loadSkillCatalog(options);
  const { selected, skippedIds } = selectSkills(catalog.skills, requestedIds);
  return { skills: selected, skippedIds, path: catalog.path };
}
