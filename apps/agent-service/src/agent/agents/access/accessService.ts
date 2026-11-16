import { AgentConfiguration } from '../../configuration';
import { ACCESS_SERVICE_AGENT_MAX_STEPS } from '../../model/executionLimits';
import {
  ACCESS_CLIENT_TOOL_IDS,
  ACCESS_DISCOVERY_TOOL_IDS,
  ACCESS_GUIDE_TOOL_IDS,
  ACCESS_ROLE_TOOL_IDS,
  ACCESS_USER_TOOL_IDS,
} from './discovery/types';
import { ACCESS_FULL_INSTRUCTIONS } from './routing';

// Each model call gets only the instruction sections and tools its question needs (see supervisorOptions.ts);
// these full instructions apply only when a call is made without that per-step selection.
export const accessServiceAgent: AgentConfiguration = {
  name: 'Access Service Agent',
  description:
    'Provides ADSP developers and support staff with guidance for understanding and troubleshooting the Access Service and Keycloak.',
  instructions: ACCESS_FULL_INSTRUCTIONS,
  userRoles: ['urn:ads:platform:agent-service:agent-user'],
  tools: [
    ...ACCESS_GUIDE_TOOL_IDS,
    ...ACCESS_DISCOVERY_TOOL_IDS,
    ...ACCESS_CLIENT_TOOL_IDS,
    ...ACCESS_USER_TOOL_IDS,
    ...ACCESS_ROLE_TOOL_IDS,
  ],
  maxSteps: ACCESS_SERVICE_AGENT_MAX_STEPS,
};
