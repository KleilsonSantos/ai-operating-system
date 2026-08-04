#!/usr/bin/env node
/**
 * CLI entry for `npm create @aios/agent` / `pnpm --filter @aios/create-agent dev -- --name …`
 */
import { scaffoldAgent } from './scaffold.ts';

function printHelp(): void {
  console.log(`Usage: create-agent --name <agent-name> [--dir <path>]

Scaffold a new AIOS agent package (Phase 5b / ADR-0023).

Examples:
  pnpm --filter @aios/create-agent dev -- --name my-security
  npm create @aios/agent@latest -- --name my-security

Options:
  --name, -n   Agent name (kebab-case or @scope/name)
  --dir, -d    Target directory (default: ./agent-<name>)
  --help, -h   Show this help
`);
}

function parseArgs(argv: string[]): { name?: string; dir?: string; help: boolean } {
  let name: string | undefined;
  let dir: string | undefined;
  let help = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === '--help' || arg === '-h') {
      help = true;
      continue;
    }
    if (arg === '--name' || arg === '-n') {
      name = argv[++i];
      continue;
    }
    if (arg === '--dir' || arg === '-d') {
      dir = argv[++i];
      continue;
    }
    if (arg.startsWith('--name=')) {
      name = arg.slice('--name='.length);
      continue;
    }
    if (arg.startsWith('--dir=')) {
      dir = arg.slice('--dir='.length);
      continue;
    }
    if (!arg.startsWith('-') && !name) {
      name = arg;
    }
  }

  return { name, dir, help };
}

async function main(): Promise<void> {
  const { name, dir, help } = parseArgs(process.argv.slice(2));
  if (help || !name) {
    printHelp();
    process.exit(help ? 0 : 1);
  }

  const result = await scaffoldAgent({ name, targetDir: dir });
  console.log(`Created ${result.packageName} at ${result.targetDir}`);
  console.log(`Manifest: ${result.manifestName}@0.1.0 (valid=${result.validation.valid})`);
  console.log(`Files: ${result.files.join(', ')}`);
  console.log(`
Next:
  cd ${result.targetDir}
  pnpm install   # or npm install
  pnpm test
`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
