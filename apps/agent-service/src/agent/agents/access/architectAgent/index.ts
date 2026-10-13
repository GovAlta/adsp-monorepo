import { AgentConfiguration } from '../../../configuration';
import { loadAccessAgentMarkdown } from '../loadMarkdown';

const accessServiceUserRole = 'urn:ads:platform:agent-service:agent-user';
const baseKnowledge = loadAccessAgentMarkdown('baseKnowledge.md');

export const architectAgent: AgentConfiguration = {
  name: 'Access Service Infrastructure Architect Agent',
  description:
    'Explains Access Service deployment architecture, infrastructure dependencies, recovery procedures, and operational responsibilities.',
  instructions: `${baseKnowledge}\n\n${loadAccessAgentMarkdown('architectAgent/architectAgent.md')}`,
  userRoles: [accessServiceUserRole],
};
