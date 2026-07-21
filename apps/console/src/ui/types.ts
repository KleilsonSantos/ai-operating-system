export type AttentionSeverity = 'error' | 'warn' | 'info';

export type GovernanceStatus = {
  generatedAt: string;
  contractVersion: string;
  homePath: string;
  workspaces: Array<{
    id: string;
    name?: string;
    repoPath: string;
    ok: boolean;
    signals: string[];
  }>;
  policies: {
    source: string;
    path?: string;
    count: number;
    mustIds: string[];
  };
  provider: {
    provider: string;
    ok: boolean;
    baseUrl: string;
    models?: string[];
    error?: string;
    latencyMs?: number;
  };
  memory: { workspaceIds: string[] };
  exposed: {
    mcpTools: string[];
    providers: string[];
  };
  attention: Array<{
    id: string;
    severity: AttentionSeverity;
    title: string;
    detail: string;
  }>;
  metrics: {
    available: boolean;
    note: string;
    eventCount?: number;
    path?: string;
    providerChat?: {
      count: number;
      errorCount: number;
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  };
};
