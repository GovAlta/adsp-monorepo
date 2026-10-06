import { AgentConfiguration } from '../../configuration';
import { ACCESS_SERVICE_AGENT_MAX_STEPS } from '../../model/executionLimits';
import { loadAccessAgentMarkdown } from './loadMarkdown';

export const ACCESS_SERVICE_AGENTS = ['clientAgent', 'tokenRoleAgent', 'identityProviderAgent', 'architectAgent'];
const baseKnowledge = loadAccessAgentMarkdown('baseKnowledge.md');
const supervisorInstructions = loadAccessAgentMarkdown('supervisor.md');

export const accessServiceAgent: AgentConfiguration = {
  name: 'Access Service Agent',
  description:
    'Provides ADSP developers and support staff with guidance for understanding and troubleshooting the Access Service and Keycloak.',
  instructions: `${baseKnowledge}\n\n${supervisorInstructions}`,
  userRoles: ['urn:ads:platform:agent-service:agent-user'],
  agents: ACCESS_SERVICE_AGENTS,
  maxSteps: ACCESS_SERVICE_AGENT_MAX_STEPS,
};
