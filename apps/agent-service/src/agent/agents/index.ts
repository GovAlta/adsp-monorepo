import { AgentConfigurations } from '../configuration';
import { formGenerationAgent, formUpdateAgent, pdfFormAnalysisAgent } from './form';
import {
  builderAgent,
  builderPreviewReliabilityAgent,
  builderPrototypeCoderAgent,
  builderWorkspaceAnalystAgent,
} from './builder';

export const CoreAgents: AgentConfigurations = {
  formGenerationAgent,
  formUpdateAgent,
  pdfFormAnalysisAgent,
  builderWorkspaceAnalystAgent,
  builderPrototypeCoderAgent,
  builderPreviewReliabilityAgent,
  builderAgent,
};
