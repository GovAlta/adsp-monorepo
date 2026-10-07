import { AgentConfiguration } from '../../../configuration';
import { loadAccessAgentMarkdown } from '../loadMarkdown';

const accessServiceUserRole = 'urn:ads:platform:agent-service:agent-user';
const baseKnowledge = loadAccessAgentMarkdown('baseKnowledge.md');

export const tokenRoleAgent: AgentConfiguration = {
  name: 'Access Service Token and Role Agent',
  description: 'Provides static ADSP guidance for Keycloak token validation, audiences, and roles.',
  instructions: `${baseKnowledge}\n\n${loadAccessAgentMarkdown('tokenRoleAgent/tokenRoleAgent.md')}`,
  userRoles: [accessServiceUserRole],
};
