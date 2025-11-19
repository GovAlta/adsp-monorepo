interface Message {
  id: string;
  threadId: string;
  content: string;
  streaming?: boolean;
  from: 'user' | 'agent';
}

interface Thread {
  id: string;
  agent: string;
}

export interface ToolDescription {
  id: string;
  description: string;
}

export interface ApiToolConfiguration extends ToolDescription {
  type: 'api';
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  method: string;
  api: string;
  path: string;
  userContext?: boolean;
}

type ToolConfiguration = string | ApiToolConfiguration;
export interface AgentConfiguration {
  core?: boolean;
  id: string;
  name: string;
  description?: string;
  instructions: string;
  userRoles?: string[];
  agents?: string[];
  tools?: ToolConfiguration[];
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
