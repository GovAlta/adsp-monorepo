import { Message } from '@core-services/app-common';

interface Thread {
  id: string;
  agent: string;
}

export interface ToolDescription {
  id: string;
  description: string;
}

export type ApiToolMethods = 'GET' | 'POST' | 'PUT' | 'PATCH';
export interface ApiToolConfiguration extends ToolDescription {
  type: 'api';
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  method: ApiToolMethods;
  api: string;
  path: string;
  userContext?: boolean;
}

type ToolConfiguration = string | ApiToolConfiguration;

export interface McpServerConfiguration {
  url: string;
  headers?: Record<string, string>;
  capabilities?: string[];
}

export interface McpConfiguration {
  servers: McpServerConfiguration[];
}

export interface AgentConfiguration {
  core?: boolean;
  id: string;
  name: string;
  description?: string;
  instructions: string;
  workspace?: { enabled: boolean };
  outputSchema?: Record<string, unknown> | null;
  userRoles?: string[];
  agents?: string[];
  tools?: ToolConfiguration[];
  mcp?: McpConfiguration;
}

export interface AgentState {
  connected: boolean;
  threads: Record<string, Thread>;
  threadMessages: Record<string, string[]>;
  messages: Record<string, Message>;
  agents: Record<string, AgentConfiguration>;
  availableTools: ToolDescription[];
  editor: {
    agent: AgentConfiguration;
    threadId: string;
    hasChanges: boolean;
    stalePreview: boolean;
  };
  busy: {
    connecting: boolean;
    disconnecting: boolean;
    loading: boolean;
    saving: boolean;
  };
}
