import { accessServiceAgent } from './accessService';
import { loadAccessAgentMarkdown } from './loadMarkdown';
import { clientAgent, identityProviderAgent, tokenRoleAgent, architectAgent } from './specialists';
import { ACCESS_SERVICE_AGENT_IDS, ACCESS_SERVICE_PII_TYPES, isAccessServiceAgentId } from './piiGuardrailConfig';
import { createAccessServiceSupervisorOptions } from './supervisorOptions';
import { ACCESS_SERVICE_AGENT_MAX_STEPS } from '../../model/executionLimits';

describe('accessServiceAgent', () => {
  it('orchestrates the configured read-only agents', () => {
    expect(accessServiceAgent.name).toBe('Access Service Agent');
    expect(accessServiceAgent.userRoles).toEqual(['urn:ads:platform:agent-service:agent-user']);
    expect(accessServiceAgent.agents).toEqual([
      'clientAgent',
      'tokenRoleAgent',
      'identityProviderAgent',
      'architectAgent',
    ]);
    expect(accessServiceAgent.tools).toBeUndefined();
    expect(accessServiceAgent.mcp).toBeUndefined();
    expect(accessServiceAgent.workspace?.enabled).not.toBe(true);
  });

  it('bounds the supervisor broker to the Access Service step limit', () => {
    expect(accessServiceAgent.maxSteps).toBe(ACCESS_SERVICE_AGENT_MAX_STEPS);
  });

  it('uses static repository context and disclaims live access', () => {
    expect(accessServiceAgent.instructions).toContain('# Access Service Base Knowledge');
    expect(accessServiceAgent.instructions).toContain('cannot inspect live Keycloak realms');
    expect(accessServiceAgent.instructions).toContain('https://access.adsp-dev.gov.ab.ca');
    expect(accessServiceAgent.instructions).toContain('https://access-uat.alberta.ca');
    expect(accessServiceAgent.instructions).toContain('https://access.alberta.ca');
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
