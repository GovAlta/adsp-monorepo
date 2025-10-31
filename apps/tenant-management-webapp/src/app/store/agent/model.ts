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

export interface AgentConfiguration {
  core?: boolean;
  id: string;
  name: string;
  instructions: string;
  userRoles: string[];
}

export interface AgentState {
  connected: boolean;
  threads: Record<string, Thread>;
  threadMessages: Record<string, string[]>;
  messages: Record<string, Message>;
  agents: Record<string, AgentConfiguration>;
  editor: {
    agent: AgentConfiguration;
    threadId: string;
    hasChanges: boolean;
  };
  busy: {
    connecting: boolean;
    disconnecting: boolean;
    loading: boolean;
    saving: boolean;
  };
}
