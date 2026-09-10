import { environment } from '../../environments/environment';
import { FORM_GENERATION_AGENT_ID, getAgentExecutionLimits } from './executionLimits';

describe('getAgentExecutionLimits', () => {
  it('uses the default abort and no maxSteps for other agents', () => {
    expect(getAgentExecutionLimits('pdfFormAnalysisAgent')).toEqual({
      timeoutMs: environment.AGENT_REQUEST_TIMEOUT_MS,
    });
  });

  it('uses the form generation timeout and maxSteps for formGenerationAgent', () => {
    expect(getAgentExecutionLimits(FORM_GENERATION_AGENT_ID)).toEqual({
      timeoutMs: environment.AGENT_FORM_GENERATION_TIMEOUT_MS,
      maxSteps: environment.AGENT_FORM_GENERATION_MAX_STEPS,
    });
  });
});
