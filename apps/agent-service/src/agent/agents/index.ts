import { AgentConfigurations } from '../configuration';
import { formGenerationAgent, formUpdateAgent, pdfFormAnalysisAgent } from './form';
import {
  builderAgent,
  builderPreviewReliabilityAgent,
  builderPrototypeCoderAgent,
  builderWorkspaceAnalystAgent,
} from './builder';
import { pdfGenerationAgent } from './pdf';

export const CoreAgents: AgentConfigurations = {
  formGenerationAgent,
  pdfGenerationAgent,
  formUpdateAgent,
  pdfFormAnalysisAgent,
  builderWorkspaceAnalystAgent,
  builderPrototypeCoderAgent,
  builderPreviewReliabilityAgent,
  builderAgent,
};
