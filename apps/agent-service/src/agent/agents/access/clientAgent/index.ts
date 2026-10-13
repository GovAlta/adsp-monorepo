import { AgentConfiguration } from '../../../configuration';
import { loadAccessAgentMarkdown } from '../loadMarkdown';

const accessServiceUserRole = 'urn:ads:platform:agent-service:agent-user';
const baseKnowledge = loadAccessAgentMarkdown('baseKnowledge.md');

export const clientAgent: AgentConfiguration = {
  name: 'Access Service Client Agent',
  description: 'Provides static ADSP guidance for Keycloak client configuration.',
  instructions: `${baseKnowledge}\n\n${loadAccessAgentMarkdown('clientAgent/clientAgent.md')}\n\n## Client configuration reference\n\n${loadAccessAgentMarkdown('clientAgent/clients.md')}`,
  userRoles: [accessServiceUserRole],
};
