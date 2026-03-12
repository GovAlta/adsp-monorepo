import { AgentConfigurations } from '../configuration';
import { formGenerationAgent, formUpdateAgent, pdfFormAnalysisAgent } from './form';

export const CoreAgents: AgentConfigurations = {
  formGenerationAgent,
  formUpdateAgent,
  pdfFormAnalysisAgent,
};
