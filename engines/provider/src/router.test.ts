import { describe, expect, it } from 'vitest';
import { routeModel } from './router.ts';

describe('provider routeModel re-export', () => {
  it('exposes the shared capability-class router', () => {
    const d = routeModel({ intentKind: 'explain.code' }, {});
    expect(d.capabilityClass).toBe('coding');
    expect(d.providerId).toBe('ollama');
  });
});
