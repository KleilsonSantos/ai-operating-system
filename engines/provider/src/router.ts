/**
 * Re-export — implementation lives in `@aios/shared` (pure policy, no HTTP).
 * Public engine surface stays `@aios/provider` (ADR-0025 / ADR-0031 / ADR-0035).
 */
export {
  buildTaskProfile,
  inferRouteRisk,
  inferTaskComplexity,
  inferTaskPrivacy,
  parseRouteFallbackChain,
  resolveCapabilityClass,
  routeModel,
} from '@aios/shared';
