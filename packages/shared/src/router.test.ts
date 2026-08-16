import { describe, expect, it } from 'vitest';
import { inferRouteRisk, resolveCapabilityClass, routeModel } from './index.ts';

describe('resolveCapabilityClass', () => {
  it('maps analyze/review to reasoning', () => {
    expect(resolveCapabilityClass({ intentKind: 'analyze.project' })).toBe('reasoning');
    expect(resolveCapabilityClass({ intentKind: 'review.change' })).toBe('reasoning');
  });

  it('maps code intents to coding', () => {
    expect(resolveCapabilityClass({ intentKind: 'explain.code' })).toBe('coding');
    expect(resolveCapabilityClass({ intentKind: 'implement.feature' })).toBe('coding');
    expect(resolveCapabilityClass({ intentKind: 'fix.bug' })).toBe('coding');
  });

  it('maps unknown to fast', () => {
    expect(resolveCapabilityClass({ intentKind: 'unknown' })).toBe('fast');
  });

  it('costBudget=low forces fast', () => {
    expect(resolveCapabilityClass({ intentKind: 'analyze.project', costBudget: 'low' })).toBe(
      'fast'
    );
  });

  it('high risk selects arbitration', () => {
    expect(resolveCapabilityClass({ intentKind: 'analyze.project', risk: 'high' })).toBe(
      'arbitration'
    );
    expect(resolveCapabilityClass({ intentKind: 'review.change', privilege: 'PRIVILEGED' })).toBe(
      'arbitration'
    );
  });

  it('explicit class wins over intent', () => {
    expect(resolveCapabilityClass({ intentKind: 'unknown', capabilityClass: 'reasoning' })).toBe(
      'reasoning'
    );
  });
});

describe('inferRouteRisk', () => {
  it('treats privileged as high', () => {
    expect(inferRouteRisk({ intentKind: 'analyze.project', privilege: 'PRIVILEGED' })).toBe('high');
  });

  it('treats implement/fix/review as medium', () => {
    expect(inferRouteRisk({ intentKind: 'implement.feature' })).toBe('medium');
    expect(inferRouteRisk({ intentKind: 'fix.bug' })).toBe('medium');
    expect(inferRouteRisk({ intentKind: 'review.change' })).toBe('medium');
  });

  it('defaults analyze/unknown to low', () => {
    expect(inferRouteRisk({ intentKind: 'analyze.project' })).toBe('low');
    expect(inferRouteRisk({ intentKind: 'unknown' })).toBe('low');
  });
});

describe('routeModel', () => {
  it('defaults every class to local ollama', () => {
    const d = routeModel({ intentKind: 'analyze.project' }, {});
    expect(d.providerId).toBe('ollama');
    expect(d.modelId).toBe('llama3.2');
    expect(d.capabilityClass).toBe('reasoning');
    expect(d.reason).toContain('class:reasoning');
  });

  it('binds class via env without putting a vendor in the request', () => {
    const d = routeModel(
      { intentKind: 'explain.code' },
      {
        AIOS_ROUTE_CODING_PROVIDER: 'openai',
        AIOS_ROUTE_CODING_MODEL: 'gpt-4o-mini',
      }
    );
    expect(d.capabilityClass).toBe('coding');
    expect(d.providerId).toBe('openai');
    expect(d.modelId).toBe('gpt-4o-mini');
    expect(d.reason).toContain('env-provider');
    expect(d.reason).toContain('env-model');
  });

  it('ignores unknown provider env and stays on ollama', () => {
    const d = routeModel({ intentKind: 'unknown' }, { AIOS_ROUTE_FAST_PROVIDER: 'cohere' });
    expect(d.providerId).toBe('ollama');
    expect(d.reason).toContain('env-provider-invalid');
  });

  it('falls back to AIOS_OLLAMA_MODEL when class stays on ollama', () => {
    const d = routeModel({ intentKind: 'unknown' }, { AIOS_OLLAMA_MODEL: 'qwen2.5' });
    expect(d.providerId).toBe('ollama');
    expect(d.modelId).toBe('qwen2.5');
  });
});
