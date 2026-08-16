/**
 * Re-export — implementation lives in `@aios/shared` (pure policy, no HTTP).
 * Public engine surface stays `@aios/provider` (ADR-0025).
 */
export { inferRouteRisk, resolveCapabilityClass, routeModel } from '@aios/shared';
