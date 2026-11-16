import { accessServiceAgent } from './accessService';
import { loadAccessAgentMarkdown } from './loadMarkdown';
import { ACCESS_SERVICE_AGENT_IDS, ACCESS_SERVICE_PII_TYPES, isAccessServiceAgentId } from './piiGuardrailConfig';
import { createAccessServiceSupervisorOptions, prepareAccessStep } from './supervisorOptions';
import { ACCESS_ENVIRONMENTS } from './discovery/environments';
import { ACCESS_SERVICE_AGENT_MAX_STEPS } from '../../model/executionLimits';

const userMessage = (text: string) => ({ role: 'user', content: { format: 2, parts: [{ type: 'text', text }] } });
const requestContext = (values: Record<string, unknown>) => ({ get: (key: string) => values[key] });

describe('accessServiceAgent', () => {
  it('answers with the guide and read-only live tools, without sub-agents', () => {
    expect(accessServiceAgent.name).toBe('Access Service Agent');
    expect(accessServiceAgent.userRoles).toEqual(['urn:ads:platform:agent-service:agent-user']);
    expect(accessServiceAgent.agents).toBeUndefined();
    expect(accessServiceAgent.tools).toEqual([
      'getAccessGuide',
      'listAccessEnvironments',
      'listAccessRealms',
      'getAccessRealmInfo',
      'listAccessClients',
      'getAccessClient',
      'checkAccessClientSetup',
      'checkAccessClientUrl',
      'previewAccessToken',
      'getAccessServiceAccount',
      'findAccessUser',
      'getAccessUserRoles',
      'getAccessUserSignInStatus',
      'checkAccessUserForService',
      'compareAccessUsers',
      'listAccessServiceRoles',
      'getAccessRole',
      'listAccessRoleMembers',
    ]);
    expect(accessServiceAgent.mcp).toBeUndefined();
    expect(accessServiceAgent.workspace?.enabled).not.toBe(true);
    expect(accessServiceAgent.maxSteps).toBe(ACCESS_SERVICE_AGENT_MAX_STEPS);
  });

  it('tells the agent to answer beginners plainly, ask when vague and not repeat suggestions', () => {
    expect(accessServiceAgent.instructions).toContain('Open with one plain sentence that answers the question');
    expect(accessServiceAgent.instructions).toContain('ask one short question with choices instead of guessing');
    expect(accessServiceAgent.instructions).toContain('Never repeat usernames, client IDs, or roles that a card lists');
    expect(accessServiceAgent.instructions).toContain('end with who can fix it');
    expect(accessServiceAgent.instructions).toContain('For a simple greeting such as "Hello world", reply briefly.');
  });

  it('tells the agent not to repeat what a card shows', () => {
    expect(accessServiceAgent.instructions).toContain('Never repeat what a card shows');
    expect(accessServiceAgent.instructions).toContain('give only the direct answer');
  });

  it('names every tool the agent can use', () => {
    for (const toolId of accessServiceAgent.tools as string[]) {
      expect(accessServiceAgent.instructions).toContain(`\`${toolId}\``);
    }
  });

  it('keeps people out of Production while allowing apps and roles', () => {
    expect(accessServiceAgent.instructions).toContain('Users can never be inspected in Production');
    expect(accessServiceAgent.instructions).toContain("A person's token cannot be previewed in Production.");
    expect(accessServiceAgent.instructions).toContain('Setup values always use `<client-secret>` as a placeholder.');
  });

  it('keeps every environment read-only and personal details private', () => {
    expect(accessServiceAgent.instructions).toContain(
      'Every environment, including Production, is read-only. Refuse any request to create, change, or delete',
    );
    expect(accessServiceAgent.instructions).toContain(
      'Never request or repeat passwords, client secrets, access tokens, keys, or personal details',
    );
  });

  it('answers documented questions from the guide, without disclaimers or delegation', () => {
    expect(accessServiceAgent.instructions).toContain('call `getAccessGuide` with the matching topic');
    expect(accessServiceAgent.instructions).toContain('Documented facts are real: share them directly');
    expect(accessServiceAgent.instructions).not.toMatch(/delegat|specialist/i);
  });

  it('keeps every instruction section within its size budget', () => {
    expect(loadAccessAgentMarkdown('supervisor/supervisor.md').length).toBeLessThanOrEqual(4000);
    expect(loadAccessAgentMarkdown('supervisor/discoveryTools.md').length).toBeLessThanOrEqual(600);
    expect(loadAccessAgentMarkdown('supervisor/clientTools.md').length).toBeLessThanOrEqual(1800);
    expect(loadAccessAgentMarkdown('supervisor/peopleTools.md').length).toBeLessThanOrEqual(2100);
    expect(accessServiceAgent.instructions.length).toBeLessThanOrEqual(8400);
  });
});

describe('Access Service knowledge', () => {
  it('documents the same environment hosts that the discovery tools use', () => {
    const baseKnowledge = loadAccessAgentMarkdown('baseKnowledge.md');
    const documentedHosts = Array.from(baseKnowledge.matchAll(/`(https:\/\/access[^`]*)`/g), ([, host]) => host);

    expect(documentedHosts).toEqual(ACCESS_ENVIRONMENTS.map(({ host }) => host));
  });

  it('loads Markdown only from inside the agent folder', () => {
    expect(loadAccessAgentMarkdown('baseKnowledge.md')).toContain('Access Service Base Knowledge');
    expect(loadAccessAgentMarkdown('supervisor/supervisor.md')).toContain('# Access Service assistant');
    expect(() => loadAccessAgentMarkdown('../security.md')).toThrow('Invalid Access Service agent Markdown filename');
  });
});

describe('Access Service PII guardrail scope', () => {
  it('covers the Access Service agent only', () => {
    expect(Array.from(ACCESS_SERVICE_AGENT_IDS)).toEqual(['AccessServiceAgent']);
    expect(isAccessServiceAgentId('formGenerationAgent')).toBe(false);
  });

  it('redacts common personal identifier categories', () => {
    expect(ACCESS_SERVICE_PII_TYPES).toEqual([
      'email',
      'phone',
      'credit-card',
      'ssn',
      'name',
      'address',
      'date-of-birth',
    ]);
  });
});

describe('Access Service agent options', () => {
  const logger = { debug: jest.fn() } as never;

  it('bounds steps and reply length, and stops after display-only tools', () => {
    const options = createAccessServiceSupervisorOptions(logger);

    expect(options.maxSteps).toBe(ACCESS_SERVICE_AGENT_MAX_STEPS);
    expect(options.modelSettings?.maxOutputTokens).toBe(1000);
    expect(options.stopWhen).toBeDefined();
    expect(options.prepareStep).toBeDefined();
    expect((options as { delegation?: unknown }).delegation).toBeUndefined();
  });

  it('sends a person question only the guide and people tools', () => {
    const step = prepareAccessStep({
      messages: [userMessage('Is jsmith an admin?')],
      requestContext: requestContext({ user: { name: 'Sam Lee' } }),
    });

    expect(step.groups).toEqual(['people']);
    expect(step.activeTools).toContain('checkAccessUserForService');
    expect(step.activeTools).toContain('getAccessGuide');
    expect(step.activeTools).not.toContain('getAccessClient');
    expect(step.systemMessages[0].content).toContain('## People and role tools');
    expect(step.systemMessages[0].content).not.toContain('## Client and app tools');
    expect(step.systemMessages[0].content).toContain('User: Sam Lee');
  });

  it('follows the predefined question hint', () => {
    const step = prepareAccessStep({
      messages: [userMessage('List the Access Service environments and tell me which ones I can inspect.')],
      requestContext: requestContext({
        agentContext: { context: 'environment-realm', subtopic: 'inspectable-environments' },
      }),
    });

    expect(step.groups).toEqual(['discovery']);
  });

  it('gives small talk only the guide', () => {
    const step = prepareAccessStep({ messages: [userMessage('hi')], requestContext: requestContext({}) });

    expect(step.groups).toEqual([]);
    expect(step.activeTools).toEqual(['getAccessGuide']);
  });

  it('leaves the time of day out of the instructions so the prefix can be cached', () => {
    const step = prepareAccessStep({ messages: [userMessage('hi')], requestContext: requestContext({}) });

    expect(step.systemMessages[0].content).toMatch(/Current date: \d{4}-\d{2}-\d{2}\n/);
    expect(step.systemMessages[0].content).not.toMatch(/Current time|T\d{2}:\d{2}/);
  });
});
