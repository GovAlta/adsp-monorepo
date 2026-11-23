import { environment } from '../../environments/environment';

export const FORM_GENERATION_AGENT_ID = 'formGenerationAgent';
export const ACCESS_SERVICE_AGENT_ID = 'AccessServiceAgent';
export const ACCESS_SERVICE_AGENT_MAX_STEPS = 6;
export const NOTIFICATION_TEMPLATE_AGENT_ID = 'notificationEmailTemplateAgent';
// A proposal, a retry after a rejected tool input, and a written reply.
export const NOTIFICATION_TEMPLATE_AGENT_MAX_STEPS = 3;
export const PDF_GENERATION_AGENT_ID = 'pdfGenerationAgent';
// A save, a retry after a rejected save, a second retry and a closing reply.
export const PDF_GENERATION_AGENT_MAX_STEPS = 4;

export interface AgentExecutionLimits {
  timeoutMs: number;
  maxSteps?: number;
}

/**
 * Resolves the execution limits from the agent's configuration, falling back to the service default timeout.
 * Without a maxSteps the framework stops after 5 steps, which can be spent entirely on tool calls and end
 * the turn with no reply.
 */
export function getAgentExecutionLimits({
  timeoutMs,
  maxSteps,
}: { timeoutMs?: number; maxSteps?: number } = {}): AgentExecutionLimits {
  return {
    timeoutMs: timeoutMs ?? environment.AGENT_REQUEST_TIMEOUT_MS,
    ...(maxSteps !== undefined ? { maxSteps } : {}),
  };
}
