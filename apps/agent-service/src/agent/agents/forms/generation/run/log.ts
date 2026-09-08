import type { Logger } from 'winston';

export interface GenerationLog {
  record(event: string, detail?: Record<string, unknown>): void;
}

// The prompt a step was given and the model output that failed are only worth carrying at debug.
const DEBUG_EVENTS = new Set(['plan-prompt', 'plan-raw', 'step-prompt', 'step-payload']);
const WARN_EVENTS = new Set(['step-rejected', 'step-failed']);

/**
 * One run's detail, tagged so a whole generation can be pulled out of the service log by form definition id.
 */
export function createGenerationLog(logger: Logger, formDefinitionId: string, tenantId?: string): GenerationLog {
  return {
    record(event, detail = {}) {
      const level = DEBUG_EVENTS.has(event) ? 'debug' : WARN_EVENTS.has(event) ? 'warn' : 'info';
      logger.log(level, `Form generation ${event} for ${formDefinitionId}.`, {
        context: 'formGeneration',
        tenant: tenantId,
        formDefinitionId,
        event,
        ...detail,
      });
    },
  };
}

/** Mastra attaches the raw model output to the error when structured output validation fails. */
export function modelOutputOf(err: unknown): string | undefined {
  const value = (err as { details?: { value?: unknown } })?.details?.value;
  return typeof value === 'string' ? value : undefined;
}
