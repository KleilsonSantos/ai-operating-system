import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const workspaceRoots = ['apps', 'engines', 'packages'];
const aggregatedCoverageDir = join(repoRoot, 'coverage');
const aggregatedLcovFile = join(aggregatedCoverageDir, 'lcov.info');
const coverageEnabled = process.argv.includes('--coverage');

function normalizeLcovPaths(lcovPath) {
  const packageDir = resolve(dirname(lcovPath), '..');
  const raw = readFileSync(lcovPath, 'utf8').trim();

  return raw
    .split('\n')
    .map((line) => {
      if (!line.startsWith('SF:')) {
        return line;
      }

      const sourcePath = line.slice(3);
      const repoRelativePath = relative(repoRoot, resolve(packageDir, sourcePath)).replaceAll(
        '\\',
        '/'
      );

      return `SF:${repoRelativePath}`;
    })
    .join('\n');
}

function runPnpm(args, cwd) {
  execFileSync('pnpm', args, {
    cwd,
    stdio: 'inherit',
    env: process.env,
  });
}

function listWorkspaceDirs(rootDir) {
  const absoluteRoot = join(repoRoot, rootDir);
  if (!existsSync(absoluteRoot)) {
    return [];
  }

  return readdirSync(absoluteRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(absoluteRoot, entry.name))
    .filter((dir) => existsSync(join(dir, 'package.json')));
}

function readPackageManifest(packageDir) {
  const manifestPath = join(packageDir, 'package.json');
  return JSON.parse(readFileSync(manifestPath, 'utf8'));
}

function buildCoverageArgs(packageDir) {
  const coverageDir = join(packageDir, 'coverage');
  rmSync(coverageDir, { recursive: true, force: true });

  return [
    'exec',
    'vitest',
    'run',
    '--coverage',
    '--coverage.reporter=lcov',
    '--coverage.reporter=text-summary',
  ];
}

function collectLcovFiles() {
  return workspaceRoots.flatMap((rootDir) =>
    listWorkspaceDirs(rootDir)
      .map((packageDir) => join(packageDir, 'coverage', 'lcov.info'))
      .filter((lcovPath) => existsSync(lcovPath))
  );
}

if (coverageEnabled) {
  rmSync(aggregatedCoverageDir, { recursive: true, force: true });
}

for (const rootDir of workspaceRoots) {
  for (const packageDir of listWorkspaceDirs(rootDir)) {
    const manifest = readPackageManifest(packageDir);
    const testScript = manifest.scripts?.test;

    if (!testScript) {
      continue;
    }

    const displayName = manifest.name ?? relative(repoRoot, packageDir);
    const isVitestPackage = testScript.includes('vitest run');

    console.log(`\n==> ${displayName}`);
    const args =
      coverageEnabled && isVitestPackage ? buildCoverageArgs(packageDir) : ['run', 'test'];

    runPnpm(args, packageDir);
  }
}

if (!coverageEnabled) {
  console.log('\nWorkspace tests completed without coverage.');
  process.exit(0);
}

const lcovFiles = collectLcovFiles();

if (lcovFiles.length === 0) {
  throw new Error('No lcov.info files were generated during coverage execution.');
}

mkdirSync(aggregatedCoverageDir, { recursive: true });

const mergedLcov = lcovFiles
  .map((lcovPath) => normalizeLcovPaths(lcovPath))
  .filter(Boolean)
  .join('\n');

writeFileSync(aggregatedLcovFile, `${mergedLcov}\n`);
console.log(
  `\nMerged ${lcovFiles.length} coverage reports into ${relative(repoRoot, aggregatedLcovFile)}.`
);
