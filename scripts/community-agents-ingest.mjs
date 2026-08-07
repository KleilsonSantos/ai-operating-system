#!/usr/bin/env node
/**
 * Discover GitHub repositories tagged with topic `aios-agent` and write a
 * community catalog for @aios-platform/agent-registry (Phase 5b / ADR-0023).
 *
 * Resource-Aware: one search request + optional per-repo HEAD checks; no
 * always-on ingest service. Prefer GITHUB_TOKEN / GH_TOKEN to avoid rate limits.
 *
 * Skips rewriting the file when the agents list is unchanged (ignores
 * generatedAt churn) so weekly CI does not open empty PRs.
 *
 * Usage:
 *   node scripts/community-agents-ingest.mjs
 *   node scripts/community-agents-ingest.mjs --out path/to/catalog.json
 *   node scripts/community-agents-ingest.mjs --dry-run
 *   node scripts/community-agents-ingest.mjs --force
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync, appendFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_OUT = join(root, 'packages/agent-registry/data/community-catalog.json');
const TOPIC = 'aios-agent';
const SEARCH_QUERY = `topic:${TOPIC}`;
const STALE_MS = 365 * 24 * 60 * 60 * 1000;
const SUSPICIOUS_RE =
  /\b(airdrop|crypto.?drain|steal|credential.?harvest|ransomware|malware.?as.?a.?service)\b/i;
const MANIFEST_CANDIDATES = ['agent.yaml', 'agent.yml', 'agent.json', '.aios/agent.yaml'];

function parseArgs(argv) {
  let out = DEFAULT_OUT;
  let dryRun = false;
  let force = false;
  let limit = 50;
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') dryRun = true;
    else if (a === '--force') force = true;
    else if (a === '--out') out = argv[++i];
    else if (a.startsWith('--out=')) out = a.slice('--out='.length);
    else if (a === '--limit') limit = Number(argv[++i]) || limit;
    else if (a.startsWith('--limit=')) limit = Number(a.slice('--limit='.length)) || limit;
    else if (a === '--help' || a === '-h') {
      console.log(
        `Usage: node scripts/community-agents-ingest.mjs [--out FILE] [--limit N] [--dry-run] [--force]`
      );
      process.exit(0);
    }
  }
  return { out, dryRun, force, limit: Math.min(Math.max(limit, 1), 100) };
}

function setGithubOutput(name, value) {
  const file = process.env.GITHUB_OUTPUT;
  if (!file) return;
  appendFileSync(file, `${name}=${value}\n`, 'utf8');
}

function authHeaders() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'aios-community-agents-ingest',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function githubJson(url) {
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`GitHub API ${res.status} ${url}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

function isStale(pushedAt) {
  if (!pushedAt) return true;
  return Date.now() - new Date(pushedAt).getTime() > STALE_MS;
}

function isSuspicious(repo) {
  const hay = `${repo.full_name}\n${repo.description || ''}\n${(repo.topics || []).join(' ')}`;
  if (SUSPICIOUS_RE.test(hay)) return true;
  if (repo.archived) return true;
  return false;
}

async function hasAgentManifest(fullName, defaultBranch) {
  const branch = defaultBranch || 'main';
  for (const rel of MANIFEST_CANDIDATES) {
    const url = `https://raw.githubusercontent.com/${fullName}/${branch}/${rel}`;
    try {
      const res = await fetch(url, {
        method: 'HEAD',
        headers: { 'User-Agent': 'aios-community-agents-ingest' },
      });
      if (res.ok) return { present: true, path: rel };
    } catch {
      // network blip — treat as unknown for this candidate
    }
  }
  return { present: false, path: null };
}

function toCatalogEntry(repo, manifest) {
  const stale = isStale(repo.pushed_at);
  const suspicious = isSuspicious(repo);
  return {
    fullName: repo.full_name,
    htmlUrl: repo.html_url,
    description: repo.description || '',
    stargazers: repo.stargazers_count ?? 0,
    forks: repo.forks_count ?? 0,
    pushedAt: repo.pushed_at,
    createdAt: repo.created_at,
    defaultBranch: repo.default_branch || 'main',
    topics: Array.isArray(repo.topics) ? repo.topics : [],
    archived: Boolean(repo.archived),
    manifestPath: manifest.path,
    flags: {
      stale,
      suspicious,
      missingManifest: !manifest.present,
    },
  };
}

function agentsFingerprint(agents) {
  const normalized = [...(agents || [])]
    .map((a) => ({
      fullName: a.fullName,
      htmlUrl: a.htmlUrl,
      description: a.description || '',
      stargazers: a.stargazers ?? 0,
      forks: a.forks ?? 0,
      pushedAt: a.pushedAt || null,
      createdAt: a.createdAt || null,
      defaultBranch: a.defaultBranch || 'main',
      topics: [...(a.topics || [])].sort(),
      archived: Boolean(a.archived),
      manifestPath: a.manifestPath ?? null,
      flags: {
        stale: Boolean(a.flags?.stale),
        suspicious: Boolean(a.flags?.suspicious),
        missingManifest: Boolean(a.flags?.missingManifest),
      },
    }))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
  return JSON.stringify(normalized);
}

function readExistingAgents(outPath) {
  if (!existsSync(outPath)) return [];
  try {
    const raw = JSON.parse(readFileSync(outPath, 'utf8'));
    return Array.isArray(raw.agents) ? raw.agents : [];
  } catch {
    return [];
  }
}

async function searchRepos(limit) {
  const url = new URL('https://api.github.com/search/repositories');
  url.searchParams.set('q', SEARCH_QUERY);
  url.searchParams.set('sort', 'updated');
  url.searchParams.set('order', 'desc');
  url.searchParams.set('per_page', String(limit));
  const data = await githubJson(url.toString());
  return Array.isArray(data.items) ? data.items : [];
}

async function main() {
  const { out, dryRun, force, limit } = parseArgs(process.argv);
  console.log(`Searching GitHub for ${SEARCH_QUERY} (limit=${limit})…`);
  const repos = await searchRepos(limit);
  console.log(`Found ${repos.length} repositories`);

  const agents = [];
  for (const repo of repos) {
    const manifest = await hasAgentManifest(repo.full_name, repo.default_branch);
    const entry = toCatalogEntry(repo, manifest);
    agents.push(entry);
    const flagBits = Object.entries(entry.flags)
      .filter(([, v]) => v)
      .map(([k]) => k);
    console.log(
      `  ${entry.fullName}${flagBits.length ? ` [${flagBits.join(', ')}]` : ''}${
        entry.manifestPath ? ` → ${entry.manifestPath}` : ''
      }`
    );
  }

  agents.sort((a, b) => a.fullName.localeCompare(b.fullName));

  const catalog = {
    generatedAt: new Date().toISOString(),
    source: `github-topic:${TOPIC}`,
    query: SEARCH_QUERY,
    agents,
  };

  if (dryRun) {
    console.log(JSON.stringify(catalog, null, 2));
    setGithubOutput('catalog_changed', 'false');
    return;
  }

  const previous = readExistingAgents(out);
  const changed = force || agentsFingerprint(previous) !== agentsFingerprint(agents);
  setGithubOutput('catalog_changed', changed ? 'true' : 'false');
  setGithubOutput('agent_count', String(agents.length));

  if (!changed) {
    console.log(`Unchanged (${agents.length} agents) — skipped write → ${out}`);
    return;
  }

  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${agents.length} entries → ${out}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
