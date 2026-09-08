import { environment } from '../../environments/environment';

export const FORM_GENERATION_AGENT_ID = 'formGenerationAgent';

export interface AgentExecutionLimits {
  timeoutMs: number;
  maxSteps?: number;
}

export function getAgentExecutionLimits(agentId?: string): AgentExecutionLimits {
  if (agentId === FORM_GENERATION_AGENT_ID) {
    return {
      timeoutMs: environment.AGENT_FORM_GENERATION_TIMEOUT_MS,
      maxSteps: environment.AGENT_FORM_GENERATION_MAX_STEPS,
    };
  }

  return { timeoutMs: environment.AGENT_REQUEST_TIMEOUT_MS };
}
