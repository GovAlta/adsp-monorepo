import { AgentConfigurations } from '../configuration';
import { formGenerationAgent, formUpdateAgent, pdfFormAnalysisAgent } from './forms';
import {
  builderAgent,
  builderPreviewReliabilityAgent,
  builderPrototypeCoderAgent,
  builderWorkspaceAnalystAgent,
} from './builder';
import { pdfGenerationAgent } from './pdf';
import { nxAdspAgent } from './nxAdsp';
import { notificationEmailTemplateAgent } from './notification';
import { accessServiceAgent } from './access/accessService';
import { clientAgent, identityProviderAgent, tokenRoleAgent, architectAgent } from './access/specialists';
import { ACCESS_SERVICE_AGENT_ID } from '../model/executionLimits';

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
  [ACCESS_SERVICE_AGENT_ID]: accessServiceAgent,
  clientAgent,
  tokenRoleAgent,
  identityProviderAgent,
  architectAgent,
};
