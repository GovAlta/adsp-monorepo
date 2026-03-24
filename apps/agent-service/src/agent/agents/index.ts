import { AgentConfigurations } from '../configuration';
import { formGenerationAgent, formUpdateAgent, pdfFormAnalysisAgent } from './form';
import { builderAgent } from './builder';

export const CoreAgents: AgentConfigurations = {
  formGenerationAgent,
  formUpdateAgent,
  pdfFormAnalysisAgent,
  builderAgent,
};
