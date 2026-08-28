/**
 * Re-export — implementation lives in `@aios/shared` (pure policy, no HTTP).
 * Public engine surface stays `@aios/provider` (ADR-0025 / ADR-0031).
 */
export {
  buildTaskProfile,
  inferRouteRisk,
  inferTaskComplexity,
  inferTaskPrivacy,
  resolveCapabilityClass,
  routeModel,
} from '@aios/shared';
