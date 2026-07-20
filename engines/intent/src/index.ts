/**
 * Intent Engine — interpreta o pedido do usuário em Intent tipado.
 * Fase 1 + v2 (#63): classificação heurística (regras). LLM entra depois.
 */
import type { Intent, IntentKind } from '@aios/shared';

type Rule = {
  kind: IntentKind;
  /** Peso acumulado se a regra casar */
  weight: number;
  /** Testa o texto normalizado (lower + trim) */
  test: (normalized: string) => boolean;
  signal: string;
};

const RULES: Rule[] = [
  // --- implement.feature (antes de analyze genérico) ---
  {
    kind: 'implement.feature',
    weight: 0.5,
    signal: 'verb:criar|create|implement|add|adicionar',
    test: (t) =>
      /\b(cri[ae]|crie|create|implement[ae]?|implemen?te|adicion[ae]|adicione|add|build|gera|gerar|scaffold)\w*\b/.test(
        t
      ),
  },
  {
    kind: 'implement.feature',
    weight: 0.35,
    signal: 'object:endpoint|feature|component|api|hook|rota',
    test: (t) =>
      /\b(endpoint|feature|funcionalidade|component[e]?|api|hook|rota|route|handler|service|modulo|módulo)\b/.test(
        t
      ),
  },
  // --- fix.bug ---
  {
    kind: 'fix.bug',
    weight: 0.5,
    signal: 'verb:corrigir|fix|reparar|resolver',
    test: (t) => /\b(corrig[ie]|corrija|fix|repar[ae]|resolv[ae]|debug|patch)\w*\b/.test(t),
  },
  {
    kind: 'fix.bug',
    weight: 0.35,
    signal: 'object:bug|erro|error|falha|quebr',
    test: (t) =>
      /\b(bug|erro|error|exception|falha|quebr|broken|regression|ci\s*fail)\w*\b/.test(t),
  },
  // --- analyze.project ---
  {
    kind: 'analyze.project',
    weight: 0.45,
    signal: 'verb:analisar|analyze|avaliar|inspecionar',
    test: (t) => /\b(analis[ea]|analise|analyze|analys[ei]s|avali[ae]|inspecion)\w*\b/.test(t),
  },
  {
    kind: 'analyze.project',
    weight: 0.35,
    signal: 'object:projeto|project|repo|codebase',
    test: (t) => /\b(projeto|project|reposit[oó]rio|repo|codebase|arquitetura)\b/.test(t),
  },
  // --- explain.code ---
  {
    kind: 'explain.code',
    weight: 0.45,
    signal: 'verb:explicar|explain|como funciona',
    test: (t) => /\b(explic[ae]|explique|explain|descrev[ae]|como\s+funciona)\w*\b/.test(t),
  },
  {
    kind: 'explain.code',
    weight: 0.3,
    signal: 'object:c[oó]digo|fun[cç][aã]o|arquivo',
    test: (t) =>
      /\b(c[oó]digo|code|fun[cç][aã]o|function|classe|class|arquivo|file|m[oó]dulo)\b/.test(t),
  },
  // --- review.change ---
  {
    kind: 'review.change',
    weight: 0.45,
    signal: 'verb:revisar|review|revisao',
    test: (t) =>
      /\b(revis[ae]|revisão|revisao|review|code\s*review|critique|cr[ií]tic)\w*\b/.test(t),
  },
  {
    kind: 'review.change',
    weight: 0.3,
    signal: 'object:pr|diff|mudan[cç]a|change',
    test: (t) => /\b(pull\s*request|\bpr\b|diff|mudan[cç]a|change|patch|commit)\b/.test(t),
  },
];

function normalize(raw: string): string {
  return raw.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
}

function scoresFor(normalized: string): Map<IntentKind, { score: number; signals: string[] }> {
  const map = new Map<IntentKind, { score: number; signals: string[] }>();

  for (const rule of RULES) {
    if (!rule.test(normalized)) continue;
    const entry = map.get(rule.kind) ?? { score: 0, signals: [] };
    entry.score += rule.weight;
    entry.signals.push(rule.signal);
    map.set(rule.kind, entry);
  }

  return map;
}

/**
 * Resolve Intent a partir do texto livre do usuário.
 * Sem match confiável → kind `unknown` com confidence baixa.
 */
export function resolveIntent(raw: string): Intent {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {
      raw,
      kind: 'unknown',
      confidence: 0,
      signals: ['empty-input'],
    };
  }

  const normalized = normalize(trimmed);
  const scores = scoresFor(normalized);

  if (scores.size === 0) {
    return {
      raw: trimmed,
      kind: 'unknown',
      confidence: 0.1,
      signals: ['no-rule-match'],
    };
  }

  let best: IntentKind = 'unknown';
  let bestScore = 0;
  let signals: string[] = [];

  for (const [kind, entry] of scores) {
    if (entry.score > bestScore) {
      best = kind;
      bestScore = entry.score;
      signals = entry.signals;
    }
  }

  const confidence = Math.min(1, Math.round(bestScore * 100) / 100);

  if (confidence < 0.35) {
    return {
      raw: trimmed,
      kind: 'unknown',
      confidence,
      signals: [...signals, 'below-threshold'],
    };
  }

  return {
    raw: trimmed,
    kind: best,
    confidence,
    signals,
  };
}

export const INTENT_KINDS: IntentKind[] = [
  'analyze.project',
  'explain.code',
  'review.change',
  'implement.feature',
  'fix.bug',
  'unknown',
];
