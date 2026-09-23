/**
 * Deterministic selection evals (#447 / harness P0).
 * Asserts Intent → AGENT_MATRIX → capability class before execution.
 * Does not invent a second Skill/Router engine (ADR-0026 / 0025).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveIntent } from '@aios/intent';
import { agentsForIntent } from '@aios/decision';
import {
  routeModel,
  type IntentKind,
  type ModelCapabilityClass,
  type RouteCostBudget,
} from '@aios/shared';
import { runPipeline } from '@aios/pipeline';

export type GoldenExpect = {
  intentKind: IntentKind;
  capabilityClass?: ModelCapabilityClass;
  agents?: {
    include?: string[];
    exclude?: string[];
  };
  /** When `request.skillIds` is set, assert recorded ids (pipeline contract). */
  skillIds?: {
    selected?: string[];
    rejected?: string[];
  };
  /** Pipeline-only: capabilities.act */
  act?: boolean;
};

export type GoldenTask = {
  id: string;
  input: string;
  /** selection = intent+route+agents (default); pipeline = full runPipeline */
  mode?: 'selection' | 'pipeline';
  request?: {
    skillIds?: string[];
    costBudget?: RouteCostBudget;
    risk?: 'low' | 'medium' | 'high';
    privacy?: 'public' | 'internal' | 'sensitive';
  };
  expect: GoldenExpect;
};

export type EvalFailure = {
  id: string;
  field: string;
  expected: unknown;
  actual: unknown;
};

export type EvalResult = {
  id: string;
  ok: boolean;
  failures: EvalFailure[];
};

function fixturesDir(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return join(here, '..', 'fixtures');
}

/** Load all `*.json` golden tasks from integrations/evals/fixtures/. */
export function loadGoldenTasks(dir = fixturesDir()): GoldenTask[] {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort();
  const tasks: GoldenTask[] = [];
  for (const file of files) {
    const raw = JSON.parse(readFileSync(join(dir, file), 'utf8')) as GoldenTask | GoldenTask[];
    if (Array.isArray(raw)) tasks.push(...raw);
    else tasks.push(raw);
  }
  return tasks;
}

function pushFail(
  failures: EvalFailure[],
  id: string,
  field: string,
  expected: unknown,
  actual: unknown
): void {
  failures.push({ id, field, expected, actual });
}

/** Cheap path: Intent → agents → routeModel (no disk / no plugins). */
export function runSelectionEval(task: GoldenTask): EvalResult {
  const failures: EvalFailure[] = [];
  const intent = resolveIntent(task.input);
  if (intent.kind !== task.expect.intentKind) {
    pushFail(failures, task.id, 'intentKind', task.expect.intentKind, intent.kind);
  }

  const agents = agentsForIntent(intent.kind as IntentKind).map(String);
  for (const want of task.expect.agents?.include ?? []) {
    if (!agents.includes(want)) {
      pushFail(failures, task.id, `agents.include:${want}`, true, false);
    }
  }
  for (const ban of task.expect.agents?.exclude ?? []) {
    if (agents.includes(ban)) {
      pushFail(failures, task.id, `agents.exclude:${ban}`, false, true);
    }
  }

  const route = routeModel({
    intentKind: intent.kind,
    costBudget: task.request?.costBudget,
    risk: task.request?.risk,
    privacy: task.request?.privacy,
  });
  if (task.expect.capabilityClass && route.capabilityClass !== task.expect.capabilityClass) {
    pushFail(
      failures,
      task.id,
      'capabilityClass',
      task.expect.capabilityClass,
      route.capabilityClass
    );
  }

  return { id: task.id, ok: failures.length === 0, failures };
}

/** Full pipeline path — use sparingly (Resource-Aware). */
export async function runPipelineEval(
  task: GoldenTask,
  options: { repoPath: string; homePath: string } = {
    repoPath: process.cwd(),
    homePath: process.cwd(),
  }
): Promise<EvalResult> {
  const base = runSelectionEval(task);
  if (!base.ok) return base;

  const prevPersist = process.env.AIOS_PERSIST_RUNS;
  const prevHome = process.env.AIOS_HOME;
  process.env.AIOS_PERSIST_RUNS = '0';
  process.env.AIOS_HOME = options.homePath;
  try {
    const res = await runPipeline({
      input: task.input,
      repoPath: options.repoPath,
      skillIds: task.request?.skillIds,
      costBudget: task.request?.costBudget,
      risk: task.request?.risk,
      privacy: task.request?.privacy,
    });
    const failures = [...base.failures];
    if (task.expect.act !== undefined && res.capabilities?.act !== task.expect.act) {
      pushFail(failures, task.id, 'capabilities.act', task.expect.act, res.capabilities?.act);
    }
    const recorded = res.run?.skillIds ?? [];
    for (const want of task.expect.skillIds?.selected ?? []) {
      if (!recorded.includes(want)) {
        pushFail(failures, task.id, `skillIds.selected:${want}`, true, false);
      }
    }
    for (const ban of task.expect.skillIds?.rejected ?? []) {
      if (recorded.includes(ban)) {
        pushFail(failures, task.id, `skillIds.rejected:${ban}`, false, true);
      }
    }
    if (task.id === 'pipeline-skill-verify') {
      const skillDecision = res.run?.decisions?.find(
        (d) => d.subject === 'skill' && d.value === 'multi-cloud-honesty'
      );
      // Without workspaceId, check:workspaceId fails → skip policy on multi-cloud-honesty
      if (!skillDecision || skillDecision.outcome !== 'skipped') {
        pushFail(
          failures,
          task.id,
          'decisions.skill.multi-cloud-honesty',
          'skipped (exitCriteria)',
          skillDecision
        );
      }
    }
    return { id: task.id, ok: failures.length === 0, failures };
  } finally {
    if (prevPersist === undefined) delete process.env.AIOS_PERSIST_RUNS;
    else process.env.AIOS_PERSIST_RUNS = prevPersist;
    if (prevHome === undefined) delete process.env.AIOS_HOME;
    else process.env.AIOS_HOME = prevHome;
  }
}

export async function runGoldenTask(
  task: GoldenTask,
  options?: { repoPath: string; homePath: string }
): Promise<EvalResult> {
  if (task.mode === 'pipeline') return runPipelineEval(task, options);
  return runSelectionEval(task);
}
