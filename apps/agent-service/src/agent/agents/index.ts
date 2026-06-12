import { AgentConfigurations } from '../configuration';
import { formGenerationAgent, formUpdateAgent, pdfFormAnalysisAgent } from './form';
import {
  builderAgent,
  builderPreviewReliabilityAgent,
  builderPrototypeCoderAgent,
  builderWorkspaceAnalystAgent,
} from './builder';
import { pdfGenerationAgent } from './pdf';
import { nxAdspAgent } from './nxAdsp';
import { notificationEmailTemplateAgent } from './notification';

// clean-code-ignore: RULE-19
export const CoreAgents: AgentConfigurations = {
  formGenerationAgent,
  pdfGenerationAgent,
  formUpdateAgent,
  pdfFormAnalysisAgent,
  builderWorkspaceAnalystAgent,
  builderPrototypeCoderAgent,
  builderPreviewReliabilityAgent,
  builderAgent,
  nxAdspAgent,
  notificationEmailTemplateAgent,
};
