/**
 * Optional PKB vector cache under `.aios/pkb-vectors.sqlite` (ADR-0032 / #327).
 * Uses Node built-in `node:sqlite` + in-process cosine (equivalent local store;
 * dedicated sqlite-vec extension load deferred — Resource-Aware packaging).
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { parsePkbFrontmatter } from './pkb-frontmatter.js';

export const PKB_VECTOR_FILENAME = 'pkb-vectors.sqlite';
export const PKB_EMBED_DIM = 256;

export type PkbVectorRebuildResult = {
  ok: boolean;
  path: string;
  indexed: number;
  reason?: string;
};

export type PkbSemanticHit = {
  id?: string;
  path: string;
  title?: string;
  domain?: string;
  tags: string[];
  score: number;
  matches: string[];
};

function listPkbMarkdown(repoPath: string): string[] {
  const root = join(repoPath, 'docs', 'prompts', 'by-domain');
  if (!existsSync(root)) return [];
  const out: string[] = [];
  const walk = (abs: string, rel: string) => {
    for (const name of readdirSync(abs)) {
      const a = join(abs, name);
      const r = rel ? `${rel}/${name}` : name;
      const st = statSync(a);
      if (st.isDirectory()) walk(a, r);
      else if (name.endsWith('.md')) out.push(`docs/prompts/by-domain/${r}`);
    }
  };
  walk(root, '');
  return out.sort();
}

/** Deterministic bag-of-tokens hash embedding — offline, no provider (#327 MVP). */
export function hashEmbed(text: string, dim = PKB_EMBED_DIM): number[] {
  const vec = new Float64Array(dim);
  const tokens = text
    .toLowerCase()
    .split(/[^a-z0-9_./+-]+/i)
    .filter((t) => t.length > 1);
  for (const token of tokens) {
    const h = createHash('sha256').update(token).digest();
    const idx = h.readUInt32BE(0) % dim;
    const sign = h[4]! & 1 ? 1 : -1;
    vec[idx]! += sign;
  }
  let norm = 0;
  for (let i = 0; i < dim; i++) norm += vec[i]! * vec[i]!;
  norm = Math.sqrt(norm) || 1;
  const out = new Array<number>(dim);
  for (let i = 0; i < dim; i++) out[i] = vec[i]! / norm;
  return out;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let dot = 0;
  for (let i = 0; i < n; i++) dot += a[i]! * b[i]!;
  return dot;
}

export function pkbVectorIndexPath(homePath: string): string {
  return join(resolve(homePath), '.aios', PKB_VECTOR_FILENAME);
}

function contentHash(raw: string): string {
  return createHash('sha256').update(raw).digest('hex').slice(0, 16);
}

function openDb(path: string, create: boolean): DatabaseSync | null {
  try {
    if (!create && !existsSync(path)) return null;
    mkdirSync(dirname(path), { recursive: true });
    const db = new DatabaseSync(path);
    db.exec(`
      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS vectors (
        path TEXT PRIMARY KEY,
        id TEXT,
        title TEXT,
        domain TEXT,
        tags_json TEXT NOT NULL,
        content_hash TEXT NOT NULL,
        embedding_json TEXT NOT NULL
      );
    `);
    return db;
  } catch {
    return null;
  }
}

/**
 * Rebuild the local PKB vector cache from `docs/prompts/by-domain/**`.
 */
export function rebuildPkbVectorIndex(options: {
  homePath?: string;
  repoPath?: string;
}): PkbVectorRebuildResult {
  const homePath = resolve(options.homePath || process.env.AIOS_HOME || process.cwd());
  const repoPath = resolve(options.repoPath || process.cwd());
  const path = pkbVectorIndexPath(homePath);
  const db = openDb(path, true);
  if (!db) {
    return { ok: false, path, indexed: 0, reason: 'sqlite-open-failed' };
  }

  try {
    db.exec('DELETE FROM vectors');
    const files = listPkbMarkdown(repoPath);
    const insert = db.prepare(
      `INSERT INTO vectors (path, id, title, domain, tags_json, content_hash, embedding_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    let indexed = 0;
    for (const rel of files) {
      let raw: string;
      try {
        raw = readFileSync(join(repoPath, rel), 'utf8');
      } catch {
        continue;
      }
      const { meta, body } = parsePkbFrontmatter(raw);
      const blob = [meta.id, meta.title, meta.purpose, meta.domain, meta.tags.join(' '), body]
        .filter(Boolean)
        .join('\n');
      const embedding = hashEmbed(blob);
      insert.run(
        rel,
        meta.id ?? null,
        meta.title ?? null,
        meta.domain ?? null,
        JSON.stringify(meta.tags),
        contentHash(raw),
        JSON.stringify(embedding)
      );
      indexed += 1;
    }
    db.prepare(
      `INSERT INTO meta (key, value) VALUES ('repoPath', ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    ).run(repoPath);
    db.prepare(
      `INSERT INTO meta (key, value) VALUES ('updatedAt', ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    ).run(new Date().toISOString());
    db.prepare(
      `INSERT INTO meta (key, value) VALUES ('embed', ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    ).run(`hash-v1/${PKB_EMBED_DIM}`);
    return { ok: true, path, indexed };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return { ok: false, path, indexed: 0, reason };
  } finally {
    try {
      db.close();
    } catch {
      /* ignore */
    }
  }
}

export function searchPkbIndex(options: {
  homePath?: string;
  query: string;
  tags?: string[];
  domain?: string;
  limit?: number;
}):
  { ok: true; hits: PkbSemanticHit[]; path: string } | { ok: false; reason: string; path: string } {
  const homePath = resolve(options.homePath || process.env.AIOS_HOME || process.cwd());
  const path = pkbVectorIndexPath(homePath);
  const db = openDb(path, false);
  if (!db) {
    return { ok: false, reason: 'index-missing', path };
  }

  try {
    const q = options.query.trim();
    if (!q) {
      return { ok: false, reason: 'query-required', path };
    }
    const qVec = hashEmbed(q);
    const tags = (options.tags || []).map((t) => t.trim().toLowerCase()).filter(Boolean);
    const domain = options.domain?.trim().toLowerCase();
    const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);

    const rows = db
      .prepare(`SELECT path, id, title, domain, tags_json, embedding_json FROM vectors`)
      .all() as Array<{
      path: string;
      id: string | null;
      title: string | null;
      domain: string | null;
      tags_json: string;
      embedding_json: string;
    }>;

    const hits: PkbSemanticHit[] = [];
    for (const row of rows) {
      let rowTags: string[] = [];
      try {
        rowTags = JSON.parse(row.tags_json) as string[];
      } catch {
        rowTags = [];
      }
      if (domain && (row.domain || '').toLowerCase() !== domain) continue;
      if (tags.length > 0) {
        const set = new Set(rowTags.map((t) => t.toLowerCase()));
        if (!tags.every((t) => set.has(t))) continue;
      }
      let emb: number[];
      try {
        emb = JSON.parse(row.embedding_json) as number[];
      } catch {
        continue;
      }
      const score = cosineSimilarity(qVec, emb);
      hits.push({
        id: row.id ?? undefined,
        path: row.path,
        title: row.title ?? undefined,
        domain: row.domain ?? undefined,
        tags: rowTags,
        score,
        matches: ['semantic'],
      });
    }
    hits.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));
    return { ok: true, hits: hits.slice(0, limit), path };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return { ok: false, reason, path };
  } finally {
    try {
      db.close();
    } catch {
      /* ignore */
    }
  }
}
