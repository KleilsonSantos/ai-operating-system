/** PKB Markdown frontmatter helpers (heuristic parse, no YAML lib). */

export type PkbAssetMeta = {
  id?: string;
  title?: string;
  domain?: string;
  purpose?: string;
  tags: string[];
  status?: string;
  language?: string;
};

/** Split Markdown frontmatter (`---` … `---`) from body. */
export function splitMarkdownFrontmatter(raw: string): {
  frontmatter: string;
  body: string;
} {
  const trimmed = raw.replace(/^\uFEFF/, '');
  if (!trimmed.startsWith('---')) {
    return { frontmatter: '', body: trimmed };
  }
  const end = trimmed.indexOf('\n---', 3);
  if (end === -1) {
    return { frontmatter: '', body: trimmed };
  }
  const frontmatter = trimmed.slice(3, end).replace(/^\r?\n/, '');
  const body = trimmed.slice(end + 4).replace(/^\r?\n/, '');
  return { frontmatter, body };
}

function scalarField(fm: string, key: string): string | undefined {
  const re = new RegExp(`^${key}:\\s*(.+?)\\s*$`, 'im');
  const m = re.exec(fm);
  if (!m?.[1]) return undefined;
  return m[1].replace(/^['"]|['"]$/g, '').trim();
}

function parseTagList(fm: string): string[] {
  const tags: string[] = [];
  const bracket = /^tags:\s*\[([^\]]*)\]\s*$/im.exec(fm);
  if (bracket?.[1]) {
    for (const part of bracket[1].split(',')) {
      const t = part.trim().replace(/^['"]|['"]$/g, '');
      if (t) tags.push(t);
    }
    return tags;
  }
  const lines = fm.split(/\r?\n/);
  let inTags = false;
  for (const line of lines) {
    if (/^tags:\s*$/i.test(line)) {
      inTags = true;
      continue;
    }
    if (inTags) {
      const item = /^\s+-\s+(.+?)\s*$/.exec(line);
      if (item?.[1]) {
        tags.push(item[1].replace(/^['"]|['"]$/g, '').trim());
        continue;
      }
      if (/^\S/.test(line)) break;
    }
  }
  return tags;
}

export function parsePkbFrontmatter(raw: string): {
  meta: PkbAssetMeta;
  body: string;
} {
  const { frontmatter, body } = splitMarkdownFrontmatter(raw);
  const meta: PkbAssetMeta = {
    id: scalarField(frontmatter, 'id'),
    title: scalarField(frontmatter, 'title'),
    domain: scalarField(frontmatter, 'domain'),
    purpose: scalarField(frontmatter, 'purpose'),
    tags: parseTagList(frontmatter),
    status: scalarField(frontmatter, 'status'),
    language: scalarField(frontmatter, 'language'),
  };
  return { meta, body };
}
