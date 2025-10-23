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

export interface AgentState {
  connected: boolean;
  threads: Record<string, Thread>;
  threadMessages: Record<string, string[]>;
  messages: Record<string, Message>;
  busy: {
    connecting: boolean;
    disconnecting: boolean;
  };
}
