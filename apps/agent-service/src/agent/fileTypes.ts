import { FileType, SecurityClassifications } from '@abgov/adsp-service-sdk';
import { ServiceRoles } from './roles';

export const AGENT_ATTACHMENTS = 'agent-attachments';

export const AgentAttachmentsFileType: FileType = {
  id: AGENT_ATTACHMENTS,
  name: 'Agent attachments',
  anonymousRead: false,
  securityClassification: SecurityClassifications.ProtectedB,
  readRoles: [`urn:ads:platform:agent-service:${ServiceRoles.AgentTool}`],
  updateRoles: [`urn:ads:platform:agent-service:${ServiceRoles.AgentUser}`],
  rules: {
    retention: {
      active: true,
      deleteInDays: 7,
    },
  },
};
