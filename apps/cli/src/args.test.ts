import { describe, expect, it } from 'vitest';
import { PIPELINE_CONTRACT_VERSION } from '@aios/pipeline';
import { formatHelp, parseArgs } from './args.ts';

describe('parseArgs', () => {
  it('treats --help as help without pipeline input', () => {
    const args = parseArgs(['--help']);
    expect(args.help).toBe(true);
    expect(args.error).toBeUndefined();
    expect(args.input).toBe('');
  });

  it('treats -h as help', () => {
    expect(parseArgs(['-h']).help).toBe(true);
  });

  it('rejects unknown flags with an error (no default analyze input)', () => {
    const args = parseArgs(['--not-a-real-flag']);
    expect(args.error).toMatch(/Unknown option: --not-a-real-flag/);
    expect(args.help).toBe(false);
    expect(args.input).toBe('');
  });

  it('rejects unknown short flags', () => {
    const args = parseArgs(['-x']);
    expect(args.error).toMatch(/Unknown option: -x/);
  });

  it('keeps positional input for the pipeline', () => {
    const args = parseArgs(['analyze', 'the', 'project']);
    expect(args.help).toBe(false);
    expect(args.error).toBeUndefined();
    expect(args.input).toBe('analyze the project');
  });

  it('ignores a lone -- so pnpm-injected separators still allow --help', () => {
    const args = parseArgs(['--', '--help']);
    expect(args.help).toBe(true);
    expect(args.error).toBeUndefined();
  });

  it('ignores lone -- before unknown flags', () => {
    const args = parseArgs(['--', '--not-a-real-flag']);
    expect(args.error).toMatch(/Unknown option: --not-a-real-flag/);
  });

  it('ignores lone -- before positional input', () => {
    const args = parseArgs(['--', 'analyze', 'the', 'project']);
    expect(args.input).toBe('analyze the project');
    expect(args.error).toBeUndefined();
  });

  it('parses --contract-version without exiting', () => {
    const args = parseArgs(['--contract-version']);
    expect(args.printContractVersion).toBe(true);
    expect(args.help).toBe(false);
  });

  it('parses known flags such as --repo', () => {
    const args = parseArgs(['--repo', '/tmp/repo', 'hello']);
    expect(args.repoPath).toBe('/tmp/repo');
    expect(args.input).toBe('hello');
    expect(args.error).toBeUndefined();
  });

  it('parses --visibility and --run-id', () => {
    const args = parseArgs(['--visibility', '--scope', 'engines/policy', '--run-id', 'run-1']);
    expect(args.visibility).toBe(true);
    expect(args.scope).toBe('engines/policy');
    expect(args.visibilityRunId).toBe('run-1');
  });

  it('parses --export-obsidian and --out', () => {
    const args = parseArgs([
      '--export-obsidian',
      '--out',
      '/tmp/vault',
      '--scope',
      'engines/visibility',
      '--no-full-graph',
      '--run-id',
      'r1',
    ]);
    expect(args.exportObsidian).toBe(true);
    expect(args.exportOut).toBe('/tmp/vault');
    expect(args.exportFullGraph).toBe(false);
    expect(args.scope).toBe('engines/visibility');
    expect(args.visibilityRunId).toBe('r1');
  });
});

describe('formatHelp', () => {
  it('mentions help and contract version', () => {
    const text = formatHelp();
    expect(text).toContain('--help');
    expect(text).toContain(PIPELINE_CONTRACT_VERSION);
    expect(text).not.toMatch(/^\s*\{/);
  });
});
