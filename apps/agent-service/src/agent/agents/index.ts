import { AgentConfigurations } from '../configuration';
import { formGenerationAgent, formUpdateAgent, pdfFormAnalysisAgent } from './form';
import {
  builderAgent,
  builderPreviewReliabilityAgent,
  builderPrototypeCoderAgent,
  builderWorkspaceAnalystAgent,
} from './builder';
import { nxAdspAgent } from './nxAdsp';

// clean-code-ignore: RULE-19
export const CoreAgents: AgentConfigurations = {
  formGenerationAgent,
  formUpdateAgent,
  pdfFormAnalysisAgent,
  builderWorkspaceAnalystAgent,
  builderPrototypeCoderAgent,
  builderPreviewReliabilityAgent,
  builderAgent,
  nxAdspAgent,
};
