import { AgentConfiguration } from '../../configuration';
import { PDF_GENERATION_AGENT_MAX_STEPS } from '../../model/executionLimits';
import { PDF_FULL_INSTRUCTIONS } from './instructions';
import { PDF_RETRIEVAL_TOOL, PDF_UPDATE_TOOL } from './types';

// Each model call gets short instructions and the saved template (see supervisorOptions.ts); these full instructions
// apply only when a call is made without that per-step preparation, and then the agent retrieves the template itself.
export const pdfGenerationAgent: AgentConfiguration = {
  name: 'PDF Template Generation Agent',
  description: `Creates, retrieves, modifies, and stores production-ready PDF templates
using HTML, CSS, and Handlebars syntax.`,
  instructions: PDF_FULL_INSTRUCTIONS,
  tools: [PDF_RETRIEVAL_TOOL, PDF_UPDATE_TOOL],
  userRoles: ['urn:ads:platform:configuration-service:configuration-admin'],
  maxSteps: PDF_GENERATION_AGENT_MAX_STEPS,
};
