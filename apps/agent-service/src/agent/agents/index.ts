import { AgentConfigurations } from '../configuration';
import { formGenerationAgent, pdfFormAnalysisAgent } from './form';

export const CoreAgents: AgentConfigurations = {
  formGenerationAgent,
  pdfFormAnalysisAgent,
};
