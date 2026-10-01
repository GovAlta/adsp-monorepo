import type { AgentExecutionOptions } from '@mastra/core/agent';
import { environment } from '../../environments/environment';
import { FORM_GENERATION_AGENT_ID } from './executionLimits';

export interface AgentModelConfiguration {
  id?: string;
  reasoningEffort?: string;
  headers?: Record<string, string>;
}

export function getAgentModelId(agentId?: string, modelConfig?: AgentModelConfiguration): string {
  if (modelConfig?.id) {
    return modelConfig.id;
  }
  return agentId === FORM_GENERATION_AGENT_ID && environment.AGENT_FORM_GENERATION_MODEL
    ? environment.AGENT_FORM_GENERATION_MODEL
    : environment.MODEL;
}

export function getAgentModelConfiguration(modelId = environment.MODEL, modelConfig?: AgentModelConfiguration) {
  return environment.MODEL_URL
    ? {
        providerId: 'openai',
        modelId,
        url: environment.MODEL_URL,
        apiKey: environment.MODEL_API_KEY,
        ...(modelConfig?.headers ? { defaultHeaders: modelConfig.headers } : {}),
      }
    : modelId;
}

export function getAgentProviderOptions(
  agentId?: string,
  modelConfig?: AgentModelConfiguration,
): AgentExecutionOptions['providerOptions'] | undefined {
  const isFormGen = agentId === FORM_GENERATION_AGENT_ID;
  if (!isFormGen && !modelConfig?.reasoningEffort) {
    return undefined;
  }

  const providerOpts: Record<string, string | boolean> = {};

  if (isFormGen) {
    if (environment.MODEL_URL) {
      providerOpts.parallel_tool_calls = false;
    } else {
      providerOpts.parallelToolCalls = false;
    }
  }

  const effort = modelConfig?.reasoningEffort || (isFormGen ? (environment.AGENT_FORM_GENERATION_REASONING_EFFORT || '') : '');
  if (effort) {
    providerOpts.reasoningEffort = effort;
  }

  return Object.keys(providerOpts).length > 0 ? { openai: providerOpts } : undefined;
}

/** @deprecated Use getAgentProviderOptions(FORM_GENERATION_AGENT_ID) instead. */
export function getFormGenerationProviderOptions(): AgentExecutionOptions['providerOptions'] {
  return getAgentProviderOptions(FORM_GENERATION_AGENT_ID) ?? { openai: {} };
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
