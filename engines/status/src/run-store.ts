/**
 * PipelineRun store — append-only files under `.aios/runs/` (#447 / harness P0).
 * Resource-Aware: one JSON file per run + thin index.jsonl (no DB).
 */
import { existsSync, mkdirSync, writeFileSync, readFileSync, appendFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { PipelineRun } from '@aios/shared';

export type PersistedPipelineRun = {
  kind: 'pipeline.run';
  at: string;
  run: PipelineRun;
};

export type PipelineRunIndexEntry = {
  runId: string;
  at: string;
  intentKind: string;
  workspaceId?: string;
  verdictPassed?: boolean;
};

function resolveHome(homePath?: string): string {
  return resolve(homePath || process.env.AIOS_HOME || process.cwd());
}

function runsDir(home: string): string {
  return join(home, '.aios', 'runs');
}

function runFile(home: string, runId: string): string {
  return join(runsDir(home), `${runId}.json`);
}

function indexFile(home: string): string {
  return join(runsDir(home), 'index.jsonl');
}

/** Persist unless AIOS_PERSIST_RUNS is 0/false/off. */
export function shouldPersistPipelineRuns(env: NodeJS.ProcessEnv = process.env): boolean {
  const v = (env.AIOS_PERSIST_RUNS || '1').trim().toLowerCase();
  return v !== '0' && v !== 'false' && v !== 'off' && v !== 'no';
}

/**
 * Write `.aios/runs/<runId>.json` and append index.jsonl.
 * Returns absolute path of the run file.
 */
export function persistPipelineRun(
  run: PipelineRun,
  options: { homePath?: string; at?: string } = {}
): string {
  const home = resolveHome(options.homePath);
  const dir = runsDir(home);
  mkdirSync(dir, { recursive: true });
  const at = options.at || new Date().toISOString();
  const payload: PersistedPipelineRun = { kind: 'pipeline.run', at, run };
  const file = runFile(home, run.runId);
  writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  const index: PipelineRunIndexEntry = {
    runId: run.runId,
    at,
    intentKind: run.intentKind,
    ...(run.workspaceId ? { workspaceId: run.workspaceId } : {}),
    ...(run.verdict ? { verdictPassed: run.verdict.passed } : {}),
  };
  appendFileSync(indexFile(home), `${JSON.stringify(index)}\n`, 'utf8');
  return file;
}

/** Load a persisted run by id, or undefined if missing / invalid. */
export function loadPipelineRun(
  runId: string,
  options: { homePath?: string } = {}
): PersistedPipelineRun | undefined {
  const id = runId.trim();
  if (!id || id.includes('/') || id.includes('..') || id.includes('\\')) {
    return undefined;
  }
  const home = resolveHome(options.homePath);
  const file = runFile(home, id);
  if (!existsSync(file)) return undefined;
  try {
    const raw = JSON.parse(readFileSync(file, 'utf8')) as PersistedPipelineRun;
    if (raw?.kind !== 'pipeline.run' || !raw.run?.runId) return undefined;
    return raw;
  } catch {
    return undefined;
  }
}

/** Newest-last list from index.jsonl (Resource-Aware: read whole index; keep small). */
export function listPipelineRuns(
  options: { homePath?: string; limit?: number } = {}
): PipelineRunIndexEntry[] {
  const home = resolveHome(options.homePath);
  const file = indexFile(home);
  if (!existsSync(file)) return [];
  const limit = Math.max(1, Math.min(options.limit ?? 50, 500));
  const lines = readFileSync(file, 'utf8').split('\n').filter(Boolean);
  const rows: PipelineRunIndexEntry[] = [];
  for (const line of lines) {
    try {
      const row = JSON.parse(line) as PipelineRunIndexEntry;
      if (row?.runId) rows.push(row);
    } catch {
      /* skip corrupt */
    }
  }
  return rows.slice(-limit);
}
