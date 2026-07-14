/**
 * ai-core — runtime compartilhado (eventos / pipeline stub).
 * Ver docs/architecture/overview.md
 */
import type { Intent } from '@aios/shared'

export type PipelineEvent =
  | { type: 'intent.resolved'; intent: Intent }
  | { type: 'pipeline.completed'; summary: string }

export function createPipelineId(): string {
  return `pipeline_${Date.now().toString(36)}`
}
