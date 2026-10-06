import { environment } from '../../environments/environment';
import { getAgentExecutionLimits } from './executionLimits';

describe('getAgentExecutionLimits', () => {
  it('uses the default timeout and no maxSteps when the agent configures neither', () => {
    expect(getAgentExecutionLimits()).toEqual({
      timeoutMs: environment.AGENT_REQUEST_TIMEOUT_MS,
    });
  });

  it('applies the configured maxSteps', () => {
    expect(getAgentExecutionLimits({ maxSteps: 30 })).toEqual({
      timeoutMs: environment.AGENT_REQUEST_TIMEOUT_MS,
      maxSteps: 30,
    });
  });

  it('applies the configured timeout', () => {
    expect(getAgentExecutionLimits({ timeoutMs: 900000, maxSteps: 12 })).toEqual({
      timeoutMs: 900000,
      maxSteps: 12,
    });
  });
});
