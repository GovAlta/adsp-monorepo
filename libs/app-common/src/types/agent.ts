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
  content: UserContent;
  from: typeof USER_FROM;
}

export interface TextPart {
  type: 'text';
  text: string;
}
export interface ImagePart {
  type: 'image';
  image: string;
}
export interface FilePart {
  type: 'file';
  data: string;
}
export type UserContent = Array<TextPart | ImagePart | FilePart>;

// Resolved types with metadata from file service
export interface ResolvedImagePart extends ImagePart {
  filename?: string;
  mediaType?: string;
}
export interface ResolvedFilePart extends FilePart {
  filename?: string;
  mediaType?: string;
}
export type ResolvedUserContent = Array<TextPart | ResolvedImagePart | ResolvedFilePart>;


export interface Attachment {
  urn: string;
  filename: string;
  type: 'file' | 'image';
  thumbnailUrl?: string;
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
