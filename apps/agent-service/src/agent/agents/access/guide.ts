import { loadAccessAgentMarkdown } from './loadMarkdown';

interface GuideSource {
  file: string;
  /** Full heading lines; each section runs until the next heading of the same or a higher level. */
  headings: string[];
}

interface GuideTopicDefinition {
  title: string;
  sources: GuideSource[];
}

const BASE = 'baseKnowledge.md';
const CLIENTS = 'clientAgent/clients.md';
const CLIENT_CHECKS = 'clientAgent/clientAgent.md';
const TOKENS = 'tokenRoleAgent/tokenRoleAgent.md';
const IDENTITY_PROVIDERS = 'identityProviderAgent/identityProviderAgent.md';
const ARCHITECTURE = 'architectAgent/architectAgent.md';

/**
 * Documented Access Service guidance, served section by section so a question loads only what it needs. The same
 * sections answer the predefined questions in the tenant admin app without a model call.
 */
const GUIDE_TOPICS = {
  'realm-model': {
    title: 'How the Access Service and realms fit together',
    sources: [{ file: BASE, headings: ['## Service and realm model'] }],
  },
  environments: {
    title: 'Access Service environments',
    sources: [{ file: BASE, headings: ['## Documented environment references'] }],
  },
  responsibility: {
    title: 'Who is responsible for each part of the Access Service',
    sources: [{ file: BASE, headings: ['## Responsibility and contact'] }],
  },
  'add-tenant-admin': {
    title: 'How to add a tenant admin',
    sources: [{ file: BASE, headings: ['## How to add a tenant admin'] }],
  },
  glossary: {
    title: 'Plain-language glossary',
    sources: [{ file: BASE, headings: ['## Plain-language glossary'] }],
  },
  'public-client': {
    title: 'Set up a browser app client (client authentication off)',
    sources: [
      {
        file: CLIENTS,
        headings: [
          '## Public client example: Tenant Admin Webapp',
          '## Create a similar public client in Keycloak v24',
        ],
      },
    ],
  },
  'confidential-client': {
    title: 'Set up a server-to-server client (client authentication on)',
    sources: [
      {
        file: CLIENTS,
        headings: [
          '## Confidential client example: Server-to-server integration',
          '## Create a confidential client in Keycloak v24',
        ],
      },
    ],
  },
  'public-vs-confidential': {
    title: 'Public versus confidential clients',
    sources: [{ file: CLIENTS, headings: ['## Public versus confidential clients'] }],
  },
  'client-troubleshooting': {
    title: 'Troubleshooting a client',
    sources: [
      {
        file: CLIENT_CHECKS,
        headings: [
          '## Responding to a vague "my client configuration seems wrong" report',
          '## Troubleshooting approach',
          '## Common client issues and checks',
          '## Never do this',
        ],
      },
    ],
  },
  'token-expiry': {
    title: 'Token expiry and refresh',
    sources: [{ file: TOKENS, headings: ['## Token expiry: Keycloak defaults usually already solve it'] }],
  },
  'token-claims': {
    title: 'Access token claims',
    sources: [
      {
        file: TOKENS,
        headings: [
          '## Default Keycloak access token claims',
          '## Default `profile`/`email` scope claims (interactive logins only)',
        ],
      },
    ],
  },
  'token-audience': {
    title: 'Token audience and 401 errors',
    sources: [
      {
        file: CLIENT_CHECKS,
        headings: ['### Token missing required audience', '### API call returns 401 Unauthorized'],
      },
    ],
  },
  'idp-claim-to-token': {
    title: 'Add an identity provider claim to the access token',
    sources: [
      { file: TOKENS, headings: ['## Adding an IdP-sourced user attribute to the token (client configuration)'] },
    ],
  },
  'goa-ad': {
    title: 'goa-ad and UIAM identity providers',
    sources: [{ file: IDENTITY_PROVIDERS, headings: ['## goa-ad and UIAM identity providers'] }],
  },
  'uiam-integration': {
    title: 'Integrate a UIAM identity provider',
    sources: [{ file: IDENTITY_PROVIDERS, headings: ['## UIAM IdP integration'] }],
  },
  'saml-certificates': {
    title: 'SAML certificate requirements and renewal',
    sources: [{ file: IDENTITY_PROVIDERS, headings: ['### SAML certificate requirements and renewal'] }],
  },
  architecture: {
    title: 'Access Service infrastructure (Production)',
    sources: [{ file: ARCHITECTURE, headings: ['## Infrastructure overview (Production)'] }],
  },
  operations: {
    title: 'Operational responsibilities',
    sources: [{ file: ARCHITECTURE, headings: ['## Operational responsibilities'] }],
  },
  'disaster-recovery': {
    title: 'Access Service disaster recovery',
    sources: [
      {
        file: ARCHITECTURE,
        headings: ['## Recovery procedure', '## Failure scenarios and mitigation', '## Never do this'],
      },
    ],
  },
} satisfies Record<string, GuideTopicDefinition>;

export type AccessGuideTopicId = keyof typeof GUIDE_TOPICS;

export const ACCESS_GUIDE_TOPIC_IDS = Object.keys(GUIDE_TOPICS) as [AccessGuideTopicId, ...AccessGuideTopicId[]];

export interface AccessGuideSection {
  topic: AccessGuideTopicId;
  title: string;
  markdown: string;
}

function headingLevel(line: string): number {
  const match = /^(#{1,6})\s/.exec(line);
  return match ? match[1].length : 0;
}

/**
 * Returns a heading's section: the heading line and everything up to the next heading of the same or a higher level.
 */
export function extractMarkdownSection(markdown: string, heading: string): string {
  const lines = markdown.split('\n');
  const start = lines.findIndex((line) => line.trim() === heading);
  if (start < 0) {
    throw new Error(`Access Service guide heading not found: ${heading}`);
  }

  const level = headingLevel(heading);
  const end = lines.findIndex((line, index) => {
    const lineLevel = headingLevel(line);
    return index > start && lineLevel > 0 && lineLevel <= level;
  });

  return lines
    .slice(start, end < 0 ? undefined : end)
    .join('\n')
    .trim();
}

function loadTopic(topic: AccessGuideTopicId): AccessGuideSection {
  const { title, sources } = GUIDE_TOPICS[topic];
  const sections = sources.flatMap(({ file, headings }) => {
    const markdown = loadAccessAgentMarkdown(file);
    return headings.map((heading) => extractMarkdownSection(markdown, heading));
  });

  return { topic, title, markdown: sections.join('\n\n') };
}

// Loaded once at start-up so a missing heading fails fast rather than on a user's question.
const GUIDE = Object.fromEntries(ACCESS_GUIDE_TOPIC_IDS.map((topic) => [topic, loadTopic(topic)])) as Record<
  AccessGuideTopicId,
  AccessGuideSection
>;

export function isAccessGuideTopic(value: unknown): value is AccessGuideTopicId {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(GUIDE_TOPICS, value);
}

export function getAccessGuideSection(topic: AccessGuideTopicId): AccessGuideSection {
  return GUIDE[topic];
}

/** One line per topic, for the tool description. */
export function describeAccessGuideTopics(): string {
  return ACCESS_GUIDE_TOPIC_IDS.map((topic) => `${topic}: ${GUIDE_TOPICS[topic].title}`).join('; ');
}
