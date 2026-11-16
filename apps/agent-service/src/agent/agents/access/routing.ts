import {
  ACCESS_CLIENT_TOOL_IDS,
  ACCESS_DISCOVERY_TOOL_IDS,
  ACCESS_GUIDE_TOOL_IDS,
  ACCESS_ROLE_TOOL_IDS,
  ACCESS_USER_TOOL_IDS,
} from './discovery/types';
import { loadAccessAgentMarkdown } from './loadMarkdown';

/**
 * Picks the live tools, and their prompt sections, that a turn of the Access Service agent needs. Every model call
 * carries its tool definitions and instructions, so sending only the relevant groups keeps each call small.
 */

export type AccessToolGroup = 'discovery' | 'clients' | 'people';

export const ACCESS_TOOL_GROUPS: Record<AccessToolGroup, string[]> = {
  discovery: ACCESS_DISCOVERY_TOOL_IDS,
  clients: ACCESS_CLIENT_TOOL_IDS,
  people: [...ACCESS_USER_TOOL_IDS, ...ACCESS_ROLE_TOOL_IDS],
};

const ALL_GROUPS = Object.keys(ACCESS_TOOL_GROUPS) as AccessToolGroup[];

const CORE_INSTRUCTIONS = loadAccessAgentMarkdown('supervisor/supervisor.md');
const GROUP_INSTRUCTIONS: Record<AccessToolGroup, string> = {
  discovery: loadAccessAgentMarkdown('supervisor/discoveryTools.md'),
  clients: loadAccessAgentMarkdown('supervisor/clientTools.md'),
  people: loadAccessAgentMarkdown('supervisor/peopleTools.md'),
};

// Topics and predefined questions of the tenant admin app (QUESTION_HIERARCHY), mapped to the tools they use.
const CONTEXT_GROUPS: Record<string, AccessToolGroup[]> = {
  'environment-realm': ['discovery'],
  'my-clients': ['clients'],
  'my-users': ['people'],
  clients: ['clients'],
  tokens: ['clients'],
  'identity-providers': [],
  infrastructure: [],
  overview: [],
};

const SUBTOPIC_GROUPS: Record<string, AccessToolGroup[]> = {
  'is-admin': ['people'],
  'cannot-sign-in': ['people'],
  'access-denied': ['people', 'clients'],
  'who-is-admin': ['people'],
  'app-setup': ['clients'],
  'service-account-roles': ['clients'],
};

const GROUP_KEYWORDS: Record<AccessToolGroup, RegExp> = {
  discovery: /\b(environments?|realms?|issuer|openid|well-known|endpoints?|inspect)\b/i,
  clients:
    /\b(clients?|apps?|applications?|portal|redirect(_uri)?|origins?|cors|sign[- ]?out|log ?out|audience|aud|scopes?|mappers?|service[- ]accounts?|secrets?|tokens?|jwt|claims?|40[13]|confidential|public|keycloak-js)\b/i,
  people:
    /\b(users?|someone|person|people|admins?|roles?|sign[- ]?in|log[- ]?in|login|locked|lockout|who|groups?|members?|access denied|permissions?|compare|find|account)\b|\b(can|could|does|do)\s+[\w.@'-]+\s+(use|access|see|open|do|have|get|reach)\b|\S+@\S+/i,
};

const SMALL_TALK = /^\s*(hi|hello|hey|thanks|thank you|thx|ok|okay|cool|great|bye)\b[\s!.,]*$/i;

// ADSP IDs such as urn:ads:platform:tenant-admin-app name a client or service, so they bring the client tools; words
// inside them ("admin", "form") say nothing about what is asked, so keywords are matched on the rest of the question.
const ADSP_ID = /\burn:ads:\S+/gi;

/** Tool calls in the recent history: a follow-up question usually continues with the same tools. */
const RECENT_MESSAGES = 6;

export interface AccessAgentContext {
  context?: unknown;
  subtopic?: unknown;
}

export interface AccessToolSelectionInput {
  text: string;
  agentContext?: AccessAgentContext;
  recentToolNames: string[];
}

export function selectAccessToolGroups({
  text,
  agentContext,
  recentToolNames,
}: AccessToolSelectionInput): AccessToolGroup[] {
  const ordered = (groups: Set<AccessToolGroup>) => ALL_GROUPS.filter((group) => groups.has(group));
  const fromQuestion = new Set<AccessToolGroup>();

  const subtopic = typeof agentContext?.subtopic === 'string' ? SUBTOPIC_GROUPS[agentContext.subtopic] : undefined;
  const context = typeof agentContext?.context === 'string' ? CONTEXT_GROUPS[agentContext.context] : undefined;
  const hint = subtopic ?? context;
  for (const group of hint ?? []) {
    fromQuestion.add(group);
  }

  const words = text.replace(ADSP_ID, ' ');
  if (words !== text) {
    fromQuestion.add('clients');
  }
  for (const group of ALL_GROUPS) {
    if (GROUP_KEYWORDS[group].test(words)) {
      fromQuestion.add(group);
    }
  }

  // A hinted topic with no live tools (such as infrastructure) needs only the guide.
  if (fromQuestion.size > 0 || hint) {
    return ordered(fromQuestion);
  }
  if (SMALL_TALK.test(text)) {
    return [];
  }

  // A follow-up that names nothing itself, such as "and for jsmith?", continues with the tools just used.
  const fromRecent = new Set<AccessToolGroup>();
  for (const toolName of recentToolNames) {
    const group = ALL_GROUPS.find((candidate) => ACCESS_TOOL_GROUPS[candidate].includes(toolName));
    if (group) {
      fromRecent.add(group);
    }
  }

  // Anything else unrecognised gets every tool rather than risk a missing one.
  return fromRecent.size > 0 ? ordered(fromRecent) : ALL_GROUPS;
}

export function getAccessActiveTools(groups: AccessToolGroup[]): string[] {
  return [...ACCESS_GUIDE_TOOL_IDS, ...groups.flatMap((group) => ACCESS_TOOL_GROUPS[group])];
}

export interface AccessInstructionContext {
  date: string;
  userName?: string;
}

/**
 * The instructions for one model call: the core rules, then the sections for the active tool groups. The request
 * context goes last and has no time of day, so the prefix stays identical across calls and providers can cache it.
 */
export function buildAccessInstructions(
  groups: AccessToolGroup[],
  { date, userName }: AccessInstructionContext,
): string {
  const sections = [
    CORE_INSTRUCTIONS,
    ...ALL_GROUPS.filter((group) => groups.includes(group)).map((group) => GROUP_INSTRUCTIONS[group]),
  ];
  return `${sections.join('\n\n')}\n\nRequest context:\nCurrent date: ${date}\nUser: ${userName || 'User'}`;
}

/** Every instruction section; the fallback when a call is made without per-step selection. */
export const ACCESS_FULL_INSTRUCTIONS = [
  CORE_INSTRUCTIONS,
  ...ALL_GROUPS.map((group) => GROUP_INSTRUCTIONS[group]),
].join('\n\n');

interface MessagePart {
  type?: string;
  text?: string;
  toolInvocation?: { toolName?: string };
  toolName?: string;
}

interface StoredMessage {
  role?: string;
  content?: string | { parts?: MessagePart[]; content?: string };
}

function partsOf(message: StoredMessage): MessagePart[] {
  return typeof message.content === 'object' && Array.isArray(message.content?.parts) ? message.content.parts : [];
}

export function getLatestUserText(messages: readonly unknown[]): string {
  const latest = [...(messages as StoredMessage[])].reverse().find((message) => message?.role === 'user');
  if (!latest) {
    return '';
  }
  if (typeof latest.content === 'string') {
    return latest.content;
  }

  const text = partsOf(latest)
    .filter((part) => part.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text)
    .join('\n');
  return text || (typeof latest.content?.content === 'string' ? latest.content.content : '');
}

export function getRecentToolNames(messages: readonly unknown[], count = RECENT_MESSAGES): string[] {
  return (messages as StoredMessage[]).slice(-count).flatMap((message) =>
    partsOf(message)
      .map((part) => part.toolInvocation?.toolName ?? (part.type?.startsWith('tool-') ? part.toolName : undefined))
      .filter((name): name is string => typeof name === 'string'),
  );
}

/** Tools whose card fully answers a request to list or show something, so no written reply needs a model call. */
const DISPLAY_ONLY_TOOLS = new Set([
  'listAccessEnvironments',
  'listAccessRealms',
  'getAccessRealmInfo',
  'listAccessServiceRoles',
  'listAccessRoleMembers',
]);

interface StepToolCall {
  toolName?: string;
  payload?: { toolName?: string };
}

/** Stops the turn after a step that called only display-only tools. */
export function calledOnlyDisplayTools({ steps }: { steps: Array<{ toolCalls?: unknown[] }> }): boolean {
  const calls = (steps[steps.length - 1]?.toolCalls ?? []) as StepToolCall[];
  const names = calls.map((call) => call?.toolName ?? call?.payload?.toolName);
  return names.length > 0 && names.every((name) => typeof name === 'string' && DISPLAY_ONLY_TOOLS.has(name));
}
