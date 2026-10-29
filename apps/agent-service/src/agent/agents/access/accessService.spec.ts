import { accessServiceAgent } from './accessService';
import { loadAccessAgentMarkdown } from './loadMarkdown';
import { clientAgent, identityProviderAgent, tokenRoleAgent, architectAgent } from './specialists';
import { ACCESS_SERVICE_AGENT_IDS, ACCESS_SERVICE_PII_TYPES, isAccessServiceAgentId } from './piiGuardrailConfig';
import { createAccessServiceSupervisorOptions } from './supervisorOptions';
import { ACCESS_ENVIRONMENTS } from './discovery/environments';
import { ACCESS_SERVICE_AGENT_MAX_STEPS } from '../../model/executionLimits';

describe('accessServiceAgent', () => {
  it('orchestrates the configured read-only agents, discovery tools and client tools', () => {
    expect(accessServiceAgent.name).toBe('Access Service Agent');
    expect(accessServiceAgent.userRoles).toEqual(['urn:ads:platform:agent-service:agent-user']);
    expect(accessServiceAgent.agents).toEqual([
      'clientAgent',
      'tokenRoleAgent',
      'identityProviderAgent',
      'architectAgent',
    ]);
    expect(accessServiceAgent.tools).toEqual([
      'listAccessEnvironments',
      'listAccessRealms',
      'getAccessRealmInfo',
      'listAccessClients',
      'getAccessClient',
    ]);
    expect(accessServiceAgent.mcp).toBeUndefined();
    expect(accessServiceAgent.workspace?.enabled).not.toBe(true);
  });

  it('bounds the supervisor broker to the Access Service step limit', () => {
    expect(accessServiceAgent.maxSteps).toBe(ACCESS_SERVICE_AGENT_MAX_STEPS);
  });

  it('uses static repository context and read-only live discovery', () => {
    expect(accessServiceAgent.instructions).toContain('# Access Service Base Knowledge');
    expect(accessServiceAgent.instructions).toContain('## Live Discovery Tools (read-only)');
    expect(accessServiceAgent.instructions).toContain('never invent realms, hosts, or realm details');
    expect(accessServiceAgent.instructions).toContain(
      'Production can be inspected with these tools but must never be changed',
    );
    expect(accessServiceAgent.instructions).not.toContain('cannot inspect live Keycloak realms');
    expect(accessServiceAgent.instructions).not.toContain('It cannot inspect clients');
    expect(accessServiceAgent.instructions).toContain('https://access.adsp-dev.gov.ab.ca');
    expect(accessServiceAgent.instructions).toContain('https://access-uat.alberta.ca');
    expect(accessServiceAgent.instructions).toContain('https://access.alberta.ca');
  });

  it('tells the supervisor to inspect clients read-only without inventing configuration or showing secrets', () => {
    expect(accessServiceAgent.instructions).toContain('## Live Client Tools (read-only)');
    expect(accessServiceAgent.instructions).toContain('never invent clients or configuration');
    expect(accessServiceAgent.instructions).toContain('Never describe configuration for a client that was not found');
    expect(accessServiceAgent.instructions).toContain(
      'The tools never return client secrets, credentials, keys, or tokens',
    );
    expect(accessServiceAgent.instructions).toContain('Inspecting a client never changes it, in any environment');
    expect(accessServiceAgent.instructions).toContain(
      "Mappers from the client's assigned client scopes are not included",
    );
  });

  it('tells the supervisor not to repeat what a tool result card already shows', () => {
    expect(accessServiceAgent.instructions).toContain('## Replying When a Tool Result Is Shown as a Card');
    for (const toolId of accessServiceAgent.tools as string[]) {
      expect(accessServiceAgent.instructions).toContain(`\`${toolId}\``);
    }
    expect(accessServiceAgent.instructions).toContain('Never repeat what a card shows');
    expect(accessServiceAgent.instructions).toContain('give only the direct answer');
    expect(accessServiceAgent.instructions).not.toContain('tell the user its `message` in plain language');
  });

  it('lets specialists reason from client configuration the supervisor read', () => {
    expect(clientAgent.instructions).toContain('when it gives you that configuration, reason from it');
    expect(clientAgent.instructions).not.toContain('Never claim to inspect or mutate a client');
    expect(tokenRoleAgent.instructions).toContain('client configuration it read with its read-only client tools');
  });

  it('documents the same environment hosts that the discovery tools use', () => {
    const baseKnowledge = loadAccessAgentMarkdown('baseKnowledge.md');
    const documentedHosts = Array.from(baseKnowledge.matchAll(/`(https:\/\/access[^`]*)`/g), ([, host]) => host);

    expect(documentedHosts).toEqual(ACCESS_ENVIRONMENTS.map(({ host }) => host));
  });

  it('tells every agent that Production must never be changed', () => {
    for (const agent of [accessServiceAgent, clientAgent, tokenRoleAgent]) {
      expect(agent.instructions).not.toContain('Production access is prohibited');
    }
    expect(clientAgent.instructions).toContain('Production is read-only and must never be changed');
    expect(tokenRoleAgent.instructions).toContain('Production is read-only and must never be changed');
  });

  it('loads each agent instruction from Markdown', () => {
    expect(loadAccessAgentMarkdown('baseKnowledge.md')).toContain('Access Service Base Knowledge');
    expect(loadAccessAgentMarkdown('supervisor/supervisor.md')).toContain('troubleshooting orchestrator');
    expect(loadAccessAgentMarkdown('clientAgent/clientAgent.md')).toContain('client-configuration specialist');
    expect(loadAccessAgentMarkdown('tokenRoleAgent/tokenRoleAgent.md')).toContain(
      'token-validation and authorization specialist',
    );
    expect(loadAccessAgentMarkdown('identityProviderAgent/identityProviderAgent.md')).toContain(
      'identity-provider specialist',
    );
    expect(loadAccessAgentMarkdown('architectAgent/architectAgent.md')).toContain('infrastructure architect');
    expect(() => loadAccessAgentMarkdown('../security.md')).toThrow('Invalid Access Service agent Markdown filename');
  });

  it('loads clients.md into the client agent only', () => {
    expect(loadAccessAgentMarkdown('clientAgent/clients.md')).toContain('Public client example: Tenant Admin Webapp');
    expect(clientAgent.instructions).toContain('Public client example: Tenant Admin Webapp');
    expect(tokenRoleAgent.instructions).not.toContain('Public client example: Tenant Admin Webapp');
    expect(identityProviderAgent.instructions).not.toContain('Public client example: Tenant Admin Webapp');
  });

  it('has instructions for an initial hello-world test', () => {
    expect(accessServiceAgent.instructions).toContain('Hello world');
    expect(accessServiceAgent.instructions).toContain('reply briefly without delegating');
  });
});

describe('Access Service agents', () => {
  it.each([
    ['clientAgent', clientAgent],
    ['tokenRoleAgent', tokenRoleAgent],
    ['identityProviderAgent', identityProviderAgent],
    ['architectAgent', architectAgent],
  ])('%s is a read-only leaf using static repository context', (_id, agent) => {
    expect(agent.instructions).toContain('# Access Service Base Knowledge');
    expect(agent.userRoles).toEqual(['urn:ads:platform:agent-service:agent-user']);
    expect(agent.tools).toBeUndefined();
    expect(agent.agents).toBeUndefined();
    expect(agent.mcp).toBeUndefined();
    expect(agent.workspace?.enabled).not.toBe(true);
  });
});

describe('Access Service PII guardrail scope', () => {
  it('covers the orchestrator and its agents only', () => {
    expect(Array.from(ACCESS_SERVICE_AGENT_IDS)).toEqual([
      'AccessServiceAgent',
      'clientAgent',
      'tokenRoleAgent',
      'identityProviderAgent',
      'architectAgent',
    ]);
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

describe('Access Service supervisor options', () => {
  it('bounds delegation and filters worker context', () => {
    const logger = { debug: jest.fn() } as never;
    const options = createAccessServiceSupervisorOptions(logger);

    expect(options.maxSteps).toBe(6);
    expect(options.delegation?.messageFilter).toBeDefined();
    expect(options.delegation?.onDelegationStart).toBeDefined();
    expect(options.delegation?.onDelegationComplete).toBeDefined();
  });
});
