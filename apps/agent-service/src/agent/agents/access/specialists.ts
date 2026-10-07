import { AgentConfiguration } from '../../configuration';
import { loadAccessAgentMarkdown } from './loadMarkdown';

const accessServiceUserRole = 'urn:ads:platform:agent-service:agent-user';
const baseKnowledge = loadAccessAgentMarkdown('baseKnowledge.md');

export const clientAgent: AgentConfiguration = {
  name: 'Access Service Client Agent',
  description: 'Provides static ADSP guidance for Keycloak client configuration.',
  instructions: `${baseKnowledge}\n\n${loadAccessAgentMarkdown('clientAgent.md')}\n\n## Client configuration reference\n\n${loadAccessAgentMarkdown('clients.md')}`,
  userRoles: [accessServiceUserRole],
};

export const tokenRoleAgent: AgentConfiguration = {
  name: 'Access Service Token and Role Agent',
  description: 'Provides static ADSP guidance for Keycloak token validation, audiences, and roles.',
  instructions: `${baseKnowledge}\n\n${loadAccessAgentMarkdown('tokenRoleAgent.md')}`,
  userRoles: [accessServiceUserRole],
};

export const identityProviderAgent: AgentConfiguration = {
  name: 'Access Service Identity Provider Agent',
  description: 'Provides static ADSP guidance for tenant identity-provider brokering in Keycloak.',
  instructions: `${baseKnowledge}\n\n${loadAccessAgentMarkdown('identityProviderAgent.md')}`,
  userRoles: [accessServiceUserRole],
};

export const architectAgent: AgentConfiguration = {
  name: 'Access Service Infrastructure Architect Agent',
  description:
    'Explains Access Service deployment architecture, infrastructure dependencies, recovery procedures, and operational responsibilities.',
  instructions: `${baseKnowledge}\n\n${loadAccessAgentMarkdown('architectAgent.md')}`,
  userRoles: [accessServiceUserRole],
};
