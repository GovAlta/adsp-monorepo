import { AgentConfiguration } from '../../../configuration';
import { loadAccessAgentMarkdown } from '../loadMarkdown';

const accessServiceUserRole = 'urn:ads:platform:agent-service:agent-user';
const baseKnowledge = loadAccessAgentMarkdown('baseKnowledge.md');

export const identityProviderAgent: AgentConfiguration = {
  name: 'Access Service Identity Provider Agent',
  description: 'Provides static ADSP guidance for tenant identity-provider brokering in Keycloak.',
  instructions: `${baseKnowledge}\n\n${loadAccessAgentMarkdown('identityProviderAgent/identityProviderAgent.md')}`,
  userRoles: [accessServiceUserRole],
};
