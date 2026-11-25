import { getLatestUserText, getRecentToolNames } from '../../../access/routing';
import { MENTIONS_CALCULATION } from '../types';
import {
  CLOSING_INSTRUCTIONS,
  CORE_INSTRUCTIONS,
  FORM_GENERATION_TOPICS,
  type FormGenerationTopic,
  TOOL_INPUTS,
  TOPIC_INSTRUCTIONS,
} from './instructions';

/**
 * Picks the instruction sections and tools that one model call of the Form Generation Agent needs. Every call
 * carries its instructions and tool definitions, so sending only what the question is about keeps each call small.
 */

export const FORM_GENERATION_BASE_TOOL_IDS = [
  'formSchemaIndex',
  'formGenerationRun',
  'formSchemaValidate',
  'formSchemaPatch',
  'formExamplesTool',
  'schemaDefinitionTool',
];

// The endpoint rejects a request that sets parallel_tool_calls without tools, so a greeting keeps the index tool.
const GREETING_TOOL_IDS = ['formSchemaIndex'];

const TOPIC_TOOL_IDS: Record<FormGenerationTopic, string[]> = {
  components: ['rendererCatalogTool'],
  registers: ['dataRegisterListTool', 'dataRegisterGetTool', 'dataRegisterCreateTool', 'dataRegisterUpdateTool'],
  rules: [],
  computed: [],
  documents: ['fileDownloadTool', 'documentExtractTool'],
  layout: [],
};

export const FORM_GENERATION_TOOL_IDS = [
  ...FORM_GENERATION_BASE_TOOL_IDS,
  ...FORM_GENERATION_TOPICS.flatMap((topic) => TOPIC_TOOL_IDS[topic]),
];

const TOPIC_KEYWORDS: Record<FormGenerationTopic, RegExp> = {
  // Name, email and phone fields need only the common definitions listed in the core instructions.
  components:
    /\b(address(es)?|mailing|postal|sin|social insurance|bank(ing)?|dependents?|dependants?|children|common (field|component|definition)s?|components?|definitions?|file|upload|attachments?|renderers?)\b/i,
  registers: /\b(registers?|drop-?downs?|lookups?|list of values|reusable (list|values|options))\b/i,
  rules:
    /\b(show|hide|hidden|visible|visibility|only (when|if)|conditional(ly)?|depends? on|depending|enable|disable|rules?|when .+ is|if .+ (is|selects?|chooses?|answers?))\b/i,
  // In a chat request "add a total" asks for a calculation, and the computed section is small.
  computed: new RegExp(`\\btotals?\\b|${MENTIONS_CALCULATION.source}`, 'i'),
  documents:
    /\b(pdf|docx?|word document|documents?|attach(ed|ment|ments)?|uploaded|screenshots?|images?|scan(ned)?|requirements)\b/i,
  layout:
    /\b(pages?|multi-?page|steps?|stepper|sections?|categor(y|ies|ization)|task list|layouts?|wizard|horizontal|columns?|groups?|build|generate)\b/i,
};

const GREETING = /^\s*(hi|hello|hey|good (morning|afternoon|evening)|thanks|thank you|thx|ty|bye|goodbye)\b[\s!.,]*$/i;

const TOOL_TOPICS: Record<string, FormGenerationTopic> = Object.fromEntries(
  FORM_GENERATION_TOPICS.flatMap((topic) => TOPIC_TOOL_IDS[topic].map((toolId) => [toolId, topic])),
);

export interface FormGenerationSelectionInput {
  /** The user's latest message. */
  text: string;
  /** The user's message before it, which a short follow-up such as "make it optional" continues. */
  previousText?: string;
  /** Whether the latest message brought an attached document or image. */
  hasDocuments?: boolean;
  recentToolNames?: string[];
}

export interface FormGenerationSelection {
  /** A greeting or thanks: no form summary and only the index tool, which it is told not to call. */
  greeting: boolean;
  topics: FormGenerationTopic[];
}

export function selectFormGenerationTopics({
  text,
  previousText = '',
  hasDocuments = false,
  recentToolNames = [],
}: FormGenerationSelectionInput): FormGenerationSelection {
  if (GREETING.test(text) && !hasDocuments) {
    return { greeting: true, topics: [] };
  }

  const selected = new Set<FormGenerationTopic>();
  for (const topic of FORM_GENERATION_TOPICS) {
    if (TOPIC_KEYWORDS[topic].test(text) || TOPIC_KEYWORDS[topic].test(previousText)) {
      selected.add(topic);
    }
  }
  if (hasDocuments) {
    selected.add('documents');
  }
  for (const toolName of recentToolNames) {
    if (TOOL_TOPICS[toolName]) {
      selected.add(TOOL_TOPICS[toolName]);
    }
  }

  return { greeting: false, topics: FORM_GENERATION_TOPICS.filter((topic) => selected.has(topic)) };
}

export function getFormGenerationActiveTools({ greeting, topics }: FormGenerationSelection): string[] {
  return greeting
    ? GREETING_TOOL_IDS
    : [...FORM_GENERATION_BASE_TOOL_IDS, ...topics.flatMap((topic) => TOPIC_TOOL_IDS[topic])];
}

export interface FormGenerationInstructionContext {
  date: string;
  userName?: string;
  /** The saved form, as describeFormForModel renders it; left out of greetings. */
  currentForm?: string;
}

/**
 * The instructions for one model call: the core, the selected topic sections, the inputs of the tools it can use,
 * then the current form and the request context. The parts that change between calls go last, so providers can serve
 * the stable prefix from their prompt cache.
 */
export function buildFormGenerationInstructions(
  selection: FormGenerationSelection,
  { date, userName, currentForm }: FormGenerationInstructionContext,
): string {
  const tools = getFormGenerationActiveTools(selection);
  const sections = [
    CORE_INSTRUCTIONS,
    ...selection.topics.map((topic) => TOPIC_INSTRUCTIONS[topic]),
    selection.greeting
      ? 'This message is a greeting or thanks: reply in a sentence or two and ask what the user would like to change in the form. Do not call a tool.'
      : `## Tool required inputs (MANDATORY — check before every call)\n${tools.map((tool) => `- ${TOOL_INPUTS[tool]}`).join('\n')}`,
    CLOSING_INSTRUCTIONS,
    ...(currentForm ? [`## Current form\n${currentForm}`] : []),
  ];
  return `${sections.join('\n\n')}\n\nRequest context:\nCurrent date: ${date}\nUser: ${userName || 'User'}`;
}

/** Every section and tool; the fallback when a call is made without per-step selection. */
export const FORM_GENERATION_FULL_INSTRUCTIONS = [
  CORE_INSTRUCTIONS,
  ...FORM_GENERATION_TOPICS.map((topic) => TOPIC_INSTRUCTIONS[topic]),
  `## Tool required inputs (MANDATORY — check before every call)\n${FORM_GENERATION_TOOL_IDS.map((tool) => `- ${TOOL_INPUTS[tool]}`).join('\n')}`,
  CLOSING_INSTRUCTIONS,
].join('\n\n');

interface StoredMessage {
  role?: string;
}

/** The user's message before the latest one, or empty when there is none. */
export function getPreviousUserText(messages: readonly unknown[]): string {
  const list = messages as StoredMessage[];
  const latest = list.map((message) => message?.role).lastIndexOf('user');
  return latest > 0 ? getLatestUserText(list.slice(0, latest)) : '';
}

export { getLatestUserText, getRecentToolNames };
