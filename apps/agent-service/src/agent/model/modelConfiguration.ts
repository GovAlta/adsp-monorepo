import type { AgentExecutionOptions } from '@mastra/core/agent';
import { environment } from '../../environments/environment';
import { FORM_GENERATION_AGENT_ID } from './executionLimits';

export function getAgentModelId(agentId?: string): string {
  return agentId === FORM_GENERATION_AGENT_ID && environment.AGENT_FORM_GENERATION_MODEL
    ? environment.AGENT_FORM_GENERATION_MODEL
    : environment.MODEL;
}

export function getAgentModelConfiguration(modelId = environment.MODEL) {
  return environment.MODEL_URL
    ? {
        providerId: 'openai',
        modelId,
        url: environment.MODEL_URL,
        apiKey: environment.MODEL_API_KEY,
      }
    : modelId;
}

export function getFormGenerationProviderOptions(): AgentExecutionOptions['providerOptions'] {
  const reasoningOptions = reasoningEffortOptions();

  return environment.MODEL_URL
    ? { openai: { parallel_tool_calls: false, ...reasoningOptions } }
    : { openai: { parallelToolCalls: false, ...reasoningOptions } };
}

export type GenerationRole = 'planner' | 'step';

/** Step building is mechanical transcription and can run on a smaller model than planning. */
export function getGenerationModelId(role: GenerationRole): string {
  const stepModel = role === 'step' ? environment.AGENT_FORM_GENERATION_STEP_MODEL : '';

  return stepModel || getAgentModelId(FORM_GENERATION_AGENT_ID);
}

/** Planner and step-builder calls use no tools, so they take reasoning effort without the tool-call settings. */
export function getGenerationReasoningOptions(role?: GenerationRole): AgentExecutionOptions['providerOptions'] {
  return { openai: reasoningEffortOptions(role) };
}

function reasoningEffortOptions(role?: GenerationRole) {
  const effort = roleReasoningEffort(role) || environment.AGENT_FORM_GENERATION_REASONING_EFFORT;

  return effort ? { reasoningEffort: effort } : {};
}

function roleReasoningEffort(role?: GenerationRole): string {
  if (role === 'planner') {
    return environment.AGENT_FORM_GENERATION_PLANNER_REASONING_EFFORT;
  }

  return role === 'step' ? environment.AGENT_FORM_GENERATION_STEP_REASONING_EFFORT : '';
}
