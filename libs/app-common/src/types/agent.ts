export interface ToolCall {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  error?: unknown;
  result?: unknown;
}

export type Message = UserMessage | AgentMessage;

const USER_FROM = 'user';
export interface UserMessage {
  id: string;
  threadId: string;
  content: string;
  from: typeof USER_FROM;
}

export interface Reasoning {
  id: string;
  streaming: boolean;
  content: string;
}

const AGENT_FROM = 'agent';
export interface AgentMessage {
  id: string;
  threadId: string;
  content: string;
  from: typeof AGENT_FROM;
  streaming: boolean;
  toolCalls: ToolCall[];
  reasoning?: Reasoning;
}
