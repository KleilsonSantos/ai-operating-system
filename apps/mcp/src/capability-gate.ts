import { authorizeMcpTool, deniedMcpPayload, type EnvMap } from '@aios/shared';

export type McpTextResult = {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
};

export function denyMcpTool(
  tool: string,
  env?: EnvMap,
  mustIds?: readonly string[]
): McpTextResult {
  const decision = authorizeMcpTool(tool, { env, mustIds });
  return {
    content: [{ type: 'text', text: JSON.stringify(deniedMcpPayload(decision)) }],
    isError: true,
  };
}

export function isMcpToolAllowed(tool: string, env?: EnvMap, mustIds?: readonly string[]): boolean {
  return authorizeMcpTool(tool, { env, mustIds }).allowed;
}
