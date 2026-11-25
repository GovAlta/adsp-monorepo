import { environment } from '../../../../../environments/environment';
import { AgentConfiguration } from '../../../../configuration';
import { FORM_GENERATION_FULL_INSTRUCTIONS, FORM_GENERATION_TOOL_IDS } from './routing';

// Each model call gets only the instruction sections and tools its question needs, with the saved form described in
// its instructions (see stepOptions.ts). These full instructions apply only when a call is made without that
// per-step selection. Worked examples load on demand with formExamplesTool.
export const formGenerationAgent: AgentConfiguration = {
  name: 'Form Generation Agent',
  description: `This agent supports users in configuring forms in the ADSP Form Service.
    It generates configuration compatible with the service based on user descriptions of
    the form's purpose, the information it needs to collect, and specifics around fields,
    help content, and layout.`,

  // Deployments can still tune the limits with AGENT_FORM_GENERATION_MAX_STEPS and AGENT_FORM_GENERATION_TIMEOUT_MS.
  maxSteps: environment.AGENT_FORM_GENERATION_MAX_STEPS,
  timeoutMs: environment.AGENT_FORM_GENERATION_TIMEOUT_MS,

  instructions: FORM_GENERATION_FULL_INSTRUCTIONS,
  tools: FORM_GENERATION_TOOL_IDS,
  userRoles: ['urn:ads:platform:configuration-service:configuration-admin'],
};
