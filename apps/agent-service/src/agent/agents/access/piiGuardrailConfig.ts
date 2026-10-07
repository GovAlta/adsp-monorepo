import { ACCESS_SERVICE_AGENT_ID } from '../../model/executionLimits';

export const ACCESS_SERVICE_AGENT_IDS = new Set([
  ACCESS_SERVICE_AGENT_ID,
  'clientAgent',
  'tokenRoleAgent',
  'identityProviderAgent',
  'architectAgent',
]);

export const ACCESS_SERVICE_PII_TYPES = ['email', 'phone', 'credit-card', 'ssn', 'name', 'address', 'date-of-birth'];

export function isAccessServiceAgentId(agentId?: string): boolean {
  return agentId !== undefined && ACCESS_SERVICE_AGENT_IDS.has(agentId);
}
