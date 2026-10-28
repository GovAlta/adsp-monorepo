import { AgentConfiguration } from '../../configuration';
import { ACCESS_SERVICE_AGENT_MAX_STEPS } from '../../model/executionLimits';
import { ACCESS_CLIENT_TOOL_IDS, ACCESS_DISCOVERY_TOOL_IDS } from './discovery/types';
import { loadAccessAgentMarkdown } from './loadMarkdown';

export const ACCESS_SERVICE_AGENTS = ['clientAgent', 'tokenRoleAgent', 'identityProviderAgent', 'architectAgent'];
const baseKnowledge = loadAccessAgentMarkdown('baseKnowledge.md');
const supervisorInstructions = loadAccessAgentMarkdown('supervisor/supervisor.md');

export const accessServiceAgent: AgentConfiguration = {
  name: 'Access Service Agent',
  description:
    'Provides ADSP developers and support staff with guidance for understanding and troubleshooting the Access Service and Keycloak.',
  instructions: `${baseKnowledge}\n\n${supervisorInstructions}`,
  userRoles: ['urn:ads:platform:agent-service:agent-user'],
  agents: ACCESS_SERVICE_AGENTS,
  tools: [...ACCESS_DISCOVERY_TOOL_IDS, ...ACCESS_CLIENT_TOOL_IDS],
  maxSteps: ACCESS_SERVICE_AGENT_MAX_STEPS,
};
