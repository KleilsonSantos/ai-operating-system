import { describe, expect, it } from 'vitest';
import { createPipelineId } from './index.ts';

describe('@aios/core', () => {
  it('createPipelineId returns a stable-prefixed id', () => {
    const id = createPipelineId();
    expect(id.startsWith('pipeline_')).toBe(true);
    expect(id.length).toBeGreaterThan('pipeline_'.length);
  });
});
