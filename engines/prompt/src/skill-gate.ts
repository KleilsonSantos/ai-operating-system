/**
 * Skill pack tool gate — how, not who (ADR-0026).
 * When skillIds are requested, the caller tool must appear in the union of
 * selected packs' allowedTools. Privilege gates still run first (never expand).
 */
import { loadSkills, type LoadSkillsOptions } from './skills.js';

export type SkillToolDenyReason = 'skill.tool-denied' | 'skill.none-resolved';

export type SkillToolDecision = {
  allowed: boolean;
  tool: string;
  /** Requested ids (trimmed, non-empty). */
  skillIds: string[];
  /** Union of allowedTools from resolved packs. */
  allowedTools: string[];
  skippedIds: string[];
  reason?: SkillToolDenyReason;
};

function normalizeIds(skillIds: string[] | undefined): string[] {
  if (!skillIds?.length) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of skillIds) {
    const id = typeof raw === 'string' ? raw.trim() : '';
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

/**
 * Opt-in only. Empty / omitted skillIds → allowed (default-none).
 * Unknown ids are skipped; if none resolve → denied (`skill.none-resolved`).
 */
export function authorizeSkillTool(
  tool: string,
  skillIds: string[] | undefined,
  options: LoadSkillsOptions = {}
): SkillToolDecision {
  const ids = normalizeIds(skillIds);
  if (ids.length === 0) {
    return { allowed: true, tool, skillIds: [], allowedTools: [], skippedIds: [] };
  }

  const bundle = loadSkills(ids, options);
  if (bundle.skills.length === 0) {
    return {
      allowed: false,
      tool,
      skillIds: ids,
      allowedTools: [],
      skippedIds: bundle.skippedIds,
      reason: 'skill.none-resolved',
    };
  }

  const allowedTools = [
    ...new Set(bundle.skills.flatMap((s) => s.allowedTools.map((t) => t.trim()).filter(Boolean))),
  ];
  if (!allowedTools.includes(tool)) {
    return {
      allowed: false,
      tool,
      skillIds: ids,
      allowedTools,
      skippedIds: bundle.skippedIds,
      reason: 'skill.tool-denied',
    };
  }

  return {
    allowed: true,
    tool,
    skillIds: ids,
    allowedTools,
    skippedIds: bundle.skippedIds,
  };
}

export function deniedSkillPayload(decision: SkillToolDecision): {
  error: 'skill.denied';
  tool: string;
  skillIds: string[];
  allowedTools: string[];
  skippedIds: string[];
  reason?: SkillToolDenyReason;
} {
  return {
    error: 'skill.denied',
    tool: decision.tool,
    skillIds: decision.skillIds,
    allowedTools: decision.allowedTools,
    skippedIds: decision.skippedIds,
    ...(decision.reason ? { reason: decision.reason } : {}),
  };
}

/** Pull skillIds from MCP tool args when present. */
export function skillIdsFromArgs(args: unknown): string[] | undefined {
  if (!args || typeof args !== 'object') return undefined;
  const raw = (args as { skillIds?: unknown }).skillIds;
  if (!Array.isArray(raw)) return undefined;
  return raw.filter((x): x is string => typeof x === 'string');
}
