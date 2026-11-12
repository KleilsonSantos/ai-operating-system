import { applyPolicies, type PolicyBundle } from '@aios/policy';
import { MCP_SAFE_WRITE_CONSENT_POLICY_ID } from '@aios/shared';

/**
 * Must-policy ids that gate MCP tools.
 *
 * `mcp-safe-write-consent` ships in the monorepo policy file, not in the built-in defaults. When no
 * policy file is found (`source: 'defaults'`) the consent rule would silently vanish and the
 * SAFE_WRITE consent tools would pass, so it is added back here (fail closed). A policy file that
 * is present but omits the rule stays an explicit operator choice.
 */
export function resolveMcpMustIds(bundle: Pick<PolicyBundle, 'rules' | 'source'>): string[] {
  const ids = applyPolicies(bundle.rules).mustIds;
  if (bundle.source === 'defaults' && !ids.includes(MCP_SAFE_WRITE_CONSENT_POLICY_ID)) {
    return [...ids, MCP_SAFE_WRITE_CONSENT_POLICY_ID];
  }
  return ids;
}
